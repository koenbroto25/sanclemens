'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTodayLiturgicalInfo, type LiturgicalInfo } from '@/lib/liturgi/liturgicalCalendar';
import { IconArrowRight, IconChevronUp, IconCross } from '@tabler/icons-react';

const LITURGI_COLOR_MAP: Record<string, string> = {
  Hijau: '#4a8c5c', Putih: '#f0ebe0', Merah: '#8b2635', Ungu: '#6b4c8a', Rosa: '#e8a0b0', Emas: '#c8a96e',
};

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* Feature icons as inline SVG */
const FeatureIcons: Record<string, React.ReactElement> = {
  heart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  envelope: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  sos: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  briefcase: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  ),
  gift: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  monitor: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  smartphone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  userCheck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
    </svg>
  ),
  smile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><path d="M8 13s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  ),
  brain: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.98-3 2.5 2.5 0 0 1-1.32-4.24 3 3 0 0 1 .34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.98-3 2.5 2.5 0 0 0 1.32-4.24 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2z" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

/* ============================================================
   FEATURE CARDS DATA
   ============================================================ */
const features = [
  {
    group: 'A. PENDAMPINGAN IMAN UNTUK HIDUP SEHARI-HARI',
    items: [
      {
        icon: 'heart',
        title: 'Sahabat Rohani Pribadi (Klemen Companion)',
        desc: 'Di tengah perjalanan iman Anda, tak jarang kita butuh telinga yang mendengarkan. Klemen Companion hadir sebagai sahabat rohani digital Anda, siap menemani dalam doa, membimbing dalam discernment hidup, atau sekadar mendengarkan keluh kesah Anda, dengan privasi End-to-End Encryption yang terjamin. Ia adalah teman setia yang selalu ada, tanpa menghakimi, untuk menuntun Anda menemukan damai sejahtera.',
      },
      {
        icon: 'book',
        title: 'Belajar Iman yang Menyenangkan (Learn Catholic)',
        desc: 'Ingin mendalami ajaran Gereja? Temukan modul pembelajaran interaktif yang terstruktur, langsung dari sumber-sumber resmi seperti Katekismus dan Konsili Vatikan II. Belajar kapan saja, di mana saja, dengan bimbingan AI yang ramah, dan lacak kemajuan Anda dalam pemahaman iman.',
      },
      {
        icon: 'envelope',
        title: 'Surat Pastoral Penuh Rahasia',
        desc: 'Terima pesan dan bimbingan langsung dari Pastor Paroki melalui surat pastoral yang terenkripsi sepenuhnya. Komunikasi pribadi dan rahasia yang hanya bisa diakses oleh Anda dan Pastor, menjaga kerahasiaan isi hati Anda.',
      },
    ],
  },
  {
    group: 'B. SOLIDARITAS KOMUNITAS & KEMUDAHAN HIDUP BERSAMA',
    items: [
      {
        icon: 'sos',
        title: 'Bantuan Cepat di Saat Genting (Tiga Pintu Kasih)',
        desc: 'Ketika musibah tak terduga menghampiri atau kebutuhan mendesak muncul, Paroki Anda siap sedia. Melalui "Pintu SOS" untuk keadaan darurat dan "Pintu Kasih" untuk bantuan terencana, kami hadir memberikan uluran tangan dengan cepat dan terpercaya, yang menjaga martabat Anda.',
      },
      {
        icon: 'briefcase',
        title: 'Jejaring Solidaritas untuk Pekerjaan & Bantuan (Klemen Kerja)',
        desc: 'Temukan peluang pekerjaan baru atau tawarkan keahlian Anda di antara sesama umat. Klemen Kerja menghubungkan Anda dengan jaringan solidaritas ekonomi paroki. Apakah Anda mencari nafkah atau ingin membantu sesama, platform ini memudahkan Anda beraksi nyata, dengan perhatian khusus bagi yang paling membutuhkan.',
      },
      {
        icon: 'gift',
        title: 'Donasi Penuh Rahmat (Tiga Pintu Kasih Ã¢â‚¬â€œ Donasi)',
        desc: 'Salurkan kebaikan hati Anda melalui donasi sukarela yang transparan dan sepenuhnya anonim. Dana Anda masuk ke rekening khusus donasi dan dana kasih, dikelola dengan audit ketat, serta disalurkan kepada yang membutuhkan dengan prinsip "Invisible Grace", menjaga privasi dan martabat semua pihak.',
      },
      {
        icon: 'users',
        title: 'Kartu Keluarga Katolik Digital & Jejaring Komunitas',
        desc: 'Dapatkan Kartu Keluarga Katolik Digital Anda dan perkuat tali persaudaraan dengan sesama umat. Sistem kami membantu Anda terhubung dengan keluarga dan komunitas lingkungan paroki Anda. Semua data keluarga dikelola dengan aman, mudah diakses, dan membantu Anda merasa menjadi bagian tak terpisahkan dari keluarga besar Paroki Santo Klemens.',
      },
      {
        icon: 'sun',
        title: 'Perhatian untuk Lansia Kita (Morning Check)',
        desc: 'Bentuk kepedulian nyata Paroki untuk umat lansia yang terkasih. Sistem Morning Check memastikan keselamatan dan kesejahteraan harian para lansia, dengan notifikasi pengingat dan jalur eskalasi darurat jika dibutuhkan. Memberikan ketenangan bagi keluarga dan pengurus lingkungan.',
      },
      {
        icon: 'shield',
        title: 'Lingkungan Paroki yang Bersih & Berintegritas (Whistle-Blower)',
        desc: 'Mewujudkan lingkungan paroki yang bersih dan penuh integritas. Laporkan dugaan pelanggaran atau masalah serius secara anonim dan aman, langsung kepada Pastor Paroki, tanpa perantara. Identitas Anda terlindungi sepenuhnya.',
      },
      {
        icon: 'settings',
        title: 'Manajemen Terpadu untuk Pelayan Gereja',
        desc: 'Bagi para pengurus gereja dan lingkungan, ekosistem ini menyediakan alat manajemen terintegrasi yang canggih. Dari pengelolaan jadwal misa, kegiatan, warta paroki, verifikasi umat, hingga pelaporan keuangan, semuanya terdigitalisasi untuk efisiensi dan transparansi pelayanan pastoral.',
      },
    ],
  },
];

const steps = [
  {
    num: '1',
    icon: 'monitor',
    title: 'Kunjungi Website Kami',
    desc: 'Akses Ekosistem Digital Paroki Santo Klemens langsung dari browser perangkat Anda.',
  },
  {
    num: '2',
    icon: 'smartphone',
    title: 'Daftar & Verifikasi Akun',
    desc: 'Proses pendaftaran cepat dan aman menggunakan nomor WhatsApp Anda. Verifikasi instan melalui OTP akan segera Anda terima.',
  },
  {
    num: '3',
    icon: 'userCheck',
    title: 'Tunggu Klarifikasi Lingkungan',
    desc: 'Setelah mendaftar, Ketua Lingkungan Anda akan melakukan klarifikasi singkat untuk mengaktifkan akun Anda sepenuhnya, memastikan Anda terhubung dengan komunitas lokal yang terpercaya.',
  },
  {
    num: '4',
    icon: 'smile',
    title: 'Jelajahi & Rasakan Manfaatnya!',
    desc: 'Selamat datang! Anda kini siap menjelajahi semua fitur: dari pendampingan rohani, mencari pekerjaan, hingga berpartisipasi dalam program kasih. Damai Sejahtera menanti Anda!',
  },
];

const trustCards = [
  {
    icon: 'brain',
    text: 'Didukung oleh Teknologi AI Cerdas yang Berpedoman pada Ajaran Gereja.',
  },
  {
    icon: 'lock',
    text: 'Keamanan Data Anda adalah Prioritas Utama Kami: Terenkripsi End-to-End dan Diaudit Ketat.',
  },
  {
    icon: 'eye',
    text: 'Transparansi & Akuntabilitas Penuh dalam Setiap Pelayanan Pastoral dan Sosial.',
  },
];

/* ============================================================
   PAGE COMPONENT
   ============================================================ */
export default function TentangEkosistemPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [liturgicalInfo, setLiturgicalInfo] = useState<LiturgicalInfo | null>(null);

  // Fetch liturgical theme
  useEffect(() => {
    async function fetchLiturgicalTheme() {
      try {
        const info = await getTodayLiturgicalInfo();
        setLiturgicalInfo(info);
        if (typeof document !== 'undefined') {
          const hex = LITURGI_COLOR_MAP[info.color] || '#c8a96e';
          const root = document.documentElement;
          root.style.setProperty('--liturgi-current', hex);
          root.style.setProperty('--liturgi-current-soft', hexToRgba(hex, 0.12));
        }
      } catch (err) {
        console.error('Error fetching liturgical theme:', err);
      }
    }
    fetchLiturgicalTheme();
  }, []);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > window.innerHeight);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const revealEls = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Stagger child cards
            const cards = entry.target.querySelectorAll<HTMLElement>(
              '.feature-card, .step-card, .trust-card'
            );
            cards.forEach((card, i) => {
              card.style.transitionDelay = `${i * 80}ms`;
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      {/* Liturgical accent bar Ã¢â‚¬â€ rendered by layout but kept here for safety */}
      <div className="liturgi-accent-bar" suppressHydrationWarning></div>

      {/* ============================================================ */}
      {/* PAGE STYLES                                                   */}
      {/* ============================================================ */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Ã¢â€â‚¬Ã¢â€â‚¬ REVEAL ANIMATION Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.65s var(--transition-reveal, ease), transform 0.65s var(--transition-reveal, ease);
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal,
          .feature-card,
          .step-card,
          .trust-card,
          .gold-trace {
            transition: none !important;
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }

        /* Ã¢â€â‚¬Ã¢â€â‚¬ HERO SECTION Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
        .hero-ekosistem {
          position: relative;
          overflow: hidden;
          min-height: 92vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 7rem 1.5rem 5rem;
          background: var(--color-primary, #1a0e05);
        }
        .hero-ekosistem .hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .hero-ekosistem .vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 30%, rgba(10,5,2,0.72) 100%);
        }
        .hero-ekosistem .grain {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E");
          opacity: 0.4;
        }
        .hero-ekosistem .stained-glass-mesh {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 55% 40% at 18% 25%, rgba(42,80,160,0.13) 0%, transparent 70%),
            radial-gradient(ellipse 45% 50% at 82% 15%, rgba(139,38,53,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 50% 45% at 65% 80%, rgba(74,140,92,0.10) 0%, transparent 70%),
            radial-gradient(ellipse 40% 35% at 10% 75%, rgba(107,76,138,0.10) 0%, transparent 70%);
        }
        .hero-ekosistem .light-particles {
          position: absolute;
          inset: 0;
        }
        .hero-ekosistem .light-particles span {
          position: absolute;
          display: block;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--color-gold, #c8a96e);
          opacity: 0;
          animation: floatParticle 8s ease-in-out infinite;
        }
        .hero-ekosistem .light-particles span:nth-child(1) { left:12%; top:20%; animation-delay:0s; }
        .hero-ekosistem .light-particles span:nth-child(2) { left:30%; top:60%; animation-delay:1.2s; }
        .hero-ekosistem .light-particles span:nth-child(3) { left:55%; top:30%; animation-delay:2.4s; }
        .hero-ekosistem .light-particles span:nth-child(4) { left:78%; top:70%; animation-delay:0.6s; }
        .hero-ekosistem .light-particles span:nth-child(5) { left:90%; top:20%; animation-delay:3.5s; }
        .hero-ekosistem .light-particles span:nth-child(6) { left:45%; top:85%; animation-delay:1.8s; }
        .hero-ekosistem .light-particles span:nth-child(7) { left:68%; top:50%; animation-delay:4.2s; }
        .hero-ekosistem .light-particles span:nth-child(8) { left:22%; top:40%; animation-delay:2.9s; }
        @keyframes floatParticle {
          0%, 100% { opacity: 0; transform: translateY(0) scale(1); }
          30% { opacity: 0.7; }
          60% { opacity: 0.4; transform: translateY(-18px) scale(1.4); }
        }

        .hero-ekosistem .hero-content {
          position: relative;
          z-index: 1;
          max-width: 780px;
          margin: 0 auto;
          text-align: center;
        }
        .hero-eyebrow {
          display: inline-block;
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--color-gold, #c8a96e);
          background: rgba(200,169,110,0.1);
          border: 1px solid rgba(200,169,110,0.25);
          border-radius: 2px 16px 2px 16px;
          padding: 0.35em 1.1em;
          margin-bottom: 1.5rem;
        }
        .hero-ekosistem h1 {
          font-family: var(--font-heading, 'Cormorant Garamond', serif);
          font-size: clamp(2.1rem, 5.5vw, 3.8rem);
          font-weight: 700;
          line-height: 1.2;
          color: var(--color-cream, #f5f0e8);
          margin-bottom: 1.4rem;
          letter-spacing: -0.01em;
        }
        .hero-ekosistem h1 em {
          font-style: italic;
          color: var(--color-gold, #c8a96e);
        }
        .hero-sub {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: clamp(1rem, 2vw, 1.15rem);
          color: rgba(245,240,232,0.78);
          line-height: 1.75;
          max-width: 600px;
          margin: 0 auto 2.4rem;
        }
        .hero-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* Ã¢â€â‚¬Ã¢â€â‚¬ ORNAMENT DIVIDER Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
        .ornament-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.4rem auto 2.4rem;
          max-width: 280px;
          color: var(--color-gold, #c8a96e);
        }
        .ornament-divider .line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, var(--color-gold, #c8a96e), transparent);
          opacity: 0.5;
        }
        .ornament-divider .cross {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        /* Ã¢â€â‚¬Ã¢â€â‚¬ SECTION BASE Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
        .te-section {
          padding: 5rem 1.5rem;
        }
        .te-section-inner {
          max-width: 1100px;
          margin: 0 auto;
          text-align: center;
        }

        /* Ã¢â€â‚¬Ã¢â€â‚¬ SECTION 2 Ã¢â‚¬â€ MANFAAT Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
        .section-manfaat {
          background: var(--color-cream, #f5f0e8);
        }
        .feature-group-label {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-gold, #c8a96e);
          margin: 3rem 0 1.2rem;
          text-align: left;
        }
        .feature-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
          text-align: left;
        }
        @media (min-width: 640px) {
          .feature-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 900px) {
          .feature-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .feature-card {
          position: relative;
          background: #fff;
          border-radius: 2px 20px 2px 20px;
          padding: 1.75rem 1.5rem 1.5rem;
          box-shadow: var(--shadow-card, 0 2px 16px rgba(26,14,5,0.08));
          border-bottom: 2px solid var(--color-gold, #c8a96e);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          overflow: hidden;
        }
        .feature-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-gold, 0 6px 28px rgba(200,169,110,0.18));
        }
        .feature-card:focus-within {
          outline: 2px solid var(--color-gold, #c8a96e);
          outline-offset: 2px;
        }
        .feature-icon {
          width: 2.4rem;
          height: 2.4rem;
          color: var(--color-gold, #c8a96e);
          margin-bottom: 1rem;
        }
        .feature-card h3 {
          font-family: var(--font-heading, 'Cormorant Garamond', serif);
          font-size: 1.18rem;
          font-weight: 700;
          color: var(--color-primary, #1a0e05);
          margin-bottom: 0.6rem;
          line-height: 1.3;
        }
        .feature-card p {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.88rem;
          color: var(--color-text-dark, #3d2b1f);
          line-height: 1.7;
          margin: 0;
        }
        .gold-trace {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--color-gold, #c8a96e), transparent);
          transition: width 0.4s ease;
        }
        .feature-card:hover .gold-trace {
          width: 100%;
        }

        /* Ã¢â€â‚¬Ã¢â€â‚¬ SECTION 3 Ã¢â‚¬â€ CARA BERGABUNG Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
        .section-bergabung {
          background: var(--color-primary, #1a0e05);
          position: relative;
          overflow: hidden;
        }
        .section-bergabung .stained-glass-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse 60% 50% at 20% 50%, rgba(42,80,160,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 80% 50%, rgba(107,76,138,0.08) 0%, transparent 70%);
        }
        .steps-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          position: relative;
          z-index: 1;
        }
        @media (min-width: 640px) {
          .steps-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 900px) {
          .steps-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .step-card {
          position: relative;
          background: rgba(245,240,232,0.04);
          border: 1px solid rgba(200,169,110,0.18);
          border-top: 3px solid var(--color-gold, #c8a96e);
          border-radius: 2px 20px 2px 20px;
          padding: 2rem 1.4rem 1.6rem;
          text-align: left;
          transition: transform 0.25s ease, background 0.25s ease;
          overflow: hidden;
        }
        .step-card:hover {
          transform: translateY(-4px);
          background: rgba(245,240,232,0.07);
        }
        .step-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.2rem;
          height: 2.2rem;
          border-radius: 50%;
          background: var(--color-gold, #c8a96e);
          color: var(--color-primary, #1a0e05);
          font-family: var(--font-heading, 'Cormorant Garamond', serif);
          font-size: 1.1rem;
          font-weight: 800;
          margin-bottom: 0.8rem;
          flex-shrink: 0;
        }
        .step-icon {
          width: 2rem;
          height: 2rem;
          color: rgba(200,169,110,0.6);
          margin-bottom: 0.75rem;
        }
        .step-card h3 {
          font-family: var(--font-heading, 'Cormorant Garamond', serif);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-cream, #f5f0e8);
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }
        .step-card p {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.85rem;
          color: rgba(245,240,232,0.65);
          line-height: 1.65;
          margin: 0;
        }

        /* Ã¢â€â‚¬Ã¢â€â‚¬ SECTION 3b Ã¢â‚¬â€ FONDASI KEPERCAYAAN Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
        .section-trust {
          background: var(--color-cream, #f5f0e8);
        }
        .trust-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 640px) {
          .trust-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .trust-card {
          background: #fff;
          border: 1px solid rgba(200,169,110,0.22);
          border-radius: 2px 20px 2px 20px;
          padding: 2.2rem 1.6rem;
          text-align: center;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          overflow: hidden;
          position: relative;
        }
        .trust-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-gold, 0 6px 28px rgba(200,169,110,0.15));
        }
        .trust-icon {
          width: 3rem;
          height: 3rem;
          color: var(--color-gold, #c8a96e);
          margin: 0 auto 1.2rem;
          display: block;
        }
        .trust-card p {
          font-family: var(--font-heading, 'Cormorant Garamond', serif);
          font-size: 1.12rem;
          font-style: italic;
          color: var(--color-primary, #1a0e05);
          line-height: 1.6;
          margin: 0;
        }

        /* Ã¢â€â‚¬Ã¢â€â‚¬ SECTION 4 Ã¢â‚¬â€ CTA FINAL Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
        .section-cta-final {
          background: var(--color-primary, #1a0e05);
          position: relative;
          overflow: hidden;
        }
        .section-cta-final .bg-pulse {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse 70% 60% at 50% 50%, rgba(200,169,110,0.06) 0%, transparent 70%);
          animation: liturgiPulseGlow 4.5s ease-in-out infinite;
        }
        @keyframes liturgiPulseGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        .section-cta-final .stained-glass-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse 50% 40% at 15% 30%, rgba(42,80,160,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 45% 40% at 85% 70%, rgba(139,38,53,0.07) 0%, transparent 70%);
        }
        .section-cta-final .te-section-inner {
          position: relative;
          z-index: 1;
        }
        .cta-subtitle {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 1.05rem;
          color: rgba(245,240,232,0.75);
          line-height: 1.7;
          max-width: 540px;
          margin: 0 auto 2rem;
        }
        .cta-final-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .btn-gold-outline {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.85rem 1.8rem;
          border-radius: 2px 16px 2px 16px;
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--color-gold, #c8a96e);
          border: 1.5px solid rgba(200,169,110,0.4);
          background: transparent;
          transition: background 0.25s ease, border-color 0.25s ease;
          text-decoration: none;
          min-height: 44px;
        }
        .btn-gold-outline:hover {
          background: rgba(200,169,110,0.08);
          border-color: var(--color-gold, #c8a96e);
        }
        .btn-gold-outline:focus-visible {
          outline: 2px solid var(--color-gold, #c8a96e);
          outline-offset: 2px;
        }
        .cta-small-note {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.78rem;
          color: rgba(245,240,232,0.4);
          margin-top: 1rem;
        }

        /* Ã¢â€â‚¬Ã¢â€â‚¬ SCROLL TO TOP Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
        .scroll-top-btn {
          position: fixed;
          bottom: 2rem;
          right: 1.5rem;
          z-index: 100;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--color-gold, #c8a96e);
          color: var(--color-primary, #1a0e05);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(200,169,110,0.35);
          transition: opacity 0.3s ease, transform 0.3s ease;
          opacity: 0;
          pointer-events: none;
        }
        .scroll-top-btn.visible {
          opacity: 1;
          pointer-events: auto;
        }
        .scroll-top-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(200,169,110,0.45);
        }
        .scroll-top-btn:focus-visible {
          outline: 2px solid var(--color-gold, #c8a96e);
          outline-offset: 3px;
        }
        .scroll-top-btn svg {
          width: 20px;
          height: 20px;
        }

        /* Ã¢â€â‚¬Ã¢â€â‚¬ SECTION TITLE OVERRIDES FOR DARK SECTIONS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
        .on-dark .section-title,
        .on-dark .section-eyebrow,
        .on-dark .section-subtitle {
          color: var(--color-cream, #f5f0e8);
        }
        .on-dark .section-eyebrow {
          color: var(--color-gold, #c8a96e);
          background: rgba(200,169,110,0.08);
          border-color: rgba(200,169,110,0.2);
        }
        .on-dark .ornament-divider {
          color: var(--color-gold, #c8a96e);
        }
        .on-dark .section-subtitle {
          color: rgba(245,240,232,0.68);
        }

        /* Ã¢â€â‚¬Ã¢â€â‚¬ SHARED SECTION EYEBROW Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
        .section-eyebrow {
          display: inline-block;
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-gold, #c8a96e);
          background: rgba(200,169,110,0.1);
          border: 1px solid rgba(200,169,110,0.22);
          border-radius: 2px 14px 2px 14px;
          padding: 0.3em 1em;
          margin-bottom: 1rem;
        }
        .section-title {
          font-family: var(--font-heading, 'Cormorant Garamond', serif);
          font-size: clamp(1.7rem, 4vw, 2.6rem);
          font-weight: 700;
          color: var(--color-primary, #1a0e05);
          line-height: 1.25;
          margin-bottom: 0.6rem;
        }
        .section-subtitle {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 1rem;
          color: var(--color-text-dark, #3d2b1f);
          line-height: 1.7;
          max-width: 580px;
          margin: 0 auto;
          opacity: 0.78;
        }

        /* Ã¢â€â‚¬Ã¢â€â‚¬ BUTTON OVERRIDES Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
        .btn-hero-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.9rem 2rem;
          border-radius: 2px 16px 2px 16px;
          background: var(--color-gold, #c8a96e);
          color: var(--color-primary, #1a0e05);
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.96rem;
          font-weight: 700;
          text-decoration: none;
          transition: box-shadow 0.25s ease, transform 0.2s ease;
          min-height: 44px;
          white-space: nowrap;
        }
        .btn-hero-primary:hover {
          box-shadow: var(--shadow-gold-lg, 0 8px 32px rgba(200,169,110,0.38));
          transform: translateY(-1px);
        }
        .btn-hero-primary:focus-visible {
          outline: 2px solid var(--color-gold, #c8a96e);
          outline-offset: 2px;
        }
        .btn-hero-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.9rem 2rem;
          border-radius: 2px 16px 2px 16px;
          background: transparent;
          color: var(--color-cream, #f5f0e8);
          border: 1.5px solid rgba(245,240,232,0.3);
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.96rem;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.25s ease, border-color 0.25s ease;
          min-height: 44px;
        }
        .btn-hero-secondary:hover {
          background: rgba(245,240,232,0.07);
          border-color: rgba(245,240,232,0.6);
        }
        .btn-hero-secondary:focus-visible {
          outline: 2px solid var(--color-gold, #c8a96e);
          outline-offset: 2px;
        }
      ` }} />

      {/* ============================================================ */}
      {/* SECTION 1 Ã¢â‚¬â€ HERO                                             */}
      {/* ============================================================ */}
      <section className="hero-ekosistem reveal" id="atas" aria-label="Pengenalan Ekosistem Digital Paroki">
        <div className="hero-bg" aria-hidden="true">
          <div className="vignette"></div>
          <div className="grain"></div>
          <div className="stained-glass-mesh"></div>
          <div className="light-particles">
            <span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span>
          </div>
        </div>
        <div className="hero-content">
          <p className="hero-eyebrow">Ekosistem Digital Paroki Santo Klemens</p>
          <h1>
            Ekosistem Digital Paroki Santo Klemens:<br />
            <em>Komunitas Peduli, Pelayanan Terpercaya,</em><br />
            Damai Sejahtera untuk Semua.
          </h1>
          <p className="hero-sub">
            Temukan dukungan spiritual, kemudahan administratif, dan solidaritas sosial yang nyata,
            langsung dalam genggaman Anda.
          </p>
          <div className="hero-actions">
            <a href="/auth/register" className="btn-hero-primary">
              Gabung Sekarang &amp; Rasakan Manfaatnya <IconArrowRight />
            </a>
            <a href="#manfaat" className="btn-hero-secondary">
              Kenali Lebih Jauh
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 2 Ã¢â‚¬â€ MANFAAT                                          */}
      {/* ============================================================ */}
      <section className="te-section section-manfaat reveal" id="manfaat" aria-label="Manfaat Ekosistem">
        <div className="te-section-inner">
          <p className="section-eyebrow">Manfaat Nyata</p>
          <h2 className="section-title">Mengapa Anda Wajib Terlibat?</h2>
          <p className="section-subtitle">
            Manfaat nyata untuk setiap umat, dalam spiritualitas, komunitas, dan kehidupan sehari-hari
          </p>
          <div className="ornament-divider" aria-hidden="true">
            <span className="line"></span>
            <span className="cross"><IconCross /></span>
            <span className="line"></span>
          </div>

          {features.map((group) => (
            <div key={group.group}>
              <p className="feature-group-label">{group.group}</p>
              <div className="feature-grid">
                {group.items.map((item) => (
                  <article className="feature-card" key={item.title}>
                    <div className="feature-icon" aria-hidden="true">
                      {FeatureIcons[item.icon]}
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                    <div className="gold-trace" aria-hidden="true"></div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 3 Ã¢â‚¬â€ CARA BERGABUNG                                   */}
      {/* ============================================================ */}
      <section className="te-section section-bergabung reveal on-dark" id="bergabung" aria-label="Cara Bergabung">
        <div className="stained-glass-overlay" aria-hidden="true"></div>
        <div className="te-section-inner">
          <p className="section-eyebrow">Mulai Sekarang</p>
          <h2 className="section-title">Cara Bergabung: Empat Langkah Mudah untuk Terlibat</h2>
          <p className="section-subtitle">Proses sederhana, manfaat seumur hidup</p>
          <div className="ornament-divider" aria-hidden="true">
            <span className="line"></span>
            <span className="cross"><IconCross /></span>
            <span className="line"></span>
          </div>
          <div className="steps-grid">
            {steps.map((step) => (
              <article className="step-card" key={step.num}>
                <div className="step-number" aria-label={`Langkah ${step.num}`}>{step.num}</div>
                <div className="step-icon" aria-hidden="true">
                  {FeatureIcons[step.icon]}
                </div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 3b Ã¢â‚¬â€ FONDASI KEPERCAYAAN                             */}
      {/* ============================================================ */}
      <section className="te-section section-trust reveal" id="kepercayaan" aria-label="Fondasi Kepercayaan">
        <div className="te-section-inner">
          <p className="section-eyebrow">Fondasi Kepercayaan</p>
          <h2 className="section-title">Pengakuan &amp; Keamanan: Fondasi Kepercayaan</h2>
          <p className="section-subtitle">Teknologi yang berdaulat pada nilai-nilai iman</p>
          <div className="ornament-divider" aria-hidden="true">
            <span className="line"></span>
            <span className="cross"><IconCross /></span>
            <span className="line"></span>
          </div>
          <div className="trust-grid">
            {trustCards.map((card) => (
              <article className="trust-card" key={card.icon}>
                <div className="trust-icon" aria-hidden="true">
                  {FeatureIcons[card.icon]}
                </div>
                <p>{card.text}</p>
                <div className="gold-trace" aria-hidden="true"></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 4 Ã¢â‚¬â€ CTA FINAL                                        */}
      {/* ============================================================ */}
      <section className="te-section section-cta-final reveal" id="daftar" aria-label="Ajakan Bergabung">
        <div className="bg-pulse" aria-hidden="true"></div>
        <div className="stained-glass-overlay" aria-hidden="true"></div>
        <div className="te-section-inner on-dark">
          <p className="section-eyebrow">Bergabunglah dengan Kami</p>
          <h2 className="section-title">
            Siap Menjadi Bagian dari<br />Keluarga Digital Paroki?
          </h2>
          <div className="ornament-divider" aria-hidden="true">
            <span className="line"></span>
            <span className="cross"><IconCross /></span>
            <span className="line"></span>
          </div>
          <p className="cta-subtitle">
            Bergabunglah dengan ribuan umat yang sudah merasakan manfaat ekosistem ini.
            Pendaftaran gratis, aman, dan hanya perlu beberapa menit.
          </p>
          <div className="cta-final-actions">
            <Link href="/auth/register" className="btn-hero-primary">
              Gabung Sekarang <IconArrowRight />
            </Link>
            <Link href="/public" className="btn-gold-outline">
              Kembali ke Beranda
            </Link>
          </div>
          <p className="cta-small-note">
            Gratis Ã‚Â· Aman Ã‚Â· Data Anda milik Anda Ã‚Â· Dilindungi UU PDP No. 27/2022
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SCROLL TO TOP                                                 */}
      {/* ============================================================ */}
      <button
        className={`scroll-top-btn${showScrollTop ? ' visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Kembali ke atas"
        type="button"
      >
        <IconChevronUp />
      </button>
    </>
  );
}
