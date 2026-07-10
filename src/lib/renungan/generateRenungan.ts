import { format } from 'date-fns';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { SYSTEM_PROMPT_BRUDER_IGNAS } from '@/lib/ai/persona-bruder-ignas';
import { SYSTEM_PROMPT_PATER_ANTON } from '@/lib/ai/persona-pater-anton';
import { validasiSkorTeologi, generateValidationLog, SkorTeologi, KonteksValidasi } from '@/lib/ai/theology-scorer';
import { generateQueryEmbedding } from '@/lib/ai/retriever';
import { supabaseServer } from '@/lib/supabase/server';

function getGoogleApiKey(): string {
  const googleApiKey = process.env.GEMINI_API_KEY;
  if (!googleApiKey) {
    throw new Error('GEMINI_API_KEY is missing from environment variables.');
  }
  return googleApiKey;
}

let _genAI: GoogleGenerativeAI | null = null;
let _geminiModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

function getGeminiModel() {
  if (_geminiModel) return _geminiModel;
  const googleApiKey = getGoogleApiKey();
  _genAI = new GoogleGenerativeAI(googleApiKey);
  _geminiModel = _genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
  return _geminiModel;
}

const PERSONA_PROMPTS = {
  ignas: SYSTEM_PROMPT_BRUDER_IGNAS,
  anton: SYSTEM_PROMPT_PATER_ANTON,
};

export async function retrieveRenunganContext(
  query: string,
  embedding: number[],
  botAccess: string[]
): Promise<any[]> {
  const { data, error } = await supabaseServer.rpc('search_rag_chunks', {
    p_query_embedding: embedding,
    p_domain: 'theology',
    p_bot_access: botAccess,
    p_user_access_level: 10,
    p_limit: 10,
  });

  if (error) {
    console.error('Error searching RAG chunks for renungan generation:', error);
    return [];
  }
  return data || [];
}

export async function generateRenungan(
  date: Date,
  persona: 'ignas' | 'anton',
  liturgiData: any,
  attempt: number = 1
): Promise<any> {
  const geminiModel = getGeminiModel();
  const googleApiKey = getGoogleApiKey();

  const formattedDate = format(date, 'yyyy-MM-dd');
  const primaryReading = liturgiData.bacaan_list.find((b: any) => b.reference.includes('Injil')) || liturgiData.bacaan_list[0];

  if (!primaryReading || !primaryReading.text) {
    console.warn(`No primary reading text found for ${formattedDate}. Skipping renungan generation.`);
    return null;
  }

  const queryText = `${liturgiData.perayaan} ${liturgiData.tema_renungan} ${primaryReading.text}`;
  const queryEmbedding = await generateQueryEmbedding(queryText, googleApiKey);

  let relevantContext: { content: any; source_reference: any; score: any; r2Key: any; }[] = [];
  if (queryEmbedding) {
    const botAccessForRenungan = ['bot_3', 'bot_8'];
    const ragResults = await retrieveRenunganContext(queryText, queryEmbedding, botAccessForRenungan);

    relevantContext = ragResults
      .sort((a: any, b: any) => b.similarity_score - a.similarity_score)
      .slice(0, 5)
      .map((chunk: any) => ({
        content: chunk.content_preview,
        source_reference: chunk.source_reference,
        score: chunk.similarity_score,
        r2Key: chunk.content_r2_key,
      }));
  }

  const contextForLLM = relevantContext
    .map((c, idx) => `[SUMBER ${idx + 1}] ${c.content}\nReferensi: ${c.source_reference}`)
    .join('\n\n');

  const systemPrompt = PERSONA_PROMPTS[persona];

  const userPrompt = `
  ---
  METADATA LITURGI:
  Tanggal: ${formattedDate}
  Perayaan: ${liturgiData.perayaan}
  Tingkat Perayaan: ${liturgiData.tingkat_perayaan}
  Warna Liturgi: ${liturgiData.warna_liturgi}
  Musim Liturgi: ${liturgiData.musim_liturgi}
  Bacaan Utama (${primaryReading.reference}): ${primaryReading.text}
  ---

  ${contextForLLM ? `KONTEKS TEOLOGIS RELEVAN:\n${contextForLLM}\n---` : ''}

  Buatlah renungan harian sesuai persona dan struktur output JSON yang diminta dalam SYSTEM PROMPT.
  Pastikan tema renungan berakar kuat pada bacaan utama hari ini dan konsisten dengan konteks teologis.
  Pilih variasi untuk setiap bagian renungan sesuai aturan rotasi jika ada (misal: VAR-S1, VAR-PS-A, VAR-K-I, VAR-P1, VAR-D1).
  `;

  let generatedText: string;
  try {
    const chat = geminiModel.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });
    const result = await chat.sendMessage(userPrompt);
    generatedText = result.response.text();
  } catch (error) {
    console.error(`Gemini generate failed for ${formattedDate} (attempt ${attempt}):`, error);
    return null;
  }

  let parsedRenungan;
  try {
    parsedRenungan = JSON.parse(generatedText);
  } catch (e) {
    console.error(`Failed to parse JSON for ${formattedDate} (attempt ${attempt}):`, e);
    console.error('Raw LLM Output:', generatedText);
    return null;
  }

  const validationContext: KonteksValidasi = {
    mode_persona: persona,
    warna_liturgi: liturgiData.warna_liturgi,
    tingkat_perayaan: liturgiData.tingkat_perayaan,
    teks_renungan: parsedRenungan.untuk_display.teks_lengkap,
  };

  const scoreResult: SkorTeologi = await validasiSkorTeologi(validationContext, geminiModel);

  console.log(`[Validation] ${formattedDate} (${persona}): ${generateValidationLog(scoreResult)}`);

  await supabaseServer.from('renungan_log_validasi').insert({
    tanggal: formattedDate,
    mode_persona: persona,
    attempt_ke: attempt,
    skor_total: scoreResult.total,
    skor_kristologis: scoreResult.kristologis,
    skor_doktrinal: scoreResult.doktrinal,
    alasan_gagal: scoreResult.lulus ? null : scoreResult.catatan.join(', '),
    lulus: scoreResult.lulus,
  });

  if (!scoreResult.lulus) {
    if (attempt < 3) {
      console.warn(`Renungan for ${formattedDate} failed validation. Retrying (attempt ${attempt + 1})...`);
      return generateRenungan(date, persona, liturgiData, attempt + 1);
    } else {
      console.error(`Renungan for ${formattedDate} failed validation after 3 attempts. Marking as rejected.`);
      return {
        tanggal: formattedDate,
        mode_persona: persona,
        perayaan: liturgiData.perayaan,
        tingkat_perayaan: liturgiData.tingkat_perayaan,
        warna_liturgi: liturgiData.warna_liturgi,
        musim_liturgi: liturgiData.musim_liturgi,
        tema_renungan: parsedRenungan.metadata?.tema_renungan || 'Gagal Generate',
        bacaan_utama: primaryReading.reference,
        sumber_digunakan: [],
        pengantar: 'Gagal generate renungan setelah beberapa kali percobaan.',
        pintu_sabda: null, suara_tradisi: null, cermin_kehidupan: null, doa_penutup: null,
        cerita_pendek: null, ayat_sabda: null, pertanyaan_refleksi: null, undangan_hening: null, resonansi_minggu: null,
        teks_lengkap: 'Gagal generate renungan setelah beberapa kali percobaan.',
        ringkasan_150_kata: 'Gagal generate.',
        kutipan_unggulan: 'Gagal generate.',
        resonansi_untuk_notifikasi: null,
        skor_kristologis: scoreResult.kristologis,
        skor_doktrinal: scoreResult.doktrinal,
        skor_pastoral: scoreResult.pastoral,
        skor_sumber: scoreResult.sumber,
        skor_liturgi: scoreResult.liturgi,
        skor_total: scoreResult.total,
        lulus_validasi: false,
        catatan_validasi: scoreResult.catatan.join(', '),
        status: 'rejected',
        status_kurasi: 'ditolak_otomatis',
        batch_id: null,
        waktu_generate: new Date().toISOString(),
        model_digunakan: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        created_at: new Date().toISOString(),
      };
    }
  }

  return {
    tanggal: formattedDate,
    mode_persona: persona,
    perayaan: liturgiData.perayaan,
    tingkat_perayaan: liturgiData.tingkat_perayaan,
    warna_liturgi: liturgiData.warna_liturgi,
    musim_liturgi: liturgiData.musim_liturgi,
    tema_renungan: parsedRenungan.metadata.tema_renungan,
    bacaan_utama: parsedRenungan.metadata.bacaan_utama,
    sumber_digunakan: parsedRenungan.metadata.sumber_ajaran_digunakan || [],

    pengantar: persona === 'ignas' ? parsedRenungan.konten.pengantar : null,
    pintu_sabda: persona === 'ignas' ? parsedRenungan.konten.pintu_sabda : null,
    suara_tradisi: persona === 'ignas' ? parsedRenungan.konten.suara_tradisi : null,
    cermin_kehidupan: persona === 'ignas' ? parsedRenungan.konten.cermin_kehidupan : null,
    doa_penutup: persona === 'ignas' ? parsedRenungan.konten.doa_penutup : null,

    cerita_pendek: persona === 'anton' ? parsedRenungan.konten.cerita_pendek : null,
    ayat_sabda: persona === 'anton' ? parsedRenungan.konten.ayat_sabda : null,
    pertanyaan_refleksi: persona === 'anton' ? (parsedRenungan.konten.pertanyaan_refleksi.p1 + "\n\n" + parsedRenungan.konten.pertanyaan_refleksi.p2) : null,
    undangan_hening: persona === 'anton' ? (parsedRenungan.konten.undangan_hening.tiga_menit + "\n\n" + parsedRenungan.konten.undangan_hening.sepuluh_menit + "\n\n" + parsedRenungan.konten.undangan_hening.lebih_dari_itu) : null,
    resonansi_minggu: persona === 'anton' ? parsedRenungan.konten.resonansi_minggu : null,

    teks_lengkap: parsedRenungan.untuk_display.teks_lengkap,
    ringkasan_150_kata: parsedRenungan.untuk_display.ringkasan_150_kata,
    kutipan_unggulan: parsedRenungan.untuk_display.kutipan_unggulan,
    resonansi_untuk_notifikasi: parsedRenungan.untuk_display.resonansi_untuk_notifikasi || null,

    tipe_sapaan: persona === 'ignas' ? parsedRenungan.metadata.tipe_variasi.sapaan : null,
    tipe_pintu_sabda: persona === 'ignas' ? parsedRenungan.metadata.tipe_variasi.pintu_sabda : null,
    tipe_kutipan: persona === 'ignas' ? parsedRenungan.metadata.tipe_variasi.kutipan : null,
    tipe_penutup: persona === 'ignas' ? parsedRenungan.metadata.tipe_variasi.penutup : null,
    tipe_doa: persona === 'ignas' ? parsedRenungan.metadata.tipe_variasi.doa : null,
    tipe_resonansi: persona === 'anton' ? parsedRenungan.metadata.tipe_resonansi : null,

    skor_kristologis: scoreResult.kristologis,
    skor_doktrinal: scoreResult.doktrinal,
    skor_pastoral: scoreResult.pastoral,
    skor_sumber: scoreResult.sumber,
    skor_liturgi: scoreResult.liturgi,
    skor_total: scoreResult.total,
    lulus_validasi: scoreResult.lulus,
    catatan_validasi: scoreResult.catatan.join(', '),

    status: 'draft',
    status_kurasi: 'menunggu',
    batch_id: null,
    waktu_generate: new Date().toISOString(),
    model_digunakan: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    created_at: new Date().toISOString(),
  };
}