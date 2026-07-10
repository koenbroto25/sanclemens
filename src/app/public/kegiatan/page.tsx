'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

/* ============================================================
   TYPES & DATA
   Demo hardcoded — nanti disambung ke GET /api/public/kegiatan.
   Foto/video asli belum ada; PhotoPlaceholder di bawah dipakai
   sebagai pengganti sementara, tinggal ganti dengan <img>/<video>
   asli di tempat yang sama.
   ============================================================ */
type Kategori = 'ibadah' | 'sosial' | 'pendidikan' | 'pemuda';

interface KegiatanItem {
  slug: string;
  tanggal: string; // "D MMMM YYYY"
  judul: string;
  excerpt: string;
  kategori: Kategori;
  isVideo?: boolean;
  featured?: boolean;
}

/** Path halaman detail per kegiatan — BELUM ADA halamannya, ini placeholder.
 *  Ganti target routing-nya di sini setelah /public/kegiatan/[slug]/page.tsx dibuat. */
const DETAIL_BASE = '/public/kegiatan';

/** GANTI dengan akun media sosial resmi paroki. */
const SOCIAL_LINKS = {
  instagram: 'https://instagram.com/parokisantoklemens',
  youtube: 'https://youtube.com/@parokisantoklemens',
};

const KEGIATAN: KegiatanItem[] = [
  {
    slug: 'perayaan-sakramen-krisma-2026',
    tanggal: '14 Juni 2026',
    judul: 'Perayaan Sakramen Krisma: 85 Kandidat Diteguhkan dalam Iman',
    excerpt: 'Suasana khidmat menyelimuti Gereja Santo Martinus ketika Mgr. Yustinus Harjosusanto, MSF meneguhkan 85 kandidat penerima Sakramen Krisma tahun ini, diiringi paduan suara OMK.',
    kategori: 'ibadah',
    featured: true,
  },
  {
    slug: 'baksos-sembako-korban-banjir',
    tanggal: '10 Juni 2026',
    judul: 'Bakti Sosial: 200 Paket Sembako untuk Warga Terdampak Banjir',
    excerpt: 'Komunitas Kerahiman Ilahi bersama umat paroki menyalurkan 200 paket sembako kepada warga terdampak banjir di sekitar Sepinggan, hasil penggalangan Dana Kasih bulan ini.',
    kategori: 'sosial',
  },
  {
    slug: 'konser-musik-rohani-omk',
    tanggal: '28 Juni 2026',
    judul: 'Konser Musik Rohani OMK: Malam Penuh Sukacita di Halaman Gereja',
    excerpt: 'Orang Muda Katolik menggelar konser musik rohani yang dihadiri ratusan umat, menampilkan lagu-lagu pujian karya musisi muda paroki sendiri.',
    kategori: 'pemuda',
    isVideo: true,
  },
  {
    slug: 'retret-komuni-pertama-gua-maria',
    tanggal: '21 Juni 2026',
    judul: 'Retret Komuni Pertama: Anak-anak Persiapkan Hati di Gua Maria',
    excerpt: 'Sebanyak 60 anak calon penerima Komuni Pertama mengikuti retret sehari penuh di Gua Maria, diisi dengan katekese, permainan, dan doa bersama orang tua.',
    kategori: 'pendidikan',
  },
  {
    slug: 'kunjungan-kasih-panti-asuhan',
    tanggal: '5 Juni 2026',
    judul: 'Kunjungan Kasih ke Panti Asuhan Bunda Pengasih',
    excerpt: 'Seksi Sosial paroki mengunjungi Panti Asuhan Bunda Pengasih, membawa kebutuhan pokok dan mengadakan kegiatan bermain bersama anak-anak panti.',
    kategori: 'sosial',
  },
  {
    slug: 'pelatihan-katekis-2026',
    tanggal: '1 Juni 2026',
    judul: 'Pelatihan Katekis Paroki Angkatan 2026',
    excerpt: 'Dua puluh calon katekis baru mengikuti pelatihan intensif selama tiga hari untuk mempersiapkan pelayanan pewartaan di lingkungan masing-masing.',
    kategori: 'pendidikan',
  },
  {
    slug: 'gotong-royong-lingkungan-gereja',
    tanggal: '24 Mei 2026',
    judul: 'Gotong Royong Bersih-Bersih Lingkungan Gereja',
    excerpt: 'Umat dari seluruh lingkungan bergotong royong membersihkan area gereja dan taman menjelang perayaan Hari Raya Pentakosta.',
    kategori: 'sosial',
  },
  {
    slug: 'malam-vokasi-seminari',
    tanggal: '17 Mei 2026',
    judul: 'Malam Vokasi bersama Seminari Keuskupan Agung Samarinda',
    excerpt: 'OMK dan remaja paroki mengikuti sharing panggilan bersama para seminaris, membuka wawasan tentang kehidupan calon imam.',
    kategori: 'pemuda',
    isVideo: true,
  },
];

/* ============================================================
   KATEGORI — jewel-tone yang sama dengan halaman lain, dipetakan
   ulang jadi warna kategori khas Kegiatan.
   ============================================================ */
const KATEGORI_STYLE: Record<Kategori, { label: string; base: string; light: string; text: string }> = {
  ibadah: { label: 'Ibadah', base: '#a87a2c', light: '#c8a96e', text: 'var(--color-gold-deep)' },
  sosial: { label: 'Sosial', base: '#2f5c3f', light: '#4a8c5c', text: '#2f5c3f' },
  pendidikan: { label: 'Pendidikan', base: '#2d4d73', light: '#4a6b8a', text: '#2d4d73' },
  pemuda: { label: 'Pemuda', base: '#6e1f2c', light: '#8b2635', text: '#6e1f2c' },
};

function parseIndoDate(tanggal: string): number {
  const BULAN: Record<string, number> = {
    Januari: 0, Februari: 1, Maret: 2, April: 3, Mei: 4, Juni: 5, Juli: 6,
    Agustus: 7, September: 8, Oktober: 9, November: 10, Desember: 11,
  };
  const [day, monthName, year] = tanggal.split(' ');
  return new Date(Number(year), BULAN[monthName] ?? 0, Number(day)).getTime();
}

/* ============================================================
   AKSEN VISUAL — bingkai foto ala viewfinder kamera + label
   kategori sebagai pill solid di atas foto (khas thumbnail portal
   berita, beda dari stempel Warta atau medali Belajar Katolik).
   ============================================================ */
function PhotoPlaceholder({
  kategori,
  isVideo,
  compact = false,
}: {
  kategori: Kategori;
  isVideo?: boolean;
  compact?: boolean;
}) {
  const style = KATEGORI_STYLE[kategori];
  return (
    <div
      className={`relative w-full ${compact ? 'aspect-[4/3]' : 'aspect-[16/10]'} rounded-[8px] overflow-hidden shrink-0`}
      style={{ background: `linear-gradient(135deg, ${style.light}, ${style.base})` }}
    >
      <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/60" />
      <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/60" />
      <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/60" />
      <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/60" />

      <div className="absolute inset-0 flex items-center justify-center">
        {isVideo ? (
          <span className="w-11 h-11 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white text-lg ml-0.5" aria-hidden="true">▶</span>
          </span>
        ) : (
          <span className="text-white/70 text-2xl" aria-hidden="true">🖼️</span>
        )}
      </div>

      <span
        className="absolute top-2.5 left-2.5 text-[0.62rem] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full text-white"
        style={{ background: 'rgba(26,14,5,0.55)' }}
      >
        {style.label}
      </span>
      {isVideo && (
        <span
          className="absolute top-2.5 right-2.5 text-[0.6rem] font-semibold px-2 py-1 rounded-full text-white flex items-center gap-1"
          style={{ background: 'rgba(26,14,5,0.55)' }}
        >
          🎥 Video
        </span>
      )}
    </div>
  );
}

/* ============================================================
   KARTU BERITA
   ============================================================ */
function FeaturedStory({ item }: { item: KegiatanItem }) {
  return (
    <div
      className="rounded-[6px_28px_6px_28px] bg-white border overflow-hidden grid grid-cols-1 md:grid-cols-2"
      style={{ borderColor: 'rgba(200,169,110,0.18)', boxShadow: 'var(--shadow-warm-lg)' }}
    >
      <div className="p-2 md:p-3">
        <PhotoPlaceholder kategori={item.kategori} isVideo={item.isVideo} />
      </div>
      <div className="p-5 md:p-7 flex flex-col justify-center">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--color-gold-deep)' }}>
          📰 Liputan Utama
        </span>
        <h2
          className="text-xl md:text-2xl font-bold text-[var(--color-text-dark)] mb-3 leading-snug"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {item.judul}
        </h2>
        <p className="text-[var(--color-stone-dark)] leading-relaxed mb-4">{item.excerpt}</p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs" style={{ color: 'var(--color-stone)' }}>{item.tanggal}</span>
          <Link
            href={`${DETAIL_BASE}/${item.slug}`}
            className="text-sm font-semibold whitespace-nowrap"
            style={{ color: 'var(--color-gold-deep)' }}
          >
            Baca Selengkapnya →
          </Link>
        </div>
      </div>
    </div>
  );
}

function StoryCard({ item }: { item: KegiatanItem }) {
  return (
    <div
      className="rounded-[4px_20px_4px_20px] bg-white border p-3 flex flex-col"
      style={{ borderColor: 'rgba(200,169,110,0.16)', boxShadow: 'var(--shadow-card)' }}
    >
      <PhotoPlaceholder kategori={item.kategori} isVideo={item.isVideo} />
      <div className="pt-4 flex flex-col flex-1">
        <h3
          className="font-bold text-[var(--color-text-dark)] mb-2 leading-snug"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {item.judul}
        </h3>
        <p className="text-sm text-[var(--color-stone-dark)] leading-relaxed mb-3 line-clamp-2">{item.excerpt}</p>
        <div className="flex items-center justify-between gap-3 mt-auto pt-1">
          <span className="text-xs" style={{ color: 'var(--color-stone)' }}>{item.tanggal}</span>
          <Link
            href={`${DETAIL_BASE}/${item.slug}`}
            className="text-sm font-semibold whitespace-nowrap"
            style={{ color: 'var(--color-gold-deep)' }}
          >
            Baca Selengkapnya →
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SIDEBAR — media sosial + daftar ringkas berita lain
   ============================================================ */
function SocialCard({ type }: { type: 'instagram' | 'youtube' }) {
  const isIg = type === 'instagram';
  return (
    <a
      href={isIg ? SOCIAL_LINKS.instagram : SOCIAL_LINKS.youtube}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-4 rounded-[4px_16px_4px_16px] bg-white border transition hover:shadow-[var(--shadow-gold)]"
      style={{ borderColor: 'rgba(200,169,110,0.16)', boxShadow: 'var(--shadow-card)' }}
    >
      <span
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
        style={{ background: isIg ? 'rgba(193,53,132,0.1)' : 'rgba(224,30,30,0.1)' }}
        aria-hidden="true"
      >
        {isIg ? '📷' : '▶️'}
      </span>
      <div className="min-w-0">
        <div className="font-semibold text-sm text-[var(--color-text-dark)]">
          {isIg ? 'Instagram Paroki' : 'YouTube Paroki'}
        </div>
        <div className="text-xs truncate" style={{ color: 'var(--color-stone)' }}>
          {isIg ? '@parokisantoklemens' : 'Paroki Santo Klemens Sepinggan'}
        </div>
      </div>
    </a>
  );
}

function BeritaLainnyaList({ items }: { items: KegiatanItem[] }) {
  return (
    <div
      className="rounded-[4px_20px_4px_20px] bg-white border p-5"
      style={{ borderColor: 'rgba(200,169,110,0.16)', boxShadow: 'var(--shadow-card)' }}
    >
      <h3
        className="font-bold text-[var(--color-text-dark)] mb-4 flex items-center gap-2"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        <span aria-hidden="true">📋</span> Berita Lainnya
      </h3>
      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
        {items.map((item) => {
          const style = KATEGORI_STYLE[item.kategori];
          return (
            <Link
              key={item.slug}
              href={`${DETAIL_BASE}/${item.slug}`}
              className="flex items-start gap-3 group"
            >
              <span
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ background: style.base }}
              />
              <div className="min-w-0">
                <div className="text-[0.68rem] mb-0.5" style={{ color: 'var(--color-stone)' }}>
                  {item.tanggal} · {style.label}
                </div>
                <div className="text-sm font-medium leading-snug text-[var(--color-text-dark)] group-hover:underline">
                  {item.judul}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   PAGE
   ============================================================ */
export default function KegiatanPage() {
  const [filter, setFilter] = useState<'semua' | Kategori>('semua');

  const sorted = useMemo(
    () => [...KEGIATAN].sort((a, b) => parseIndoDate(b.tanggal) - parseIndoDate(a.tanggal)),
    []
  );
  const featured = useMemo(() => sorted.find((k) => k.featured) ?? sorted[0], [sorted]);
  const rest = useMemo(() => sorted.filter((k) => k.slug !== featured.slug), [sorted, featured]);
  const filteredRest = useMemo(
    () => (filter === 'semua' ? rest : rest.filter((k) => k.kategori === filter)),
    [rest, filter]
  );

  const categories: ('semua' | Kategori)[] = ['semua', 'ibadah', 'sosial', 'pendidikan', 'pemuda'];

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      {/* ============ HEADER ============ */}
      <header className="pt-16 pb-10 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <span
            className="text-[0.7rem] font-semibold tracking-[0.28em] uppercase mb-4 block"
            style={{ color: 'var(--color-gold-deep)' }}
          >
            Jurnal Pelayanan
          </span>
          <h1
            className="text-3xl md:text-4xl font-bold text-[var(--color-text-dark)] mb-3"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Kegiatan Paroki
          </h1>
          <p className="text-[var(--color-stone-dark)]">
            Liputan foto dan video kegiatan umat serta paroki — dari ibadah, pelayanan sosial, hingga karya kaum muda.
          </p>
        </div>
      </header>

      {/* ============ FILTER KATEGORI ============ */}
      <div className="flex gap-2 flex-wrap justify-center mb-10 px-4">
        {categories.map((cat) => {
          const isActive = filter === cat;
          const label = cat === 'semua' ? 'Semua' : KATEGORI_STYLE[cat].label;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="text-sm font-medium px-4 py-2 rounded-full transition"
              style={
                isActive
                  ? { background: 'var(--color-gold)', color: 'var(--color-primary)' }
                  : { background: 'rgba(200,169,110,0.1)', color: 'var(--color-stone-dark)' }
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ============ KONTEN UTAMA + SIDEBAR ============ */}
      <main className="max-w-6xl mx-auto px-4 pb-20 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-10 items-start">
        <div className="space-y-8">
          <FeaturedStory item={featured} />

          {filteredRest.length > 0 ? (
            <div>
              <h2
                className="text-lg font-bold text-[var(--color-text-dark)] mb-4"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Liputan Kegiatan Lainnya
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {filteredRest.map((item) => (
                  <StoryCard key={item.slug} item={item} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center py-10" style={{ color: 'var(--color-stone)' }}>
              Belum ada liputan pada kategori ini.
            </p>
          )}
        </div>

        <aside className="lg:sticky lg:top-8 space-y-5">
          <div className="space-y-3">
            <SocialCard type="instagram" />
            <SocialCard type="youtube" />
          </div>
          <BeritaLainnyaList items={sorted.filter((k) => k.slug !== featured.slug)} />
        </aside>
      </main>
    </div>
  );
}
