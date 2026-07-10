/* ============================================================
   CURRICULUM DATA — satu-satunya sumber kebenaran untuk 21 modul.
   Dipakai oleh:
     - src/app/public/learn-catholic/page.tsx (peta kurikulum)
     - src/app/public/learn-catholic/modul/[slug]/page.tsx (halaman modul)
   Kalau butuh ubah judul/urutan/slug modul, cukup ubah di sini.
   ============================================================ */

export interface TahapInfo {
  slug: string;
  title: string;
  icon: string;
  subtitle: string;
  description: string;
  jewelBase: string;
  jewelLight: string;
}

export interface ModuleItem {
  /** Nomor modul persis seperti di judul markdown-nya, mis. '0', '1.2', '2.1A', '3.4B'.
   *  Dipakai juga untuk menurunkan nama file markdown — lihat getModuleFilename(). */
  number: string;
  title: string;
  subtitle: string;
  icon: string;
  slug: string;
  tahapSlug: string;
}

export const TAHAP_LIST: TahapInfo[] = [
  {
    slug: 'pintu-masuk',
    title: 'Pintu Masuk',
    icon: '🚪',
    subtitle: 'Langkah pertama',
    description:
      'Titik awal perjalanan untuk mengenal Gereja Katolik dan menjawab pertanyaan-pertanyaan paling dasar tentang iman.',
    jewelBase: '#a87a2c',
    jewelLight: '#c8a96e',
  },
  {
    slug: 'pondasi',
    title: 'Tahap 1: Pondasi',
    icon: '🪨',
    subtitle: '5 modul dasar',
    description:
      'Membangun dasar iman yang kokoh — mengenal Allah, Yesus Kristus, dan sumber wahyu-Nya bagi manusia.',
    jewelBase: '#2d4d73',
    jewelLight: '#4a6b8a',
  },
  {
    slug: 'pertumbuhan',
    title: 'Tahap 2: Pertumbuhan',
    icon: '🌱',
    subtitle: '7 modul kehidupan Gereja',
    description:
      'Mendalami kehidupan Gereja melalui sakramen, Ekaristi, dan kehidupan doa sehari-hari umat beriman.',
    jewelBase: '#2f5c3f',
    jewelLight: '#4a8c5c',
  },
  {
    slug: 'pendalaman',
    title: 'Tahap 3: Pendalaman',
    icon: '🔥',
    subtitle: '8 modul misteri iman',
    description:
      'Menyelami misteri iman yang lebih dalam — Maria, para kudus, moralitas Kristiani, dan kehidupan kekal.',
    jewelBase: '#6e1f2c',
    jewelLight: '#8b2635',
  },
];

export const MODULES: ModuleItem[] = [
  { number: '0', title: 'Modul 0: Selamat Datang', subtitle: 'Mengenal perjalanan 21 modul ini', icon: '👋', slug: 'pintu-masuk', tahapSlug: 'pintu-masuk' },
  { number: '1.1', title: '1.1 Diciptakan untuk Cinta', subtitle: 'Mengapa Allah menciptakan manusia', icon: '❤️', slug: 'diciptakan-untuk-cinta', tahapSlug: 'pondasi' },
  { number: '1.2', title: '1.2 Kasih Karunia', subtitle: 'Rahmat dan Kehidupan Ilahi', icon: '✨', slug: 'kasih-karunia', tahapSlug: 'pondasi' },
  { number: '1.3', title: '1.3 Iman', subtitle: 'Percaya kepada Allah', icon: '🙏', slug: 'iman', tahapSlug: 'pondasi' },
  { number: '1.4', title: '1.4 Pengharapan', subtitle: 'Menanti Kerajaan Allah', icon: '🌟', slug: 'pengharapan', tahapSlug: 'pondasi' },
  { number: '1.5', title: '1.5 Kasih', subtitle: 'Mengasihi Allah dan Sesama', icon: '💖', slug: 'kasih', tahapSlug: 'pondasi' },
  { number: '2.1A', title: '2.1A Gereja Bukan Sekadar Gedung', subtitle: 'Memahami hakikat Gereja', icon: '⛪', slug: 'gereja-bukan-sekadar-gedung', tahapSlug: 'pertumbuhan' },
  { number: '2.1B', title: '2.1B Sakramen', subtitle: 'Tanda dan Sarana Rahmat', icon: '💧', slug: 'sakramen', tahapSlug: 'pertumbuhan' },
  { number: '2.2', title: '2.2 Doa', subtitle: 'Berbicara dengan Allah', icon: '🤲', slug: 'doa', tahapSlug: 'pertumbuhan' },
  { number: '2.3', title: '2.3 Firman Allah', subtitle: 'Kitab Suci sebagai Pedoman Hidup', icon: '📖', slug: 'firman-allah', tahapSlug: 'pertumbuhan' },
  { number: '2.4', title: '2.4 Perintah', subtitle: 'Hukum Kasih', icon: '📜', slug: 'perintah', tahapSlug: 'pertumbuhan' },
  { number: '2.5', title: '2.5 Iman Dalam Konteks', subtitle: 'Hidup Iman di Dunia Modern', icon: '🌍', slug: 'iman-dalam-konteks', tahapSlug: 'pertumbuhan' },
  { number: '2.6', title: '2.6 Perjuangan', subtitle: 'Mengatasi Godaan', icon: '⚔️', slug: 'perjuangan', tahapSlug: 'pertumbuhan' },
  { number: '3.1', title: '3.1 Surat Paulus', subtitle: 'Ajaran Rasul Paulus', icon: '✉️', slug: 'surat-paulus', tahapSlug: 'pendalaman' },
  { number: '3.2A', title: '3.2A Ajaran Gereja', subtitle: 'Dokumen dan Konsili', icon: '🏛️', slug: 'ajaran-gereja', tahapSlug: 'pendalaman' },
  { number: '3.2B', title: '3.2B Konsili Vatikan II', subtitle: 'Pembaharuan Gereja', icon: '🕊️', slug: 'konsili-vatikan-ii', tahapSlug: 'pendalaman' },
  { number: '3.3', title: '3.3 Perjalanan Sejati', subtitle: 'Panggilan Kekudusan', icon: '🚶', slug: 'perjalanan-sejati', tahapSlug: 'pendalaman' },
  { number: '3.4A', title: '3.4A Doa Rosario', subtitle: 'Merangkai Mutiara Doa', icon: '📿', slug: 'doa-rosario', tahapSlug: 'pendalaman' },
  { number: '3.4B', title: '3.4B Pujian', subtitle: 'Mengagungkan Allah', icon: '🎶', slug: 'pujian', tahapSlug: 'pendalaman' },
  { number: '3.5', title: '3.5 Misioner', subtitle: 'Menjadi Saksi Kristus', icon: '🌍', slug: 'misioner', tahapSlug: 'pendalaman' },
  { number: '3.6', title: '3.6 Kematian, Api Penyucian, Harapan Kekal', subtitle: 'Akhir Hidup Manusia', icon: '🌅', slug: 'kematian-api-penyucian-harapan-kekal', tahapSlug: 'pendalaman' },
];

/** Nama file markdown diturunkan langsung dari `number`, konsisten dengan
 *  penamaan `modul_X_Y_rev.md` di folder sumber — tidak perlu tabel mapping terpisah.
 *  '0' -> modul_0_rev.md | '1.2' -> modul_1_2_rev.md | '2.1A' -> modul_2_1a_rev.md | '3.4B' -> modul_3_4b_rev.md
 */
export function getModuleFilename(numberField: string): string {
  const normalized = numberField.toLowerCase().replace('.', '_');
  return `modul_${normalized}_rev.md`;
}

export function getModuleBySlug(slug: string): ModuleItem | undefined {
  return MODULES.find((m) => m.slug === slug);
}

export function getTahapBySlug(slug: string): TahapInfo | undefined {
  return TAHAP_LIST.find((t) => t.slug === slug);
}

export interface AdjacentModules {
  index: number;
  prev: ModuleItem | null;
  next: ModuleItem | null;
  isLast: boolean;
}

export function getAdjacentModules(slug: string): AdjacentModules | null {
  const index = MODULES.findIndex((m) => m.slug === slug);
  if (index === -1) return null;
  return {
    index,
    prev: index > 0 ? MODULES[index - 1] : null,
    next: index < MODULES.length - 1 ? MODULES[index + 1] : null,
    isLast: index === MODULES.length - 1,
  };
}

/** Perkiraan waktu baca dari jumlah kata mentah markdown (± 190 kata/menit
 *  untuk teks reflektif berbahasa Indonesia — sedikit lebih lambat dari rata-rata
 *  umum karena banyak kutipan yang wajar dibaca perlahan). */
export function estimateReadingMinutes(rawMarkdown: string): number {
  const words = rawMarkdown
    .replace(/[#>*_|`-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 190));
}
