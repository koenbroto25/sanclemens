import type { ModuleItem } from './curriculum';

/* ============================================================
   KLASIFIKASI SUMBER KUTIPAN
   Dipakai untuk memberi badge warna pada tiap blockquote, memakai
   ulang 4 warna jewel-tone yang sudah ada untuk Tahap — supaya
   bahasa visual situs tetap satu keluarga, bukan palet baru.
   ============================================================ */

export type CitationCategory = 'kgk' | 'scripture' | 'magisterium' | 'saints' | 'other';

const KGK_PATTERN = /\bKGK\b|Katekismus|Kompendium/i;

const MAGISTERIUM_PATTERN =
  /Lumen Gentium|Gaudium et Spes|Fides et Ratio|Humani Generis|Deus Caritas Est|Evangelii Gaudium|Sacrosanctum Concilium|Dei Verbum|Konsili (Vatikan|Nicea|Kalsedon|Trente)|Ensiklik/i;

const SAINTS_PATTERN =
  /Agustinus|Ireneus|Confessiones|De Trinitate|Adversus Haereses|Sermo\b|Aquinas|C\.S\. Lewis|Teresa dari (Lisieux|Kalkuta)|Bapa Gereja/i;

const SCRIPTURE_PATTERN =
  /\b(Kejadian|Kej|Keluaran|Kel|Imamat|Bilangan|Ulangan|Mazmur|Mzm|Amsal|Kebijaksanaan|Yesaya|Yes|Yeremia|Yehezkiel|Makabe|Mak|Matius|Mat|Markus|Mrk|Lukas|Luk|Yohanes|Yoh|Kisah Para Rasul|Kis|Roma|Rm|Korintus|Kor|Galatia|Gal|Efesus|Ef|Filipi|Flp|Kolose|Kol|Tesalonika|Tes|Timotius|Tim|Titus|Tit|Filemon|Ibrani|Ibr|Yakobus|Yak|Petrus|Pet|Wahyu|Why)\b/;

export function detectCitationCategory(attribution: string): CitationCategory {
  if (KGK_PATTERN.test(attribution)) return 'kgk';
  if (MAGISTERIUM_PATTERN.test(attribution)) return 'magisterium';
  if (SAINTS_PATTERN.test(attribution)) return 'saints';
  if (SCRIPTURE_PATTERN.test(attribution)) return 'scripture';
  return 'other';
}

export interface CitationStyle {
  label: string;
  color: string;
  bg: string;
  border: string;
}

/** Warna: emas = KGK, biru (jewel-sapphire) = Kitab Suci, hijau (jewel-emerald) =
 *  dokumen Konsili/Ensiklik, merah (jewel-ruby) = tokoh & tradisi kudus. */
export const CITATION_STYLE: Record<CitationCategory, CitationStyle> = {
  kgk: { label: 'Katekismus', color: 'var(--color-gold-deep)', bg: 'rgba(200,169,110,0.12)', border: 'var(--color-gold)' },
  scripture: { label: 'Kitab Suci', color: '#2d4d73', bg: 'rgba(74,107,138,0.1)', border: '#4a6b8a' },
  magisterium: { label: 'Dokumen Gereja', color: '#2f5c3f', bg: 'rgba(74,140,92,0.1)', border: '#4a8c5c' },
  saints: { label: 'Tokoh & Tradisi', color: '#6e1f2c', bg: 'rgba(139,38,53,0.1)', border: '#8b2635' },
  other: { label: 'Sumber', color: 'var(--color-stone-dark)', bg: 'rgba(139,115,85,0.08)', border: 'rgba(139,115,85,0.3)' },
};

/* ============================================================
   AUTO-LINK "Modul X.X" — konten markdown penuh dengan referensi
   silang natural ("dibahas di Modul 1.2"). Ubah jadi tautan otomatis.
   Keterbatasan yang disengaja: pada rujukan majemuk seperti
   "Modul 3.4A dan 3.4B", hanya angka pertama yang ditautkan.
   ============================================================ */
export function linkifyModuleRefs(text: string, modules: ModuleItem[], basePath: string): string {
  return text.replace(/Modul\s+(\d+(?:\.\d+)?[AB]?)\b/g, (match, num: string) => {
    const target = modules.find((m) => m.number.toUpperCase() === num.toUpperCase());
    if (!target) return match;
    return `[${match}](${basePath}/${target.slug})`;
  });
}
