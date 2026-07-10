'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

/* ============================================================
   TYPES
   ============================================================ */
interface TahapInfo {
  slug: string;
  title: string;
  icon: string;
  subtitle: string;
  description: string;
  /** Warna kaca inti & terang — diambil langsung dari jewel-tones di public.css,
   *  supaya setiap Tahap punya "warna panel" sendiri seperti jendela rosette katedral. */
  jewelBase: string;
  jewelLight: string;
}

type ModuleStatus = 'completed' | 'current' | 'locked';

interface ModuleItem {
  number: string;
  title: string;
  subtitle: string;
  icon: string;
  slug: string;
  tahapSlug: string;
}

/* ============================================================
   DATA — 4 Tahap
   Warna dipetakan 1:1 ke variabel jewel-tone & pendukungnya yang
   sudah ada di public.css, bukan warna baru:
     Pintu Masuk  -> --jewel-amber   + --color-gold        (ambang, cahaya fajar)
     Pondasi      -> --jewel-sapphire+ --color-glass-blue  (kokoh, dasar)
     Pertumbuhan  -> --jewel-emerald + --color-success      (kehidupan, tumbuh)
     Pendalaman   -> --jewel-ruby    + --color-glass-red    (misteri, salib)
   ============================================================ */
const TAHAP_LIST: TahapInfo[] = [
  {
    slug: 'pintu-masuk',
    title: 'Pintu Masuk',
    icon: '🚪',
    subtitle: 'Langkah pertama',
    description:
      'Titik awal perjalanan untuk mengenal Gereja Katolik dan menjawab pertanyaan-pertanyaan paling dasar tentang iman.',
    jewelBase: '#a87a2c', // --jewel-amber
    jewelLight: '#c8a96e', // --color-gold
  },
  {
    slug: 'pondasi',
    title: 'Tahap 1: Pondasi',
    icon: '🪨',
    subtitle: '5 modul dasar',
    description:
      'Membangun dasar iman yang kokoh — mengenal Allah, Yesus Kristus, dan sumber wahyu-Nya bagi manusia.',
    jewelBase: '#2d4d73', // --jewel-sapphire
    jewelLight: '#4a6b8a', // --color-glass-blue
  },
  {
    slug: 'pertumbuhan',
    title: 'Tahap 2: Pertumbuhan',
    icon: '🌱',
    subtitle: '7 modul kehidupan Gereja',
    description:
      'Mendalami kehidupan Gereja melalui sakramen, Ekaristi, dan kehidupan doa sehari-hari umat beriman.',
    jewelBase: '#2f5c3f', // --jewel-emerald
    jewelLight: '#4a8c5c', // --color-success
  },
  {
    slug: 'pendalaman',
    title: 'Tahap 3: Pendalaman',
    icon: '🔥',
    subtitle: '8 modul misteri iman',
    description:
      'Menyelami misteri iman yang lebih dalam — Maria, para kudus, moralitas Kristiani, dan kehidupan kekal.',
    jewelBase: '#6e1f2c', // --jewel-ruby
    jewelLight: '#8b2635', // --color-glass-red
  },
];

/* ============================================================
   DATA — 21 Modul (hardcode; refactor ke fetch /curriculum kalau API siap)
   Urutan array = order_index 0..20 dari skema learning_modules,
   dipakai langsung untuk logika gating sequential di getModuleStatus().
   ============================================================ */
const MODULES: ModuleItem[] = [
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
  { number: '3.6', title: '3.6 Kematian, Api Penyucian, Harapan Kekal', subtitle: 'Akhir Hidup Manusia', icon: '🌟', slug: 'kematian-api-penyucian-harapan-kekal', tahapSlug: 'pendalaman' },
];

/** DEMO progress — ganti dengan hasil GET /curriculum (learning_module_progress).
 *  Default untuk umat baru: belum ada modul yang 'completed', hanya Modul 0
 *  yang 'current' (unlocked) — supaya semua orang benar-benar mulai dari 0,
 *  bukan langsung disuguhi beberapa modul awal dalam keadaan terbuka.
 *  Guard akses sesungguhnya tetap harus di server (lihat §7.2 rencana). */
const COMPLETED_COUNT = 0;

function getModuleStatus(index: number): ModuleStatus {
  if (index < COMPLETED_COUNT) return 'completed';
  if (index === COMPLETED_COUNT) return 'current';
  return 'locked';
}

/* ============================================================
   QUATREFOIL MEDALLION — motif "kaca patri" inti halaman ini.
   Geometrinya sengaja disamakan dengan --pattern-gothic-dark
   (4 lingkaran + bingkai belah ketupat) di public.css, hanya
   diberi isi warna kaca (bukan garis timah saja) supaya terasa
   satu keluarga visual dengan seluruh situs, bukan motif baru.
   ============================================================ */
function QuatrefoilMedallion({
  size,
  base,
  light,
  icon,
  status = 'default',
  animateSheen = false,
  reducedMotion = false,
}: {
  size: number;
  base: string;
  light: string;
  icon: string;
  status?: ModuleStatus | 'default';
  animateSheen?: boolean;
  reducedMotion?: boolean;
}) {
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const isCurrent = status === 'current';
  const gradId = useMemo(
    () => `glass-${base.replace('#', '')}-${Math.round(size)}`,
    [base, size]
  );

  return (
    <div className="relative shrink-0 select-none" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 70 70"
        width={size}
        height={size}
        className={`absolute inset-0 transition-[filter,opacity] duration-500 ${
          isLocked ? 'grayscale opacity-40' : 'opacity-100'
        }`}
      >
        <defs>
          <radialGradient id={gradId} cx="35%" cy="28%" r="78%">
            <stop offset="0%" stopColor={light} stopOpacity="0.95" />
            <stop offset="100%" stopColor={base} stopOpacity="0.97" />
          </radialGradient>
        </defs>
        <path
          d="M35 3 L67 35 L35 67 L3 35 Z"
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="1.3"
          opacity="0.55"
        />
        <circle cx="35" cy="24" r="12.5" fill={`url(#${gradId})`} stroke="var(--color-gold)" strokeWidth="0.75" opacity="0.92" />
        <circle cx="46" cy="35" r="12.5" fill={`url(#${gradId})`} stroke="var(--color-gold)" strokeWidth="0.75" opacity="0.88" />
        <circle cx="35" cy="46" r="12.5" fill={`url(#${gradId})`} stroke="var(--color-gold)" strokeWidth="0.75" opacity="0.92" />
        <circle cx="24" cy="35" r="12.5" fill={`url(#${gradId})`} stroke="var(--color-gold)" strokeWidth="0.75" opacity="0.88" />
        <circle cx="35" cy="35" r="4.5" fill="var(--color-gold)" opacity="0.9" />
        <circle cx="3" cy="35" r="2.2" fill="var(--color-gold)" opacity="0.6" />
        <circle cx="67" cy="35" r="2.2" fill="var(--color-gold)" opacity="0.6" />
        <circle cx="35" cy="3" r="2.2" fill="var(--color-gold)" opacity="0.6" />
        <circle cx="35" cy="67" r="2.2" fill="var(--color-gold)" opacity="0.6" />
      </svg>

      {animateSheen && !reducedMotion && !isLocked && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.55) 6%, transparent 18%, transparent 100%)',
            mixBlendMode: 'overlay',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <span
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ fontSize: size * 0.36 }}
      >
        {isLocked ? '🔒' : icon}
      </span>

      {isCompleted && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center rounded-full font-bold"
          style={{
            width: Math.max(16, size * 0.32),
            height: Math.max(16, size * 0.32),
            fontSize: Math.max(9, size * 0.16),
            background: 'var(--color-gold)',
            color: 'var(--color-primary)',
            boxShadow: 'var(--shadow-gold)',
          }}
        >
          ✓
        </span>
      )}

      {isCurrent && !reducedMotion && (
        <motion.span
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 0 2px var(--color-gold), 0 0 0 2px var(--color-gold)',
              '0 0 0 2px var(--color-gold), 0 0 14px 6px rgba(200,169,110,0)',
            ],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      {isCurrent && reducedMotion && (
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: '0 0 0 2px var(--color-gold)' }}
        />
      )}
    </div>
  );
}

/* ============================================================
   PROGRESS RING — ringkasan kemajuan keseluruhan di hero
   ============================================================ */
function ProgressRing({ percent, size = 116 }: { percent: number; size?: number }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(200,169,110,0.18)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-gold)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.3, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-2xl font-bold leading-none"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-dark)' }}
        >
          {percent}%
        </span>
        <span
          className="text-[0.58rem] uppercase tracking-[0.18em] mt-1"
          style={{ color: 'var(--color-stone)' }}
        >
          selesai
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   SECTION DIVIDER (ornamen kecil, senada .ornament-divider)
   ============================================================ */
function SectionDivider() {
  return (
    <div className="flex items-center justify-center gap-4 mx-auto mb-10 max-w-[220px]">
      <span className="flex-1 h-px bg-gradient-to-r from-transparent to-[var(--color-gold)]" />
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]" />
      <span className="flex-1 h-px bg-gradient-to-l from-transparent to-[var(--color-gold)]" />
    </div>
  );
}

/* ============================================================
   ANIMATION VARIANTS
   ============================================================ */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

/* ============================================================
   PAGE
   Catatan penempatan: halaman ini adalah "Peta Kurikulum" LMS
   (dashboard/learn-catholic/page.tsx pada rencana implementasi §7.1),
   berbeda dari landing publik — di sini status kunci/selesai per
   modul ditampilkan. Guard akses sesungguhnya tetap wajib di server.
   ============================================================ */
export default function LearnCatholicLMSPage() {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // Sebelum mount, selalu treat sebagai reducedMotion=true (statis, tanpa animasi)
  // supaya markup SSR sama persis dengan render awal client (hindari hydration mismatch).
  // Setelah mount, baru pakai preferensi OS yang sebenarnya.
  const reducedMotion = !mounted ? true : Boolean(prefersReducedMotion);

  const completedPercent = Math.round((COMPLETED_COUNT / MODULES.length) * 100);
  const currentModule = MODULES[COMPLETED_COUNT] ?? MODULES[MODULES.length - 1];
  const currentTahap = TAHAP_LIST.find((t) => t.slug === currentModule.tahapSlug);
  const hasStarted = COMPLETED_COUNT > 0;

  // Daftar Modul dibuat ringkas: hanya tahap berisi modul yang sedang aktif yang
  // terbuka secara default (accordion satu-per-satu), supaya halaman tidak
  // langsung menampilkan 21 modul sekaligus dan CTA akhir cepat terlihat.
  const [expandedTahap, setExpandedTahap] = useState<string>(currentTahap?.slug ?? TAHAP_LIST[0].slug);

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      {/* ============ 1. HERO — ringkasan perjalanan ============ */}
      <section className="relative overflow-hidden pt-20 pb-6 px-4 md:pt-24 md:pb-8">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, var(--color-cream), var(--color-parchment))' }} />
        <motion.div
          initial={reducedMotion ? undefined : 'hidden'}
          animate={reducedMotion ? undefined : 'visible'}
          variants={staggerContainer}
          className="relative max-w-4xl mx-auto text-center flex flex-col items-center"
        >
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-3 text-[0.7rem] md:text-xs font-semibold tracking-[0.28em] uppercase text-[var(--color-gold-deep)] mb-6"
          >
            <span className="w-8 h-px bg-[var(--color-gold-deep)] opacity-60" />
            Perjalanan Iman Katolik
            <span className="w-8 h-px bg-[var(--color-gold-deep)] opacity-60" />
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="text-3xl md:text-5xl font-bold text-[var(--color-text-dark)] mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Belajar Iman Katolik
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-base md:text-lg text-[var(--color-stone-dark)] max-w-2xl mx-auto leading-relaxed"
          >
            Perjalanan 21 modul — dari pertanyaan paling dasar hingga misteri iman yang terdalam. Untuk pencari kebenaran, baik yang baru mulai maupun yang ingin mendalami.
          </motion.p>
        </motion.div>
      </section>

      {/* ============ 2. QUOTE SECTION ============ */}
      <section className="pt-6 pb-14 px-4 md:pt-8 md:pb-16 bg-[var(--color-parchment)]">
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="text-lg md:text-xl text-[var(--color-text-dark)] italic leading-relaxed" style={{ fontFamily: 'var(--font-heading)' }}>
            &ldquo;Engkau telah menciptakan kami bagi diri-Mu, dan gelisahlah hati kami sebelum
            beristirahat di dalam Engkau.&rdquo;
          </blockquote>
          <p className="text-[var(--color-stone)] mt-4 text-sm">— St. Agustinus, Confessiones I.1</p>
        </div>
      </section>

      {/* ============ 3. EMPAT TAHAP — panel jewel kaca patri ============ */}
      <section className="py-16 md:py-20 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-[var(--color-text-dark)] mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
          Empat Tahap Perjalanan
        </h2>
        <SectionDivider />
        <motion.div
          initial={reducedMotion ? undefined : 'hidden'}
          whileInView={reducedMotion ? undefined : 'visible'}
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {TAHAP_LIST.map((tahap) => {
            const tahapModules = MODULES.filter((m) => m.tahapSlug === tahap.slug);
            const startIdx = MODULES.findIndex((m) => m.tahapSlug === tahap.slug);
            const doneInTahap = tahapModules.filter((_, i) => getModuleStatus(startIdx + i) === 'completed').length;

            return (
              <motion.a
                key={tahap.slug}
                href={`#${tahap.slug}`}
                onClick={() => setExpandedTahap(tahap.slug)}
                variants={fadeUp}
                whileHover={reducedMotion ? undefined : { y: -6 }}
                className="relative overflow-hidden rounded-[4px_24px_4px_24px] p-6 shadow-[var(--shadow-warm)] hover:shadow-[var(--shadow-warm-lg)] transition-shadow flex flex-col items-center text-center"
                style={{ background: `linear-gradient(150deg, ${tahap.jewelLight}, ${tahap.jewelBase} 75%)` }}
              >
                <QuatrefoilMedallion
                  size={64}
                  base={tahap.jewelBase}
                  light={tahap.jewelLight}
                  icon={tahap.icon}
                  animateSheen
                  reducedMotion={reducedMotion}
                />
                <h3 className="font-bold text-lg text-[var(--color-cream)] mt-4 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  {tahap.title}
                </h3>
                <p className="text-sm text-[var(--color-cream)] opacity-90 mb-2">{tahap.subtitle}</p>
                <p className="text-xs text-[var(--color-cream)] opacity-80 mb-4">
                  {tahap.description.slice(0, 80)}...
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-black/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-gold-light)]"
                      style={{ width: `${(doneInTahap / tahapModules.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-[0.65rem] text-[var(--color-cream)] opacity-85 shrink-0">
                    {doneInTahap}/{tahapModules.length}
                  </span>
                </div>
              </motion.a>
            );
          })}
        </motion.div>
      </section>

      {/* ============ 4. MODUL PER TAHAP — ringkas, accordion per tahap ============ */}
      <section className="py-16 md:py-20 px-4 max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-[var(--color-text-dark)] mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
          Daftar Modul
        </h2>
        <SectionDivider />
        <div className="space-y-4">
          {TAHAP_LIST.map((tahap) => {
            const startIdx = MODULES.findIndex((m) => m.tahapSlug === tahap.slug);
            const tahapModules = MODULES.filter((m) => m.tahapSlug === tahap.slug);
            const doneInTahap = tahapModules.filter((_, i) => getModuleStatus(startIdx + i) === 'completed').length;
            const isExpanded = expandedTahap === tahap.slug;

            return (
              <div
                key={tahap.slug}
                id={tahap.slug}
                className="scroll-mt-24 rounded-[4px_20px_4px_20px] bg-white border border-[rgba(200,169,110,0.14)] overflow-hidden"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <button
                  onClick={() => setExpandedTahap(isExpanded ? '' : tahap.slug)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  aria-expanded={isExpanded}
                >
                  <QuatrefoilMedallion size={36} base={tahap.jewelBase} light={tahap.jewelLight} icon={tahap.icon} reducedMotion={reducedMotion} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold tracking-[0.1em] uppercase truncate" style={{ color: 'var(--color-gold-deep)' }}>
                      {tahap.title}
                    </h3>
                    <p className="text-xs truncate" style={{ color: 'var(--color-stone)' }}>
                      {tahap.subtitle} · {doneInTahap}/{tahapModules.length} selesai
                    </p>
                  </div>
                  <ChevronDown
                    size={18}
                    className="shrink-0 transition-transform duration-300"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--color-gold-deep)' }}
                  />
                </button>

                {isExpanded && (
                  <motion.div
                    initial={reducedMotion ? undefined : { opacity: 0, height: 0 }}
                    animate={reducedMotion ? undefined : { opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="px-4 pb-4 space-y-2.5 border-t border-[rgba(200,169,110,0.12)] pt-4"
                  >
                    {tahapModules.map((module, i) => {
                      const status = getModuleStatus(startIdx + i);
                      const isLocked = status === 'locked';

                      const rowClassName = `flex items-center gap-3 rounded-[4px_16px_4px_16px] p-3 border transition-shadow ${
                        isLocked
                          ? 'border-[rgba(139,115,85,0.12)] cursor-not-allowed opacity-70'
                          : 'border-[rgba(200,169,110,0.14)] hover:shadow-[var(--shadow-gold)]'
                      }`;

                      const rowContent = (
                        <>
                          <QuatrefoilMedallion
                            size={34}
                            base={tahap.jewelBase}
                            light={tahap.jewelLight}
                            icon={module.icon}
                            status={status}
                            animateSheen={status === 'current'}
                            reducedMotion={reducedMotion}
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-[var(--color-text-dark)] truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                              {module.title}
                            </h4>
                            <p className="text-xs text-[var(--color-stone)] truncate">
                              {isLocked ? 'Selesaikan modul sebelumnya untuk membuka' : module.subtitle}
                            </p>
                          </div>
                          {status === 'current' && (
                            <span
                              className="shrink-0 text-[0.58rem] font-semibold uppercase tracking-[0.1em] px-2 py-1 rounded-full"
                              style={{ background: 'rgba(200,169,110,0.15)', color: 'var(--color-gold-deep)' }}
                            >
                              {hasStarted ? 'Lanjutkan' : 'Mulai'}
                            </span>
                          )}
                        </>
                      );

                      return isLocked ? (
                        <div key={module.slug} className={rowClassName} aria-disabled="true" role="button" tabIndex={-1}>
                          {rowContent}
                        </div>
                      ) : (
                        <Link key={module.slug} href={`/public/learn-catholic/modul/${module.slug}`} className={rowClassName}>
                          {rowContent}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ 5. CTA FOOTER — panel krem yang menonjol lewat elevasi, bukan warna gelap ============ */}
      <section className="py-16 md:py-24 px-4 bg-[var(--color-cream)]">
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 28 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative max-w-2xl mx-auto text-center overflow-hidden rounded-[6px_32px_6px_32px] px-6 py-12 md:px-16 md:py-16"
          style={{
            background: 'linear-gradient(155deg, var(--color-parchment) 0%, var(--color-gold-light) 145%)',
            border: '1px solid rgba(200,169,110,0.4)',
            boxShadow: 'var(--shadow-warm-lg), 0 0 0 1px rgba(200,169,110,0.12)',
          }}
        >
          {/* radial glow tipis di belakang konten, memberi kedalaman tanpa menggelapkan */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(200,169,110,0.35), transparent 65%)' }}
          />
          {/* aksen sudut, senada gaya .pengumuman-card di public.css */}
          <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-[6px]" style={{ borderColor: 'var(--color-gold)', opacity: 0.6 }} />
          <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-[6px]" style={{ borderColor: 'var(--color-gold)', opacity: 0.6 }} />

          <div className="relative flex flex-col items-center">
            <QuatrefoilMedallion
              size={60}
              base={currentTahap?.jewelBase ?? '#a87a2c'}
              light={currentTahap?.jewelLight ?? '#c8a96e'}
              icon={currentModule.icon}
              status="current"
              animateSheen
              reducedMotion={reducedMotion}
            />

            <span className="mt-5 text-[0.7rem] font-semibold tracking-[0.28em] uppercase text-[var(--color-gold-deep)]">
              {hasStarted ? 'Lanjutkan Perjalananmu' : 'Mulai dari Sini'}
            </span>

            <h2
              className="text-2xl md:text-3xl font-bold text-[var(--color-text-dark)] mt-2 mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {hasStarted ? 'Siap Melanjutkan?' : 'Siap Memulai?'}
            </h2>

            <p className="text-[var(--color-stone-dark)] mb-9 max-w-md mx-auto leading-relaxed">
              Tidak perlu menjadi seorang teolog. Tidak perlu sudah percaya. Cukup datang dengan rasa
              ingin tahu dan hati yang terbuka.
            </p>

            <Link
              href={`/public/learn-catholic/modul/${currentModule.slug}`}
              className="relative inline-flex items-center justify-center gap-2 whitespace-nowrap px-9 py-3.5 md:px-10 md:py-4 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-deep)] text-[var(--color-cream)] rounded-[2px_24px_2px_24px] font-semibold shadow-[var(--shadow-gold-lg)] hover:shadow-[var(--shadow-gold-lg)] hover:-translate-y-0.5 hover:scale-[1.02] transition-all"
            >
              {hasStarted ? (
                <>Lanjutkan: {currentModule.title} <span aria-hidden="true">→</span></>
              ) : (
                <>Mulai: {currentModule.title} <span aria-hidden="true">→</span></>
              )}
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
