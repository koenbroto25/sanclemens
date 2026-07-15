// src/lib/ai/orchestrator/step3-intent-analysis.ts

import { getNextApiKey } from "@/middleware/ai-middleware";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface IntentAnalysisResult {
  initial_intent: string;
  domain_predicted: string;
  question_type_classified: string;
  target_bot_predicted: string;
  routing_confidence: number;
  needs_clarification: boolean;
  requires_tool_use: boolean;
  is_multi_domain: boolean;
  secondary_domain: string | null;
  formalized_query_en: string;
}

const VALID_DOMAINS = [
  "theology", "catechism_module", "renungan_harian", "public_info",
  "business_work", "charity_social", "admin_documents", "admin_lingkungan",
  "admin_parish", "system_guidance",
];

const VALID_BOTS = [
  "bot_1", "bot_2", "bot_3", "bot_4", "bot_5", "bot_6", "bot_7", "bot_8",
  "bot_pastor", "bot_super_admin",
];

function buildStep3Prompt(
  formalizedQuery: string,
  historyText: string,
  currentPage: string,
  currentBotId: string
): string {
  return `Anda adalah modul klasifikasi intent untuk sistem AI Paroki Katolik. Analisis pertanyaan
pengguna dan kembalikan HANYA JSON valid sesuai skema berikut, tanpa teks lain di luar JSON.

DOMAIN YANG VALID (pilih tepat satu untuk domain_predicted):
${VALID_DOMAINS.join(", ")}

BOT YANG VALID (untuk target_bot_predicted):
bot_1 (Penjaga Pintu - warta/jadwal/info umum)
bot_2 (CS Sekretariat)
bot_3 (Companion Rohani - pendampingan personal, curhat, bimbingan spiritual personal)
bot_4 (Asisten DPP)
bot_5 (Lingkungan)
bot_6 (Keluarga)
bot_7 (Pasar Kasih - usaha/lowongan/charity)
bot_8 (Learn Catholic - edukasi katekismus, ajaran, dogma, sejarah Gereja, teologi)
bot_pastor, bot_super_admin

KONTEKS SESI:
Bot yang sedang aktif: ${currentBotId}
Halaman saat ini: ${currentPage}
Riwayat percakapan (jika ada):
${historyText}

TUGAS:
1. Tentukan initial_intent: ringkasan niat pengguna dalam 1 kalimat singkat.
2. Tentukan domain_predicted dari daftar domain valid di atas.
3. Tentukan question_type_classified: kategori pertanyaan (contoh: dogmatic_explanation,
   historical_fact, practical_howto, personal_guidance, factual_lookup, comparison_request).
4. Tentukan target_bot_predicted: bot yang PALING TEPAT menjawab, dari daftar bot valid.
   Jika bot yang sedang aktif (${currentBotId}) sudah tepat, kembalikan bot yang sama.
5. routing_confidence: seberapa yakin Anda pada domain_predicted DAN target_bot_predicted
   sekaligus (0.0-1.0). Turunkan nilai ini jika pertanyaan ambigu atau bisa masuk >1 domain.
6. needs_clarification: true HANYA jika pertanyaan terlalu kabur untuk diklasifikasi sama
   sekali (contoh: "gimana itu?" tanpa konteks sebelumnya) -- BUKAN untuk pertanyaan yang
   sudah jelas topiknya walau singkat.
7. requires_tool_use: true jika pertanyaan butuh data real-time yang tidak ada di dokumen
   statis (contoh: "santo hari ini siapa?", "hari raya apa hari ini?").
8. is_multi_domain: true jika pertanyaan secara genuin menyentuh >1 domain sekaligus.
9. secondary_domain: isi HANYA jika is_multi_domain=true.
10. formalized_query_en: terjemahkan pertanyaan ke Inggris menggunakan TERMINOLOGI TEOLOGIS
    RESMI seperti dipakai dokumen Vatikan/USCCB berbahasa Inggris -- BUKAN parafrase bebas.
    Contoh: "transubstansiasi" -> "transubstantiation", "kodrat ilahi dan insani Kristus" ->
    "the divine and human natures of Christ". Pertahankan istilah Latin asli jika itu yang
    lazim dipakai di dokumen resmi berbahasa Inggris (contoh: "Magisterium", "Logos").

PERTANYAAN PENGGUNA: "${formalizedQuery}"

Kembalikan JSON dengan struktur PERSIS ini (semua field wajib ada):
{
  "initial_intent": string,
  "domain_predicted": string,
  "question_type_classified": string,
  "target_bot_predicted": string,
  "routing_confidence": number,
  "needs_clarification": boolean,
  "requires_tool_use": boolean,
  "is_multi_domain": boolean,
  "secondary_domain": string | null,
  "formalized_query_en": string
}`;
}

function conservativeFallback(currentBotId: string): IntentAnalysisResult {
  return {
    initial_intent: "tidak dapat dianalisis",
    domain_predicted: "public_info",
    question_type_classified: "general_query",
    target_bot_predicted: currentBotId,
    routing_confidence: 0,
    needs_clarification: true,
    requires_tool_use: false,
    is_multi_domain: false,
    secondary_domain: null,
    formalized_query_en: "",
  };
}

export async function analyzeIntent(
  formalizedQuery: string,
  chatHistory: ChatTurn[],
  currentPage: string,
  currentBotId: string
): Promise<IntentAnalysisResult> {
  const historyText = chatHistory.length > 0
    ? chatHistory.map((t) => `${t.role}: ${t.content}`).join("\n")
    : "(tidak ada riwayat, ini pesan pertama)";

  const prompt = buildStep3Prompt(formalizedQuery, historyText, currentPage, currentBotId);

  const geminiKey = getNextApiKey();
  if (!geminiKey) {
    // Pool key kosong sama sekali (bukan cuma satu key gagal) -- fallback konservatif
    return conservativeFallback(currentBotId);
  }

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" },
        }),
      }
    );
  } catch {
    return conservativeFallback(currentBotId);
  }

  if (!response.ok) {
    // TODO: kalau 429 (rate limit), idealnya retry dengan getNextApiKey() lagi.
    // ai-middleware.ts saat ini tidak punya logic ini (murni round-robin polos,
    // tanpa deteksi/skip key yang kena limit) -- dicatat sebagai perbaikan terpisah,
    // bukan diperbaiki di sini supaya tidak melebar dari cakupan Fase G1.
    return conservativeFallback(currentBotId);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  let parsed: IntentAnalysisResult;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return conservativeFallback(currentBotId);
  }

  if (!VALID_DOMAINS.includes(parsed.domain_predicted)) {
    parsed.domain_predicted = "public_info";
    parsed.routing_confidence = Math.min(parsed.routing_confidence ?? 0.5, 0.5);
  }
  if (!VALID_BOTS.includes(parsed.target_bot_predicted)) {
    parsed.target_bot_predicted = currentBotId;
  }
  if (
    typeof parsed.routing_confidence !== "number" ||
    parsed.routing_confidence < 0 ||
    parsed.routing_confidence > 1
  ) {
    parsed.routing_confidence = 0.5;
  }

  return parsed;
}
