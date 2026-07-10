/**
 * Query Formalizer for v6.0 AI
 * Detects informal language and formalizes queries using LLM
 */

const INFORMAL_PATTERNS = [
  /\b(gmn|gimana|gaype|kayak|kyk|gak|nggak|udah|udh|blm|belum|mau|mo|aja|aj|dong|deh|sih|banget|bgt|nih|nih)\b/i,
  /\b(bro|sis|gan|kak|mas|mbak|bang|dek|cus)\b/i,
  /[a-z]{1,3}\s+(yg|yng|nih|lah|kok|ya)/i,
  /\b(ada yang|pake|pasti|jangan|mending|kalo|kagak|gitu|gini)\b/i
];

export function detectInformal(query: string): boolean {
  return INFORMAL_PATTERNS.some(pattern => pattern.test(query));
}

export async function formalizeQuery(
  rawQuery: string,
  apiKey?: string
): Promise<string> {
  if (!detectInformal(rawQuery)) {
    return rawQuery;
  }

  try {
    const key = apiKey || process.env.GOOGLE_API_KEY_1;
    if (!key) {
      console.warn('GOOGLE_API_KEY_1 not set, skipping formalization');
      return rawQuery;
    }

    const prompt = `Tulis ulang pertanyaan berikut dalam bahasa Indonesia formal yang baku.
Pertahankan makna dan niat aslinya secara presisi. Jangan tambahkan informasi baru.
Pertanyaan: "${rawQuery}"
Jawab HANYA dengan versi formal, tanpa penjelasan tambahan.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 100
          }
        })
      }
    );

    if (!response.ok) {
      console.error('Formalization LLM error:', response.status);
      return rawQuery;
    }

    const data = await response.json();
    const formalized = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    return formalized || rawQuery;

  } catch (error) {
    console.error('Error formalizing query:', error);
    return rawQuery;
  }
}

export async function detectAndFormalize(
  query: string,
  apiKey?: string
): Promise<{ isInformal: boolean; formalizedQuery: string }> {
  const isInformal = detectInformal(query);
  
  if (!isInformal) {
    return { isInformal: false, formalizedQuery: query };
  }

  const formalizedQuery = await formalizeQuery(query, apiKey);
  return { isInformal: true, formalizedQuery };
}