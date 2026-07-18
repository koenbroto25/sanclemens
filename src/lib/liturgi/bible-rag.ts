import fs from 'fs';
import path from 'path';

interface BibleText {
  reference: string;
  text: string | null;
  found: boolean;
}

interface BibleVerse {
  verse: number;
  text: string;
}
interface BibleChapter {
  chapter: number;
  verses: BibleVerse[];
}
interface BibleBook {
  book: string;
  chapters: BibleChapter[];
}

// ========== PEMETAAN SINGKATAN AELF (Prancis) -> NAMA KITAB DI bible-id.json ==========
// Referensi liturgi (dari AELF, dipakai catholic-readings.ts) memakai singkatan
// Prancis, mis. "Mt 13, 18-23", "Jr 3, 14-17", "Ps 125 (126), 1-2ab, 4-5".
// bible-id.json memakai nama kitab lengkap Bahasa Indonesia (lihat daftar di
// laporan_bible_id.md). Kitab Deuterokanonika (Tobit, Yudit, Kebijaksanaan
// Salomo, Sirakh, Barukh, 1 & 2 Makabe) BELUM tersedia di sumber ini --
// referensi ke kitab-kitab itu akan selalu found:false sampai ada sumber
// Bahasa Indonesia yang lolos hak cipta.
const BOOK_MAP: Record<string, string> = {
  'gn': 'Kejadian', 'ex': 'Keluaran', 'lv': 'Imamat', 'nb': 'Bilangan', 'dt': 'Ulangan',
  'jos': 'Yosua', 'jg': 'Hakim-Hakim', 'rt': 'Rut',
  '1s': '1 Samuel', '2s': '2 Samuel', '1r': '1 Raja-Raja', '2r': '2 Raja-Raja',
  '1ch': '1 Tawarikh', '2ch': '2 Tawarikh', 'esd': 'Ezra', 'ne': 'Nehemia', 'est': 'Ester',
  'jb': 'Ayub', 'ps': 'Mazmur', 'pr': 'Amsal', 'qo': 'Pengkhotbah', 'ct': 'Kidung Agung',
  'is': 'Yesaya', 'jr': 'Yeremia', 'lm': 'Ratapan', 'ez': 'Yehezkiel', 'dn': 'Daniel',
  'os': 'Hosea', 'jl': 'Yoel', 'am': 'Amos', 'ab': 'Obaja', 'jon': 'Yunus', 'mi': 'Mikha',
  'na': 'Nahum', 'ha': 'Habakuk', 'so': 'Zefanya', 'ag': 'Hagai', 'za': 'Zakharia', 'ml': 'Maleakhi',
  'mt': 'Matius', 'mc': 'Markus', 'lc': 'Lukas', 'jn': 'Yohanes', 'ac': 'Kisah Para Rasul',
  'rm': 'Roma', '1co': '1 Korintus', '2co': '2 Korintus', 'ga': 'Galatia', 'ep': 'Efesus',
  'ph': 'Filipi', 'col': 'Kolose', '1th': '1 Tesalonika', '2th': '2 Tesalonika',
  '1tm': '1 Timotius', '2tm': '2 Timotius', 'tt': 'Titus', 'phm': 'Filemon', 'he': 'Ibrani',
  'jc': 'Yakobus', '1p': '1 Petrus', '2p': '2 Petrus', '1jn': '1 Yohanes', '2jn': '2 Yohanes',
  '3jn': '3 Yohanes', 'jude': 'Yudas', 'ap': 'Wahyu',
  // Deuterokanonika -- SENGAJA tidak dipetakan (belum ada sumber Bahasa
  // Indonesia yang lolos hak cipta). Referensi ke kitab-kitab ini akan
  // gracefully return found:false, BUKAN error.
};

// ========== CACHE DATA (dimuat sekali per cold start container) ==========
let bibleCache: BibleBook[] | null = null;

function loadBibleData(): BibleBook[] {
  if (bibleCache) return bibleCache;
  const filePath = path.join(process.cwd(), 'data', 'bible nabre', 'bible-id.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  bibleCache = JSON.parse(raw) as BibleBook[];
  return bibleCache;
}

// ========== PARSING REFERENSI ==========
// Contoh input yang harus ditangani:
//   "Mt 13, 18-23"                          -> Matius 13, ayat 18-23
//   "Jr 3, 14-17"                           -> Yeremia 3, ayat 14-17
//   "Ps 125 (126), 1-2ab, 2cd-3, 4-5, 6"    -> Mazmur 126 (angka dalam kurung
//                                               dipakai -- itu penomoran
//                                               Ibrani/Masoret, sama dengan
//                                               yang dipakai bible-id.json),
//                                               ayat {1,2,3,4,5,6}
//   "2 Co 4, 7-15"                          -> 2 Korintus 4, ayat 7-15
interface ParsedRef {
  bookAbbr: string;
  chapter: number;
  verseNumbers: number[];
}

function parseReference(reference: string): ParsedRef | null {
  const ref = reference.trim();

  // Kasus khusus Mazmur dengan penomoran ganda: "Ps 125 (126), ..."
  const psalmMatch = ref.match(/^(Ps)\s+\d+\s*\((\d+)\)\s*,\s*(.+)$/i);
  if (psalmMatch) {
    const chapter = parseInt(psalmMatch[2], 10);
    const verseNumbers = parseVerseSpec(psalmMatch[3]);
    return { bookAbbr: 'ps', chapter, verseNumbers };
  }

  // Kasus umum: "{Singkatan} {pasal}, {spesifikasi ayat}"
  // Singkatan boleh diawali angka (mis. "2 Co", "1 R")
  const generalMatch = ref.match(/^(\d?\s?[A-Za-zÀ-ÿ]+)\s+(\d+)\s*,\s*(.+)$/);
  if (generalMatch) {
    const bookAbbr = generalMatch[1].replace(/\s+/g, '').toLowerCase();
    const chapter = parseInt(generalMatch[2], 10);
    const verseNumbers = parseVerseSpec(generalMatch[3]);
    return { bookAbbr, chapter, verseNumbers };
  }

  return null;
}

// Parse spesifikasi ayat majemuk: "1-2ab, 2cd-3, 4-5, 6" -> [1,2,3,4,5,6]
// Huruf di belakang angka (mis. "2ab") menandai separuh-ayat dalam konvensi
// liturgi Prancis -- diabaikan di sini karena bible-id.json cuma simpan ayat
// utuh per nomor, bukan per-separuh.
function parseVerseSpec(spec: string): number[] {
  const verseSet = new Set<number>();
  const parts = spec.split(',').map(p => p.trim()).filter(Boolean);

  for (const part of parts) {
    // Buang huruf yang menempel di belakang angka: "2ab" -> "2", "3" tetap "3"
    const cleaned = part.replace(/(\d+)[a-z]+/gi, '$1');
    const rangeMatch = cleaned.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let v = start; v <= end; v++) verseSet.add(v);
      continue;
    }
    const singleMatch = cleaned.match(/^(\d+)$/);
    if (singleMatch) {
      verseSet.add(parseInt(singleMatch[1], 10));
    }
  }

  return Array.from(verseSet).sort((a, b) => a - b);
}

// ========== FUNGSI UTAMA ==========
export async function getBibleText(reference: string): Promise<BibleText> {
  try {
    const parsed = parseReference(reference);
    if (!parsed) {
      console.warn(`Bible text: gagal parsing referensi "${reference}"`);
      return { reference, text: null, found: false };
    }

    const bookName = BOOK_MAP[parsed.bookAbbr];
    if (!bookName) {
      // Kemungkinan besar kitab Deuterokanonika yang belum tersedia --
      // ini "not found" yang diharapkan, bukan bug.
      console.warn(`Bible text: kitab "${parsed.bookAbbr}" belum tersedia di bible-id.json (kemungkinan Deuterokanonika) untuk referensi "${reference}"`);
      return { reference, text: null, found: false };
    }

    const bibleData = loadBibleData();
    const book = bibleData.find(b => b.book === bookName);
    if (!book) {
      console.warn(`Bible text: kitab "${bookName}" tidak ditemukan di data untuk referensi "${reference}"`);
      return { reference, text: null, found: false };
    }

    const chapterData = book.chapters.find(c => c.chapter === parsed.chapter);
    if (!chapterData) {
      console.warn(`Bible text: ${bookName} pasal ${parsed.chapter} tidak ditemukan untuk referensi "${reference}" (kemungkinan beda skema penomoran pasal -- lihat catatan Daniel/Yoel/Maleakhi di laporan_bible_id.md)`);
      return { reference, text: null, found: false };
    }

    const verseTexts = parsed.verseNumbers
      .map(vNum => chapterData.verses.find(v => v.verse === vNum))
      .filter((v): v is BibleVerse => v !== undefined)
      .map(v => v.text);

    if (verseTexts.length === 0) {
      console.warn(`Bible text: tidak ada ayat yang cocok di ${bookName} ${parsed.chapter} untuk referensi "${reference}"`);
      return { reference, text: null, found: false };
    }

    return { reference, text: verseTexts.join(' '), found: true };
  } catch (err) {
    console.error(`Unexpected error in getBibleText for ${reference}:`, err);
    return { reference, text: null, found: false };
  }
}
