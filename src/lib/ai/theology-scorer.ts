/**
 * Theology Scoring System — 5 Parameter Validator
 * Spesifikasi: RENUNGAN_HARIAN_SISTEM_LENGKAP_r2.md Bagian 8
 */

export interface SkorTeologi {
  kristologis: number;
  doktrinal: number;
  pastoral: number;
  sumber: number;
  liturgi: number;
  total: number;
  lulus: boolean;
  catatan: string[];
}

export interface KonteksValidasi {
  mode_persona: 'ignas' | 'anton';
  warna_liturgi: string;
  tingkat_perayaan: string;
  teks_renungan: string;
}

export async function validasiSkorTeologi(
  konteks: KonteksValidasi,
  geminiClient: any
): Promise<SkorTeologi> {

  const prompt = `Kamu adalah validator teologi Katolik. Beri skor 0-100 untuk teks renungan berikut. Jawab HANYA JSON.

MODE: ${konteks.mode_persona === 'ignas' ? 'Bruder Ignas' : 'Pater Anton'}
WARNA: ${konteks.warna_liturgi}
TINGKAT: ${konteks.tingkat_perayaan}

TEKS:
${konteks.teks_renungan}

KRITERIA:
P1 Kristologis (0-35): Yesus sebagai pusat? 35=eksplisit, 20=Allah tapi kurang spesifik, 10=spiritual umum, 0=impersonal [VETO]
P2 Doktrinal (0-30): Konsisten Magisterium? 30=baik, 15=ambigu, 5=perhatian, 0=bertentangan [VETO]
P3 Pastoral (0-20): Nada pastoral? 20=sangat baik, 12=netral, 5=menghakimi, 0=melukai
P4 Sumber (0-10): Referensi valid? 10=semua terlacak, 7=parafrase jujur, 3=kabur, 0=kutipan fiktif
P5 Liturgi (0-5): Sesuai konteks? 5=sangat sesuai, 3=cukup, 0=bertentangan

LULUS: total>=75 DAN P1>0 DAN P2>0
GAGAL: total<75 ATAU P1=0 ATAU P2=0

JSON:
{"kristologis":N,"doktrinal":N,"pastoral":N,"sumber":N,"liturgi":N,"catatan":["..."]}`;

  try {
    const result = await geminiClient.generateContent(prompt);
    const raw = result.response.text().replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    const parsed = JSON.parse(raw);

    const total = (parsed.kristologis||0) + (parsed.doktrinal||0) + (parsed.pastoral||0) + (parsed.sumber||0) + (parsed.liturgi||0);
    const lulus = total >= 75 && parsed.kristologis > 0 && parsed.doktrinal > 0;

    return {
      kristologis: parsed.kristologis || 0,
      doktrinal: parsed.doktrinal || 0,
      pastoral: parsed.pastoral || 0,
      sumber: parsed.sumber || 0,
      liturgi: parsed.liturgi || 0,
      total,
      lulus,
      catatan: parsed.catatan || []
    };
  } catch (e) {
    console.error('Theology scoring failed:', e);
    return { kristologis:0, doktrinal:0, pastoral:0, sumber:0, liturgi:0, total:0, lulus:false, catatan:['Scoring error'] };
  }
}

export function generateValidationLog(skor: SkorTeologi): string {
  if (skor.lulus) {
    return `LULUS ${skor.total}/100 (K:${skor.kristologis} D:${skor.doktrinal} P:${skor.pastoral} S:${skor.sumber} L:${skor.liturgi})`;
  }
  const reasons = [];
  if (skor.total < 75) reasons.push(`Total ${skor.total}<75`);
  if (skor.kristologis === 0) reasons.push('P1=0 (VETO)');
  if (skor.doktrinal === 0) reasons.push('P2=0 (VETO)');
  return `GAGAL: ${reasons.join(', ')}`;
}