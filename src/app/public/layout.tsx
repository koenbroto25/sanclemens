'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import '../../styles/public.css';
import SpiritualGatewayModal from '@/components/liturgi/SpiritualGatewayModal';
import AboutUsSlide from '@/components/AboutUsSlide';
import { getTodayLiturgicalInfo, type LiturgicalInfo } from '@/lib/liturgi/liturgicalCalendar';
import { ArrowUpIcon, MessageCircleIcon } from 'lucide-react';


/* ============================================================
   SAINT CLEMENS ICON — Round image component
   ============================================================ */
function SaintClemensIcon({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/images/saint-clemens.jpg"
      alt="Santo Klemens"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        border: `2px solid var(--color-gold)`,
        boxShadow: '0 0 12px rgba(200,169,110,0.3)',
      }}
    />
  );
}

/* ============================================================
   LITURGICAL COLOR MAPPING & HELPERS
   ============================================================ */
const LITURGI_COLOR_MAP: Record<string, string> = {
  Hijau: '#4a8c5c',
  Putih: '#f0ebe0',
  Merah: '#8b2635',
  Ungu: '#6b4c8a',
  Rosa: '#e8a0b0',
  Emas: '#c8a96e',
};

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [liturgicalInfo, setLiturgicalInfo] = useState<LiturgicalInfo | null>(null);

  // Navbar scroll state
  useEffect(() => {
    const handleScroll = () => {
      setIsNavScrolled(window.scrollY > 60);
      setShowScrollTop(window.scrollY > window.innerHeight);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

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

  // Scroll-reveal animation observer
  useEffect(() => {
    const revealEls = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
    return () => revealObserver.disconnect();
  }, [children]); // Re-run when children might change

  const toggleMobileMenu = () => setIsMobileMenuOpen((open) => !open);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      <SpiritualGatewayModal />
      {/* AboutUsSlide dinonaktifkan */}

      <div className="liturgi-accent-bar" suppressHydrationWarning></div>

      <svg className="svg-filters" aria-hidden="true">
        <defs>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" mode="multiply" />
          </filter>
        </defs>
      </svg>

      <header className={`navbar ${isNavScrolled ? 'scrolled' : ''}`} id="navbar" role="banner">
        <div className="navbar-inner">
          <Link href="/public" className="navbar-logo" aria-label="Paroki Santo Klemens Sepinggan">
            <span className="logo-icon">
              <SaintClemensIcon size={36} />
            </span>
            <span className="logo-text">
              <span className="logo-name">Santo Klemens</span>
              <span className="logo-sub">Sepinggan</span>
            </span>
          </Link>
          <nav className="navbar-nav" aria-label="Navigasi utama">
            <Link href="/public/tentang-ekosistem">Tentang</Link>
            <Link href="/public/learn-catholic">Belajar Katolik</Link>
            <Link href="/public/renungan-harian">Renungan Harian</Link>
            <Link href="/public/warta-paroki">Warta</Link>
            <Link href="/public/kegiatan">Kegiatan</Link>
            <Link href="/public/profil-paroki">Profil</Link>
            <Link href="/public/pasar-kasih">Pasar Kasih</Link>
          </nav>
          <div className="navbar-right">
            <Link href="/auth/login" className="btn-login">Masuk</Link>
            <Link href="/auth/register" className="btn-register">Daftar</Link>
          </div>
          <button 
            className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Menu"
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </header>

      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`} id="mobileMenu">
        <nav>
          <Link href="/public/tentang-ekosistem" onClick={closeMobileMenu}>Tentang</Link>
          <Link href="/public/learn-catholic" onClick={closeMobileMenu}>Belajar Katolik</Link>
          <Link href="/public/renungan-harian" onClick={closeMobileMenu}>Renungan Harian</Link>
          <Link href="/public/warta-paroki" onClick={closeMobileMenu}>Warta Paroki</Link>
          <Link href="/public/kegiatan" onClick={closeMobileMenu}>Kegiatan</Link>
          <Link href="/public/profil-paroki" onClick={closeMobileMenu}>Profil Paroki</Link>
          <Link href="/public/pasar-kasih" onClick={closeMobileMenu}>Pasar Kasih</Link>
        </nav>
        <div className="mobile-auth">
          <Link href="/auth/login" className="btn-login">Masuk</Link>
          <Link href="/auth/register" className="btn-register">Daftar</Link>
        </div>
      </div>
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={closeMobileMenu}></div>

      <main>{children}</main>

      <footer className="footer" role="contentinfo">
        <div className="footer-top-grid">
          <div className="footer-col footer-col-paroki">
            <div className="footer-logo">
              <SaintClemensIcon size={40} />
              <span>Paroki Santo Klemens</span>
            </div>
            <p>Gereja Santo Martinus</p>
            <p>Jl. Lanud Sepinggan, Balikpapan</p>
            <p>Kalimantan Timur 76115</p>
            <p className="mt-3 text-[0.72rem] text-[rgba(200,169,110,0.5)]">
              Keuskupan Agung Samarinda<br/>Mgr. Yustinus Harjosusanto, MSF
            </p>
          </div>
          <div className="footer-col footer-col-nav">
            <div className="nav-group">
              <h4>Navigasi Utama</h4>
              <ul>
                <li><Link href="/public">Beranda</Link></li>
                <li><Link href="/public/tentang-ekosistem">Tentang Ekosistem</Link></li>
                <li><Link href="/public/learn-catholic">Belajar Katolik</Link></li>
                <li><Link href="/public/renungan-harian">Renungan Harian</Link></li>
              </ul>
            </div>
            <div className="nav-group">
              <h4>Komunitas & Layanan</h4>
              <ul>
                <li><Link href="/public/pasar-kasih">Pasar Kasih</Link></li>
                <li><Link href="/public/warta-paroki">Warta Paroki</Link></li>
                <li><Link href="/public/kegiatan">Kegiatan Paroki</Link></li>
                <li><Link href="/public/profil-paroki">Profil Paroki</Link></li>
                <li><a href="https://keuskupanagungsamarinda.org" target="_blank" rel="noopener">Keuskupan Agung Samarinda</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-col footer-col-contact">
            <h4>Kontak & Jam Pelayanan</h4>
            <div className="contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              <span>(0542) 865-XXXX</span>
            </div>
            <div className="contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
              <span>sekretariat@santoklemens-bpp.or.id</span>
            </div>
            <div className="contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span>Sekretariat: Sen–Sab, 08:00–16:00<br/>Pendaftaran Sakramen: Sel & Kam</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom-bar">
          <span className="copyright-version">
            &copy; {new Date().getFullYear()} Paroki Santo Klemens Sepinggan. v5.0.0-alpha
          </span>
          <div className="legal-links">
            <a href="#">Kebijakan Privasi</a><span>&bull;</span><a href="#">Dilindungi UU PDP No. 27/2022</a>
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      <button
        className={`scroll-top-btn ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Kembali ke atas"
      >
        <ArrowUpIcon className="w-5 h-5 text-primary" />
      </button>
    </>
  );
}
