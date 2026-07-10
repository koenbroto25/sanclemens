/**
 * romcal — Kalender Liturgi Komputasi Lokal
 * Spesifikasi: RENUNGAN_HARIAN_SISTEM_LENGKAP_r2.md Bagian 4.2
 *
 * Menggunakan pustaka romcal untuk mengkomputasi metadata liturgi.
 * Berjalan sepenuhnya offline, tanpa bergantung sumber eksternal apapun.
 */

import { calendarFor } from 'romcal';
import { format } from 'date-fns';

// Mapping warna liturgi dari kode romcal (liturgicalColor.key) ke label Indonesia
const WARNA_MAP: Record<string, string> = {
  WHITE:  'Putih',
  RED:    'Merah',
  GREEN:  'Hijau',
  PURPLE: 'Ungu',
  ROSE:   'Rosa',
  GOLD:   'Emas',
};

// Mapping tingkat perayaan dari kode romcal (type) ke label Indonesia
const TINGKAT_MAP: Record<string, string> = {
  SOLEMNITY:      'Hari Raya',
  SUNDAY:         'Hari Minggu',
  TRIDUUM:        'Tri Hari Suci',
  HOLY_WEEK:      'Pekan Suci',
  FEAST:          'Pesta',
  MEMORIAL:       'Peringatan Wajib',
  OPT_MEMORIAL:   'Peringatan Opsional',
  COMMEMORATION:  'Peringatan',
  FERIA:          'Hari Biasa',
};

// Urutan prioritas type romcal (indeks lebih kecil = prioritas lebih tinggi)
const TYPE_PRIORITY: string[] = [
  'SOLEMNITY', 'SUNDAY', 'TRIDUUM', 'HOLY_WEEK', 'FEAST',
  'MEMORIAL', 'OPT_MEMORIAL', 'COMMEMORATION', 'FERIA',
];

// Mapping musim liturgi dari romcal (season.value) ke label Indonesia
const MUSIM_MAP: Record<string, string> = {
  'Advent':        'Masa Adven',
  'Christmastide': 'Masa Natal',
  'Lent':          'Masa Prapaskah',
  'Holy Week':     'Pekan Suci',
  'Easter':        'Masa Paskah',
  'Ordinary Time': 'Masa Biasa',
};

interface RomcalDate {
  moment: string;
  type: string;
  name: string;
  data: {
    season: { key: string; value: string };
    meta: {
      liturgicalColor: { key: string; value: string };
    };
  };
}

let _cachedYear: number | null = null;
let _cachedCalendar: RomcalDate[] | null = null;

function getCalendarForYear(tahun: number): RomcalDate[] {
  if (_cachedYear === tahun && _cachedCalendar) {
    return _cachedCalendar;
  }
  const kalender = calendarFor({ year: tahun, country: 'general', locale: 'en' }) as RomcalDate[];
  _cachedYear = tahun;
  _cachedCalendar = kalender;
  return kalender;
}

export interface MetadataLiturgi {
  tanggal:           string;   // YYYY-MM-DD
  perayaan:          string;
  tingkat_perayaan:  string;
  warna_liturgi:     string;
  is_minggu:         boolean;
  musim_liturgi:     string;
}

export async function getMetadataLiturgi(date: Date): Promise<MetadataLiturgi> {
  const tahun  = date.getFullYear();
  const tanggalStr = format(date, 'yyyy-MM-dd'); // YYYY-MM-DD

  const kalender = getCalendarForYear(tahun);
  const hariIni = kalender.filter(d => d.moment.startsWith(tanggalStr));

  if (!hariIni || hariIni.length === 0) {
    // Fallback ke hari biasa
    return {
      tanggal:          tanggalStr,
      perayaan:         'Hari Biasa',
      tingkat_perayaan: 'Hari Biasa',
      warna_liturgi:    'Hijau',
      is_minggu:        date.getDay() === 0,
      musim_liturgi:    'Masa Biasa',
    };
  }

  // Ambil entri dengan prioritas tertinggi
  const entri = hariIni.slice().sort(
    (a, b) => TYPE_PRIORITY.indexOf(a.type) - TYPE_PRIORITY.indexOf(b.type)
  )[0];

  return {
    tanggal:          tanggalStr,
    perayaan:         entri.name || 'Hari Biasa',
    tingkat_perayaan: TINGKAT_MAP[entri.type] || 'Hari Biasa',
    warna_liturgi:    WARNA_MAP[entri.data?.meta?.liturgicalColor?.key] || 'Hijau',
    is_minggu:        entri.type === 'SUNDAY' || date.getDay() === 0,
    musim_liturgi:    MUSIM_MAP[entri.data?.season?.value] || 'Masa Biasa',
  };
}