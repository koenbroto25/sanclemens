import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { prefetchLiturgiBatch, getLiturgiHarian } from '@/lib/liturgi/liturgi-service';
import { validasiSkorTeologi } from '@/lib/ai/theology-scorer';
import { SYSTEM_PROMPT_BRUDER_IGNAS } from '@/lib/ai/persona-bruder-ignas';
import { SYSTEM_PROMPT_PATER_ANTON } from '@/lib/ai/persona-pater-anton';
import { format, addDays, getDay } from 'date-fns';

// ========== KONEKSI DATABASE ==========
// CockroachDB: untuk RAG retrieval
const cockroach = new Pool({
  host: process.env.COCKROACHDB_HOST,
  port: Number(process.env.COCKROACHDB_PORT || 26257),
  database: process.env.COCKROACHDB_DBNAME || 'defaultdb',
  user: process.env.COCKROACHDB_USER,
  password: process.env.COCKROACHDB_PASSWORD,
  ssl: { rejectUnauthorized: true },
});

// Supabase: untuk tabel aplikasi (renungan_harian, batch_kurasi, dll)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ========== GEMINI SETUP ==========
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const geminiModel = genai.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });

// ========== R2 CLIENT ==========
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const R2_BUCKET = process.env.R2_BUCKET_NAME!;

// ========== CONSTANTS ==========
const BOT_ACCESS_CALLER = 'bot_3';
const SERVICE_ACCESS_LEVEL = 10;
const MIN_SIMILARITY = 0.68;
const MAX_ATTEMPT = 3;

const TOPIC_PRIORITAS: Record<string, string[]> = {
  ignas: ['kitab_suci', 'katekismus', 'vatikan_ii', 'ensiklik', 'patristik', 'doktor_gereja'],
  anton: ['kitab_suci', 'ignatian', 'patristik_gurun', 'spiritualitas_klasik', 'patristik', 'doktor_gereja']
};

// ========== HELPER FUNCTIONS ==========
async function fetchFromR2(r2Key: string): Promise<string | null> {
  try {
    const res = await r2Client.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: r2Key }));
    return await res.Body!.transformToString("utf-8");
  } catch {
    return null;
  }
}

async function retrieveRenunganContext(tema: string, mode: 'ignas' | 'anton'): Promise<any[]> {
  try {
    // Generate embedding untuk query
    const embeddingModel = genai.getGenerativeModel({ model: 'models/gemini-embedding-2' });
    const embeddingResult = await embeddingModel.embedContent(tema);
    const queryEmbedding = embeddingResult.embedding.values;

    // Panggil search_rag_chunks() di CockroachDB
    const { rows } = await cockroach.query(
      `SELECT * FROM search_rag_chunks($1, $2, $3, $4, $5)`,
      [queryEmbedding, 'theology', BOT_ACCESS_CALLER, SERVICE_ACCESS_LEVEL, 15]
    );

    // Filter similarity minimum
    let hasil = (rows || []).filter((item: any) => item.similarity_score >= MIN_SIMILARITY);

    // Ambil theology_topic dari ai_knowledge_base
    const chunkIds = hasil.map((item: any) => item.chunk_id);
    let topicByChunk = new Map();
    if (chunkIds.length > 0) {
      const { rows: metaRows } = await cockroach.query(
        `SELECT chunk_id, theology_topic FROM ai_knowledge_base WHERE chunk_id = ANY($1)`,
        [chunkIds]
      );
      topicByChunk = new Map((metaRows || []).map((r: any) => [r.chunk_id, r.theology_topic || []]));
    }

    // Re-rank berdasarkan topic priority
    const prioritas = TOPIC_PRIORITAS[mode] || TOPIC_PRIORITAS.ignas;
    const reranked = hasil
      .map((item: any) => {
        const topics = topicByChunk.get(item.chunk_id) || [];
        const topicScore = topics.reduce((acc: number, t: string) => {
          const idx = prioritas.indexOf(t);
          return idx >= 0 ? acc + (prioritas.length - idx) : acc;
        }, 0);
        return { ...item, theology_topic: topics, topic_score: topicScore };
      })
      .sort((a: any, b: any) => {
        const scoreA = a.similarity_score * 0.7 + (a.topic_score / 10) * 0.3;
        const scoreB = b.similarity_score * 0.7 + (b.topic_score / 10) * 0.3;
        return scoreB - scoreA;
      })
      .slice(0, 5);

    // Content Hydration: fetch teks lengkap dari R2 HANYA untuk top-5
    const hydrated = await Promise.all(
      reranked.map(async (item: any) => ({
        ...item,
        content: (await fetchFromR2(item.content_r2_key)) || item.content_preview,
      }))
    );

    return hydrated;
  } catch (error) {
    console.error('Error retrieving RAG context:', error);
    return [];
  }
}

function generateValidationLog(skor: any): string {
  return `[${skor.total}/100] K:${skor.kristologis} D:${skor.doktrinal} P:${skor.pastoral} S:${skor.sumber} L:${skor.liturgi} - ${skor.lulus ? 'LULUS' : 'GAGAL'}`;
}

// ========== MAIN GENERATE ==========
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const mode: 'ignas' | 'anton' = body.mode || 'ignas';
    const targetDate = body.tanggal ? new Date(body.tanggal) : new Date();
    const tanggalStr = targetDate.toISOString().split('T')[0];
    const statusDefault = body.default_status || 'draft';
    const batchId = body.batch_id || null;

    // Cek duplikat
    const { data: existing } = await supabase
      .from('renungan_harian')
      .select('id')
      .eq('tanggal', tanggalStr)
      .eq('mode_persona', mode)
      .single();

    if (existing && !body.force_regenerate) {
      return NextResponse.json({
        message: 'Sudah ada',
        tanggal: tanggalStr,
        mode,
        id: existing.id,
        skip: true
      });
    }

    // Ambil data liturgi
    const liturgi = await getLiturgiHarian(targetDate);
    const tema_retrieval = `${liturgi.perayaan} ${liturgi.bacaan_list.slice(0, 3).join(' ')}`;
    
    // Ambil kutipan relevan dari CockroachDB via RAG
    const kutipanRelevan = await retrieveRenunganContext(tema_retrieval, mode);

    // Format kutipan untuk LLM
    const konteksTeologis = kutipanRelevan
      .map((k, i) => `[SUMBER ${i + 1}] ${k.content}\nReferensi: ${k.source_reference} (Relevansi: ${(k.similarity_score * 100).toFixed(0)}%)`)
      .join('\n\n---\n\n');

    // Pilih system prompt sesuai mode
    const systemPrompt = mode === 'ignas' ? SYSTEM_PROMPT_BRUDER_IGNAS : SYSTEM_PROMPT_PATER_ANTON;

    // Build user prompt
    const userPrompt = `
KONTEKS LITURGI HARI INI
Tanggal          : ${tanggalStr}
Perayaan         : ${liturgi.perayaan}
Tingkat Perayaan : ${liturgi.tingkat_perayaan}
Warna Liturgi    : ${liturgi.warna_liturgi}
Musim Liturgi    : ${liturgi.musim_liturgi}
Hari Minggu      : ${liturgi.is_minggu ? 'Ya' : 'Tidak'}

BACAAN LITURGI:
${liturgi.bacaan_list.length > 0
  ? liturgi.bacaan_list.join('\n')
  : '[Referensi bacaan tidak tersedia. Gunakan bacaan liturgi yang sesuai berdasarkan kalender liturgi Romawi.]'
}

KUTIPAN RELEVAN DARI DATABASE SUMBER AJARAN
(Diambil via search_rag_chunks() Ã¢â‚¬â€ RAG v6, domain: theology)
Gunakan yang paling relevan. Referensikan dengan [Nama Dokumen, Ã‚Â§nomor jika ada]
${konteksTeologis || '[Tidak ada kutipan relevan yang ditemukan. Gunakan pengetahuan teologi Katolik umum. JANGAN mengarang kutipan spesifik dalam tanda petik.]'}

INSTRUKSI AKHIR
Tulis renungan sesuai system prompt. Output HANYA format JSON. Tidak ada teks di luar JSON.
`.trim();

    // Generate dengan retry (maksimal 3 attempt)
    let renunganData: any = null;
    let skor: any = null;
    let attempt = 0;
    let berhasil = false;

    while (attempt < MAX_ATTEMPT && !berhasil) {
      attempt++;
      try {
        const result = await geminiModel.generateContent({
          systemInstruction: systemPrompt,
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            maxOutputTokens: 4096,
            temperature: 0.8,
            topP: 0.9,
          }
        });

        const rawOutput = result.response.text();
        const cleaned = rawOutput.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        renunganData = JSON.parse(cleaned);
      } catch (e) {
        console.error(`[Attempt ${attempt}] JSON parse error:`, e);
        await supabase.from('renungan_log_validasi').insert({
          tanggal: tanggalStr,
          mode_persona: mode,
          attempt_ke: attempt,
          alasan_gagal: 'Output AI bukan JSON valid',
          lulus: false
        });
        continue;
      }

      // Validasi skor teologis
      const teksUntukValidasi = renunganData.untuk_display?.teks_lengkap || JSON.stringify(renunganData.konten);
      
      skor = await validasiSkorTeologi({
        mode_persona: mode,
        warna_liturgi: liturgi.warna_liturgi ?? 'hijau', // fallback: Hijau = Masa Biasa, warna paling umum kalau data source kosong
        tingkat_perayaan: liturgi.tingkat_perayaan ?? 'biasa', // fallback: Hari Biasa kalau data source kosong
        teks_renungan: teksUntukValidasi
      }, geminiModel);

      await supabase.from('renungan_log_validasi').insert({
        tanggal: tanggalStr,
        mode_persona: mode,
        attempt_ke: attempt,
        skor_total: skor.total,
        skor_kristologis: skor.kristologis,
        skor_doktrinal: skor.doktrinal,
        alasan_gagal: skor.lulus ? null : skor.catatan.join(', '),
        lulus: skor.lulus
      });

      console.log(`[Validation] ${tanggalStr} (${mode}): ${generateValidationLog(skor)}`);

      if (skor.lulus) {
        berhasil = true;
        break;
      }
    }

    if (!berhasil) {
      return NextResponse.json({
        error: `Renungan gagal validasi teologi setelah ${MAX_ATTEMPT} attempt`,
        skor_terakhir: skor?.total,
        tanggal: tanggalStr,
        mode
      }, { status: 422 });
    }

    // Build record untuk disimpan ke Supabase
    const { metadata, konten, untuk_display } = renunganData;
    const tipeVariasi = metadata.tipe_variasi || {};

    const baseRecord: any = {
      tanggal: tanggalStr,
      mode_persona: mode,
      perayaan: liturgi.perayaan,
      tingkat_perayaan: liturgi.tingkat_perayaan ?? 'biasa', // fallback: Hari Biasa kalau data source kosong
      warna_liturgi: liturgi.warna_liturgi ?? 'hijau', // fallback: Hijau = Masa Biasa, warna paling umum kalau data source kosong
      musim_liturgi: liturgi.musim_liturgi,
      tema_renungan: metadata.tema_renungan,
      bacaan_utama: metadata.bacaan_utama,
      sumber_digunakan: metadata.sumber_ajaran_digunakan || [],
      tipe_sapaan: mode === 'ignas' ? tipeVariasi.sapaan : null,
      tipe_pintu_sabda: mode === 'ignas' ? tipeVariasi.pintu_sabda : null,
      tipe_kutipan: mode === 'ignas' ? tipeVariasi.kutipan : null,
      tipe_penutup: mode === 'ignas' ? tipeVariasi.penutup : null,
      tipe_doa: mode === 'ignas' ? tipeVariasi.doa : null,
      tipe_resonansi: mode === 'anton' ? metadata.tipe_resonansi : null,
      teks_lengkap: untuk_display.teks_lengkap,
      ringkasan_150_kata: untuk_display.ringkasan_150_kata,
      kutipan_unggulan: untuk_display.kutipan_unggulan,
      resonansi_untuk_notifikasi: untuk_display.resonansi_untuk_notifikasi || null,
      skor_kristologis: skor.kristologis,
      skor_doktrinal: skor.doktrinal,
      skor_pastoral: skor.pastoral,
      skor_sumber: skor.sumber,
      skor_liturgi: skor.liturgi,
      skor_total: skor.total,
      lulus_validasi: true,
      catatan_validasi: skor.catatan.join('; '),
      batch_id: batchId,
      status: statusDefault,
      status_kurasi: 'menunggu',
      model_digunakan: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    };

    if (mode === 'ignas') {
      Object.assign(baseRecord, {
        pengantar: konten.pengantar,
        pintu_sabda: konten.pintu_sabda,
        suara_tradisi: konten.suara_tradisi,
        cermin_kehidupan: konten.cermin_kehidupan,
        doa_penutup: konten.doa_penutup
      });
    } else {
      Object.assign(baseRecord, {
        cerita_pendek: konten.cerita_pendek,
        ayat_sabda: konten.ayat_sabda,
        pertanyaan_refleksi: konten.pertanyaan_refleksi,
        undangan_hening: typeof konten.undangan_hening === 'object'
          ? JSON.stringify(konten.undangan_hening)
          : konten.undangan_hening,
        resonansi_minggu: konten.resonansi_minggu
      });
    }

    const { data: saved, error: saveErr } = await supabase
      .from('renungan_harian')
      .upsert(baseRecord, { onConflict: 'tanggal,mode_persona' })
      .select('id')
      .single();

    if (saveErr) {
      return NextResponse.json({ error: saveErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tanggal: tanggalStr,
      mode,
      id: saved?.id,
      tema: metadata.tema_renungan,
      skor_total: skor.total
    });

  } catch (error: any) {
    console.error('Error in generate renungan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
