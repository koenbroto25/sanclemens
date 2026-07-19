import fs from 'fs';
import path from 'path';

interface SaintEntry {
  saint_name: string;
  type: string | null;
  feast_day: string; // format "D/M", mis. "1/1", "24/7"
  biography: string;
  patronage?: string[];
  visual_attributes?: string[];
  [key: string]: any;
}

interface SaintLookupResult {
  saint_name: string;
  type: string | null;
  biography: string;
  patronage: string[];
  visual_attributes: string[];
  match_confidence: 'exact_name' | 'date_only_single_candidate';
}

// ========== CACHE DATA (dimuat sekali per proses, mengikuti pola bible-rag.ts) ==========
let saintsCache: SaintEntry[] | null = null;

function loadSaintsData(): SaintEntry[] {
  if (saintsCache) return saintsCache;
  const filePath = path.join(process.cwd(), 'data', 'saints.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  saintsCache = JSON.parse(raw) as SaintEntry[];
  return saintsCache;
}

// ========== NORMALISASI NAMA UNTUK PENCOCOKAN ==========
// Membuang gelar/prefiks umum (Prancis & Indonesia) dan tanda baca, supaya
// pencocokan token nama tidak terganggu oleh "S.", "Ste.", ", prêtre", dsb.
function extractNameTokens(fullName: string): string[] {
  const cleaned = fullName
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // buang diakritik (é -> e, dst)
    .replace(/^(s\.|ste\.|saint|sainte|santo|santa)\s*/i, '')
    .replace(/,.*/g, '') // buang segala sesuatu setelah koma pertama (gelar/peran, mis. ", prêtre")
    .replace(/\(.*?\)/g, '') // buang keterangan dalam kurung
    .toLowerCase();

  return cleaned
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 3); // buang token terlalu pendek (kurang informatif untuk cocokkan)
}

// Cocokkan dua token nama dengan toleransi variasi ejaan lintas bahasa
// (mis. "Marie" (Prancis) vs "Maria" (Indonesia), "Petrus" vs "Pierre" tidak
// akan cocok dengan cara ini -- ini cuma menolong kasus varian ejaan yang
// mirip/berbagi akar kata, bukan padanan terjemahan penuh).
function tokensMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const minLen = Math.min(a.length, b.length);
  if (minLen < 4) return false; // token pendek terlalu berisiko false-positive
  const sharedPrefixLen = Math.min(4, minLen);
  return a.slice(0, sharedPrefixLen) === b.slice(0, sharedPrefixLen);
}
// aelfDate: tanggal yang sedang diproses (Date object)
// aelfFeteName: field `informations.fete` dari AELF, mis. "S. Charbel Maklouf, prêtre"
//               (boleh kosong/undefined kalau hari itu tidak ada perayaan santo)
export function getSaintBiography(
  aelfDate: Date,
  aelfFeteName?: string | null
): SaintLookupResult | null {
  try {
    const day = aelfDate.getDate();
    const month = aelfDate.getMonth() + 1;
    const feastDayKey = `${day}/${month}`;

    const saintsData = loadSaintsData();
    const candidates = saintsData.filter(s => s.feast_day === feastDayKey);

    if (candidates.length === 0) {
      return null; // tidak ada santo tercatat di tanggal ini -- wajar, bukan error
    }

    if (candidates.length === 1) {
      return toResult(candidates[0], 'date_only_single_candidate');
    }

    // Lebih dari satu kandidat di tanggal yang sama -- cocokkan nama AELF
    if (aelfFeteName) {
      const aelfTokens = new Set(extractNameTokens(aelfFeteName));
      let bestMatch: SaintEntry | null = null;
      let bestScore = 0;

      for (const candidate of candidates) {
        const candidateTokens = extractNameTokens(candidate.saint_name);
        const overlap = candidateTokens.filter(t => aelfTokens.has(t)).length;
        if (overlap > bestScore) {
          bestScore = overlap;
          bestMatch = candidate;
        }
      }

      if (bestMatch && bestScore > 0) {
        return toResult(bestMatch, 'exact_name');
      }
    }

    // Tidak ada nama AELF, atau tidak ada token yang cocok -- JANGAN menebak
    // kandidat pertama. Menyisipkan biografi santo yang SALAH ke prompt AI
    // lebih berbahaya daripada tidak menyisipkan apa-apa (bisa menyusupkan
    // info biografis keliru ke renungan). Diam (return null) itu pilihan
    // yang benar di sini, bukan cuma "kurang optimal".
    console.warn(
      `[saints-lookup] ${feastDayKey}: ${candidates.length} kandidat, tidak ada` +
      ` yang cocok dengan AELF fete="${aelfFeteName}" -- dilewati (tidak menebak), kandidat: ` +
      candidates.map(c => c.saint_name).join(' | ')
    );
    return null;
  } catch (err) {
    console.error('[saints-lookup] Unexpected error:', err);
    return null;
  }
}

function toResult(entry: SaintEntry, confidence: SaintLookupResult['match_confidence']): SaintLookupResult {
  return {
    saint_name: entry.saint_name,
    type: entry.type,
    biography: entry.biography,
    patronage: entry.patronage || [],
    visual_attributes: entry.visual_attributes || [],
    match_confidence: confidence,
  };
}
