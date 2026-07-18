import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Load kitab.json once at module level for performance
let kitabData: any[] | null = null;

async function loadKitabData(): Promise<any[]> {
  if (kitabData) return kitabData;
  
  try {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'Doa-Harian-Katolik-main', 'Doa-Harian-Katolik-main', 'resources', 'kitab.json');
    const data = fs.readFileSync(filePath, 'utf8');
    kitabData = JSON.parse(data);
    return kitabData ?? [];
  } catch (error) {
    console.error('Error loading kitab.json:', error);
    return [];
  }
}

// Mapping abbreviation kitab ke namaPendek di kitab.json
const KITAB_ABBREVIATIONS: Record<string, string> = {
  'Kej': 'Kej', 'Kel': 'Kel', 'Irm': 'Irm', 'Mzm': 'Mzm',
  'Ams': 'Ams', 'Yes': 'Yes', 'Yesaya': 'Yes', 'Yer': 'Yer',
  'Rat': 'Rat', 'Yehezkiel': 'Yeh', 'Daniel': 'Dan', 'Hos': 'Hos',
  'Yoel': 'Yl', 'Obaja': 'Ob', 'Yunus': 'Yun',
  'Mikha': 'Mik', 'Nahum': 'Nah', 'Habakuk': 'Hab', 'Zefanya': 'Zef',
  'Hagai': 'Hag', 'Zakharia': 'Zak', 'Maleakhi': 'Mal',
  'Mat': 'Mat', 'Mrk': 'Mrk', 'Luk': 'Luk', 'Yoh': 'Yoh',
  'Kis': 'Kis', 'Rom': 'Rom', '1Kor': '1Kor', '2Kor': '2Kor',
  'Gal': 'Gal', 'Ef': 'Ef', 'Flp': 'Fil', 'Kol': 'Kol',
  '1Tes': '1Tes', '2Tes': '2Tes', '1Tim': '1Tim', '2Tim': '2Tim',
  'Tit': 'Tit', 'Filemon': 'Fil', 'Ibr': 'Ibr', 'Yak': 'Yak',
  '1Pet': '1Ptr', '2Pet': '2Ptr', '1Yoh': '1Yoh', '2Yoh': '2Yoh',
  'Markus': 'Mrk', 'Lukas': 'Luk', 'Yohanes': 'Yoh',
  'Kisah': 'Kis', 'Roma': 'Rom', '1 Korintus': '1Kor',
  '2 Korintus': '2Kor', 'Galatia': 'Gal', 'Efesus': 'Ef',
  'Filipi': 'Fil', 'Kolose': 'Kol', '1 Tesalonika': '1Tes',
  '2 Tesalonika': '2Tes', '1 Timotius': '1Tim', '2 Timotius': '2Tim',
  'Titus': 'Tit', 'Ibrani': 'Ibr', 'Yakobus': 'Yak',
  '1 Petrus': '1Ptr', '2 Petrus': '2Ptr', '1 Yohanes': '1Yoh',
  '2 Yohanes': '2Yoh', '3 Yohanes': '3Yoh',
  'Wahyu': 'Why'
};

function parseReference(ref: string): { kitab: string; bab: number; ayatRange: string } | null {
  // Format: "Kitab Bab:Ayat" or "Kitab Bab:Ayat1-Ayat2"
  // Examples: "Am 5:14-15", "Mzm 50:7-17", "Mat 12:1-8"
  
  // Remove extra spaces
  const cleaned = ref.trim().replace(/\s+/g, ' ');
  
  // Match pattern: "Kitab Bab:Ayat" or "Kitab Bab,Ayat"
  const match = cleaned.match(/^(.+?)\s+(\d+)[\:,](\d+(-\d+)?.*)$/);
  if (!match) return null;
  
  const [, kitabRaw, babStr, ayatRange] = match;
  const kitab = kitabRaw.trim();
  const bab = parseInt(babStr, 10);
  
  return { kitab, bab, ayatRange };
}

function getNamaPendek(kitab: string): string | null {
  // Direct mapping
  if (KITAB_ABBREVIATIONS[kitab]) return KITAB_ABBREVIATIONS[kitab];
  
  // Try partial match
  const lowerKitab = kitab.toLowerCase();
  for (const [abbr, namaPendek] of Object.entries(KITAB_ABBREVIATIONS)) {
    if (lowerKitab.includes(abbr.toLowerCase()) || namaPendek.toLowerCase().includes(lowerKitab)) {
      return namaPendek;
    }
  }
  
  return null;
}

function parseAyatRange(ayatRange: string): { start: number; end: number } {
  // Handle "14-15", "7-17", "1-8", "7", "7.8-9" (multiple ranges)
  const parts = ayatRange.split('.');
  
  // Get first range
  const firstRange = parts[0];
  const rangeMatch = firstRange.match(/^(\d+)(?:-(\d+))?$/);
  
  if (!rangeMatch) {
    return { start: 1, end: 1 };
  }
  
  const start = parseInt(rangeMatch[1], 10);
  const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : start;
  
  return { start, end };
}

function getAyatText(ayat: any): string {
  // Remove extra whitespace and normalize
  return ayat.firman.trim().replace(/\s+/g, ' ');
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referencesParam = searchParams.get('references');
    
    if (!referencesParam) {
      return NextResponse.json(
        { error: 'Parameter references diperlukan' },
        { status: 400 }
      );
    }
    
    const kitabData = await loadKitabData();
    if (kitabData.length === 0) {
      return NextResponse.json(
        { error: 'Data Kitab Suci tidak tersedia' },
        { status: 500 }
      );
    }
    
    // Parse references (separated by semicolon)
    const references = referencesParam.split(';').map(r => r.trim()).filter(Boolean);
    const readings: Array<{ reference: string; teks: string }> = [];
    
    for (const ref of references) {
      const parsed = parseReference(ref);
      if (!parsed) {
        readings.push({ reference: ref, teks: `Format bacaan tidak valid: ${ref}` });
        continue;
      }
      
      const namaPendek = getNamaPendek(parsed.kitab);
      if (!namaPendek) {
        readings.push({ reference: ref, teks: `Kitab tidak dikenali: ${parsed.kitab}` });
        continue;
      }
      
      const { start: ayatStart, end: ayatEnd } = parseAyatRange(parsed.ayatRange);
      
      // Find verses in kitab.json
      const verses = kitabData.filter((ayat: any) => 
        ayat.namaPendek === namaPendek && 
        ayat.bab === parsed.bab && 
        ayat.ayat >= ayatStart && 
        ayat.ayat <= ayatEnd
      );
      
      if (verses.length === 0) {
        readings.push({ reference: ref, teks: `Bacaan tidak ditemukan: ${ref}` });
        continue;
      }
      
      // Combine verses into a single text
      const teks = verses.map((ayat: any) => getAyatText(ayat)).join(' ');
      
      // Format reference for display
      const displayRef = `${parsed.kitab} ${parsed.bab}:${parsed.ayatRange}`;
      readings.push({ reference: displayRef, teks });
    }
    
    return NextResponse.json({ readings });
    
  } catch (error) {
    console.error('Error in /api/liturgi/reading-detail:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}