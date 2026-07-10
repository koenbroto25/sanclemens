'use client';

import { useMemo, useState } from 'react';

/* ============================================================
   TYPES & DATA
   Demo hardcoded — nanti tinggal disambung ke GET /api/public/warta-paroki
   ============================================================ */
type Kategori = 'liturgi' | 'kegiatan' | 'sosial';

interface WartaItem {
  slug: string;
  tanggal: string; // format "D MMMM YYYY" berbahasa Indonesia
  judul: string;
  excerpt: string;
  kategori: Kategori;
  pinned?: boolean;
}

const WARTA: WartaItem[] = [
  {
    slug: 'penerimaan-sakramen-krisma',
    tanggal: '2 Juni 2026',
    judul: 'Penerimaan Sakramen Krisma oleh Uskup Agung',
    excerpt: 'Mgr. Yustinus Harjosusanto, MSF akan memberikan Sakramen Krisma kepada 85 kandidat pada Minggu, 14 Juni 2026, pukul 09.00 WITA di Gereja Santo Martinus.',
    kategori: 'liturgi',
    pinned: true,
  },
  {
    slug: 'rekoleksi-legio-maria',
    tanggal: '30 Mei 2026',
    judul: 'Rekoleksi Bulanan Legio Maria',
    excerpt: 'Legio Maria mengadakan rekoleksi bulanan pada Sabtu, 7 Juni 2026, bertempat di Aula Paroki. Terbuka untuk seluruh anggota dan calon anggota baru.',
    kategori: 'kegiatan',
  },
  {
    slug: 'penggalangan-dana-atap-gereja',
    tanggal: '28 Mei 2026',
    judul: 'Penggalangan Dana Renovasi Atap Gereja',
    excerpt: 'Penggalangan dana untuk renovasi atap Gereja Santo Martinus masih berlangsung. Sumbangan dapat disalurkan melalui sekretariat paroki atau rekening resmi.',
    kategori: 'sosial',
  },
  {
    slug: 'jadwal-misa-pentakosta',
    tanggal: '20 Mei 2026',
    judul: 'Jadwal Misa Khusus Hari Raya Pentakosta',
    excerpt: 'Misa Hari Raya Pentakosta akan diadakan dalam 3 sesi: 06.00, 08.00, dan 17.00 WITA. Umat dimohon hadir 15 menit lebih awal.',
    kategori: 'liturgi',
  },
  {
    slug: 'bazar-amal-wanita-katolik',
    tanggal: '15 Mei 2026',
    judul: 'Bazar Amal Wanita Katolik',
    excerpt: 'Wanita Katolik Republik Indonesia (WKRI) cabang paroki mengadakan bazar amal di halaman gereja, hasil penjualan disalurkan untuk Dana Kasih paroki.',
    kategori: 'sosial',
  },
  {
    slug: 'pendaftaran-katekumen-baru',
    tanggal: '10 Mei 2026',
    judul: 'Pendaftaran Katekumen Baru Dibuka',
    excerpt: 'Pendaftaran calon baptis dewasa (katekumen) untuk periode 2026/2027 resmi dibuka. Pendaftaran dapat dilakukan di sekretariat paroki setiap hari kerja.',
    kategori: 'kegiatan',
  },
  {
    slug: 'misa-requiem-romo-paroki',
    tanggal: '25 April 2026',
    judul: 'Misa Requiem untuk Almarhum Romo Paroki',
    excerpt: 'Misa requiem peringatan 40 hari wafatnya Rm. Fransiskus akan diadakan pada Jumat, 1 Mei 2026, pukul 18.30 WITA.',
    kategori: 'liturgi',
  },
  {
    slug: 'kunjungan-kasih-panti-jompo',
    tanggal: '18 April 2026',
    judul: 'Kunjungan Kasih ke Panti Jompo',
    excerpt: 'Komunitas Kerahiman Ilahi mengadakan kunjungan kasih ke Panti Jompo Wredha Bhakti, membawa kebutuhan pokok dan pelayanan doa bersama.',
    kategori: 'sosial',
  },
  {
    slug: 'retret-omk',
    tanggal: '12 April 2026',
    judul: 'Retret Orang Muda Katolik (OMK)',
    excerpt: 'OMK Paroki Santo Klemens mengadakan retret akhir pekan bertema "Muda, Berani, Beriman" di Wisma Retret Samarinda.',
    kategori: 'kegiatan',
  },
  {
    slug: 'pemberkatan-gedung-serbaguna',
    tanggal: '3 April 2026',
    judul: 'Pemberkatan Gedung Serbaguna Baru',
    excerpt: 'Gedung serbaguna paroki yang baru selesai dibangun akan diberkati oleh Pastor Paroki, dilanjutkan dengan ramah-tamah bersama umat.',
    kategori: 'liturgi',
  },
];

/* ============================================================
   KATEGORI — dipetakan ke jewel-tone yang sama dengan Belajar
   Katolik, tapi dipakai sebagai "stempel" kecil, bukan medali —
   supaya masih satu keluarga warna namun bentuknya jelas berbeda.
   ============================================================ */
const KATEGORI_STYLE: Record<Kategori, { label: string; color: string; bg: string; border: string }> = {
  liturgi: { label: 'Liturgi', color: 'var(--color-gold-deep)', bg: 'rgba(200,169,110,0.1)', border: 'var(--color-gold)' },
  kegiatan: { label: 'Kegiatan', color: '#2d4d73', bg: 'rgba(74,107,138,0.08)', border: '#4a6b8a' },
  sosial: { label: 'Sosial', color: '#2f5c3f', bg: 'rgba(74,140,92,0.08)', border: '#4a8c5c' },
};

/* ============================================================
   HELPERS TANGGAL
   ============================================================ */
const BULAN: Record<string, number> = {
  Januari: 0, Februari: 1, Maret: 2, April: 3, Mei: 4, Juni: 5, Juli: 6,
  Agustus: 7, September: 8, Oktober: 9, November: 10, Desember: 11,
};

function parseIndoDate(tanggal: string): number {
  const [day, monthName, year] = tanggal.split(' ');
  const month = BULAN[monthName] ?? 0;
  return new Date(Number(year), month, Number(day)).getTime();
}

function monthKey(tanggal: string): string {
  const parts = tanggal.split(' ');
  return `${parts[1]} ${parts[2]}`;
}

function groupByMonth(items: WartaItem[]): { month: string; items: WartaItem[] }[] {
  const map = new Map<string, WartaItem[]>();
  for (const item of items) {
    const key = monthKey(item.tanggal);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([month, items]) => ({ month, items }));
}

/* ============================================================
   AKSEN VISUAL — "papan warta": sudut terlipat + pin + stempel
   ============================================================ */
function FoldedCorner() {
  return (
    <div
      className="absolute top-0 right-0 w-5 h-5 pointer-events-none"
      style={{
        background: 'var(--color-cream)',
        clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
        boxShadow: '-2px 2px 4px rgba(58,42,24,0.1)',
      }}
    />
  );
}

function PushPin() {
  return (
    <div
      className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full z-10"
      style={{
        background: 'radial-gradient(circle at 35% 30%, var(--color-gold-light), var(--color-gold-deep))',
        boxShadow: '0 3px 6px rgba(58,42,24,0.35), inset 0 1px 1px rgba(255,255,255,0.4)',
      }}
    />
  );
}

function KategoriStamp({ kategori }: { kategori: Kategori }) {
  const style = KATEGORI_STYLE[kategori];
  return (
    <span
      className="inline-block text-[0.62rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-[3px] border-2"
      style={{
        color: style.color,
        borderColor: style.border,
        background: style.bg,
        borderStyle: 'dashed',
        transform: 'rotate(-2deg)',
      }}
    >
      {style.label}
    </span>
  );
}

/* ============================================================
   KARTU PENGUMUMAN
   ============================================================ */
function FeaturedCard({ item }: { item: WartaItem }) {
  return (
    <div
      id={item.slug}
      className="relative rounded-[6px_28px_6px_28px] p-6 md:p-8 bg-white border-2 scroll-mt-24"
      style={{ borderColor: 'var(--color-gold)', boxShadow: 'var(--shadow-warm-lg)' }}
    >
      <PushPin />
      <FoldedCorner />
      <div className="flex items-center gap-3 mb-4">
        <KategoriStamp kategori={item.kategori} />
        <span className="text-[0.7rem] font-medium" style={{ color: 'var(--color-stone)' }}>
          {item.tanggal}
        </span>
      </div>
      <span
        className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] block mb-2"
        style={{ color: 'var(--color-gold-deep)' }}
      >
        📌 Pengumuman Utama
      </span>
      <h2
        className="text-xl md:text-2xl font-bold text-[var(--color-text-dark)] mb-3 leading-snug"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {item.judul}
      </h2>
      <p className="text-[var(--color-stone-dark)] leading-relaxed">{item.excerpt}</p>
    </div>
  );
}

function WartaCard({ item, isActive }: { item: WartaItem; isActive: boolean }) {
  return (
    <div
      id={item.slug}
      className="relative rounded-[4px_20px_4px_20px] p-5 bg-white border transition-all scroll-mt-24"
      style={{
        borderColor: isActive ? 'var(--color-gold)' : 'rgba(200,169,110,0.16)',
        boxShadow: isActive ? 'var(--shadow-gold)' : 'var(--shadow-card)',
      }}
    >
      <FoldedCorner />
      <div className="flex items-center gap-3 mb-3">
        <KategoriStamp kategori={item.kategori} />
        <span className="text-[0.68rem] font-medium" style={{ color: 'var(--color-stone)' }}>
          {item.tanggal}
        </span>
      </div>
      <h3
        className="font-bold text-[var(--color-text-dark)] mb-2 leading-snug"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {item.judul}
      </h3>
      <p className="text-sm text-[var(--color-stone-dark)] leading-relaxed">{item.excerpt}</p>
    </div>
  );
}

/* ============================================================
   SIDEBAR ARSIP — garis waktu per bulan
   ============================================================ */
function ArchiveSidebar({
  grouped,
  activeSlug,
  onSelect,
}: {
  grouped: { month: string; items: WartaItem[] }[];
  activeSlug: string | null;
  onSelect: (slug: string) => void;
}) {
  return (
    <div
      className="rounded-[4px_20px_4px_20px] bg-white border p-5"
      style={{ borderColor: 'rgba(200,169,110,0.16)', boxShadow: 'var(--shadow-card)' }}
    >
      <h3
        className="font-bold text-[var(--color-text-dark)] mb-4 flex items-center gap-2"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        <span aria-hidden="true">🗂️</span> Arsip Warta
      </h3>
      <div className="space-y-6 max-h-[480px] overflow-y-auto pr-2">
        {grouped.map(({ month, items }) => (
          <div key={month}>
            <div className="text-[0.65rem] font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-gold-deep)' }}>
              {month}
            </div>
            <div className="relative pl-4 space-y-3 border-l-2" style={{ borderColor: 'rgba(200,169,110,0.2)' }}>
              {items.map((item) => {
                const isActive = item.slug === activeSlug;
                return (
                  <button
                    key={item.slug}
                    onClick={() => onSelect(item.slug)}
                    className="block text-left relative w-full group"
                  >
                    <span
                      className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full transition-colors"
                      style={{ background: isActive ? 'var(--color-gold)' : 'rgba(200,169,110,0.35)' }}
                    />
                    <div className="text-[0.7rem]" style={{ color: 'var(--color-stone)' }}>
                      {item.tanggal}
                    </div>
                    <div
                      className="text-sm font-medium leading-snug transition-colors group-hover:underline"
                      style={{ color: isActive ? 'var(--color-gold-deep)' : 'var(--color-text-dark)' }}
                    >
                      {item.judul}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   PAGE
   ============================================================ */
export default function WartaParokiPage() {
  const [filter, setFilter] = useState<'semua' | Kategori>('semua');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...WARTA].sort((a, b) => parseIndoDate(b.tanggal) - parseIndoDate(a.tanggal)),
    []
  );
  const featured = useMemo(() => sorted.find((w) => w.pinned) ?? sorted[0], [sorted]);
  const rest = useMemo(() => sorted.filter((w) => w.slug !== featured.slug), [sorted, featured]);
  const filteredRest = useMemo(
    () => (filter === 'semua' ? rest : rest.filter((w) => w.kategori === filter)),
    [rest, filter]
  );
  const grouped = useMemo(() => groupByMonth(sorted), [sorted]);

  const handleArchiveSelect = (slug: string) => {
    setFilter('semua');
    setActiveSlug(slug);
    // beri waktu render ulang (kalau filter baru saja direset) sebelum scroll
    requestAnimationFrame(() => {
      document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    window.setTimeout(() => setActiveSlug(null), 2200);
  };

  const categories: ('semua' | Kategori)[] = ['semua', 'liturgi', 'kegiatan', 'sosial'];

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      {/* ============ HEADER — netral, tanpa gradien/medali ============ */}
      <header className="pt-16 pb-10 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <span
            className="text-[0.7rem] font-semibold tracking-[0.28em] uppercase mb-4 block"
            style={{ color: 'var(--color-gold-deep)' }}
          >
            Kabar &amp; Warta
          </span>
          <h1
            className="text-3xl md:text-4xl font-bold text-[var(--color-text-dark)] mb-3"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Warta Paroki
          </h1>
          <p className="text-[var(--color-stone-dark)]">Informasi terbaru dari Paroki Santo Klemens</p>
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

      {/* ============ KONTEN UTAMA + SIDEBAR ARSIP ============ */}
      <main className="max-w-6xl mx-auto px-4 pb-20 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-10 items-start">
        <div className="space-y-6">
          <FeaturedCard item={featured} />

          {filteredRest.length > 0 ? (
            <div className="space-y-4">
              {filteredRest.map((item) => (
                <WartaCard key={item.slug} item={item} isActive={item.slug === activeSlug} />
              ))}
            </div>
          ) : (
            <p className="text-center py-10" style={{ color: 'var(--color-stone)' }}>
              Belum ada warta pada kategori ini.
            </p>
          )}
        </div>

        <aside className="lg:sticky lg:top-8">
          <ArchiveSidebar grouped={grouped} activeSlug={activeSlug} onSelect={handleArchiveSelect} />
        </aside>
      </main>
    </div>
  );
}
