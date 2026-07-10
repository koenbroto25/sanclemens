'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import '../../styles/user.css';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <>
      <header className="navbar user-navbar" id="navbar" role="banner">
        <div className="navbar-inner">
          <Link href="/dashboard" className="navbar-logo" aria-label="Paroki Santo Klemens Sepinggan">
            <span className="logo-icon">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="15" y="4" width="6" height="28" rx="1" fill="#c8a96e"/>
                <rect x="8" y="11" width="20" height="5" rx="1" fill="#c8a96e"/>
                <circle cx="18" cy="9" r="2.5" fill="#c8a96e" opacity="0.6"/>
              </svg>
            </span>
            <span className="logo-text">
              <span className="logo-name">Santo Klemens</span>
              <span className="logo-sub">Sepinggan</span>
            </span>
          </Link>
          <nav className="navbar-nav" aria-label="Navigasi utama">
            <Link href="/dashboard" className="nav-item active">Dashboard</Link>
            <Link href="/family" className="nav-item">Keluarga</Link>
            <Link href="/pastoral-letters" className="nav-item">Surat Pastoral</Link>
            <Link href="/whistleblower" className="nav-item">Whistleblower</Link>
            <Link href="/data-gakin" className="nav-item">GAKIN</Link>
            <Link href="/klemen-kerja" className="nav-item">Klemen Kerja</Link>
            <Link href="/lingkungan" className="nav-item">Lingkungan</Link>
            <Link href="/settings" className="nav-item">Pengaturan</Link>
          </nav>
          <div className="navbar-right">
            <button 
              className="hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              <span></span><span></span><span></span>
            </button>
            <div className="user-profile" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <div className="avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className="user-info">
                <span className="user-name">Budi Santoso</span>
                <span className="user-role">Umat Aktif (Layer 2)</span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chevron">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>
        </div>
      </header>

      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`} id="mobileMenu">
        <nav>
          <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
          <Link href="/family" onClick={() => setMobileMenuOpen(false)}>Keluarga</Link>
          <Link href="/pastoral-letters" onClick={() => setMobileMenuOpen(false)}>Surat Pastoral</Link>
          <Link href="/whistleblower" onClick={() => setMobileMenuOpen(false)}>Whistleblower</Link>
          <Link href="/data-gakin" onClick={() => setMobileMenuOpen(false)}>GAKIN</Link>
          <Link href="/klemen-kerja" onClick={() => setMobileMenuOpen(false)}>Klemen Kerja</Link>
          <Link href="/lingkungan" onClick={() => setMobileMenuOpen(false)}>Lingkungan</Link>
          <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>Pengaturan</Link>
        </nav>
      </div>
      <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      <main>{children}</main>

      <footer className="footer" role="contentinfo">
        <div className="footer-inner">
          <div className="footer-col">
            <div className="footer-logo">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="15" y="4" width="6" height="28" rx="1" fill="#c8a96e"/>
                <rect x="8" y="11" width="20" height="5" rx="1" fill="#c8a96e"/>
                <circle cx="18" cy="9" r="2.5" fill="#c8a96e" opacity="0.6"/>
              </svg>
              <span>Paroki Santo Klemens</span>
            </div>
            <p>Gereja Santo Martinus</p>
            <p>Jl. Lanud Sepinggan, Balikpapan</p>
            <p>Kalimantan Timur 76115</p>
          </div>
          <div className="footer-col">
            <h4>Navigasi</h4>
            <ul>
              <li><Link href="/dashboard">Dashboard</Link></li>
              <li><Link href="/family">Keluarga</Link></li>
              <li><Link href="/pastoral-letters">Surat Pastoral</Link></li>
              <li><Link href="/whistleblower">Whistleblower</Link></li>
              <li><Link href="/data-gakin">GAKIN</Link></li>
              <li><Link href="/klemen-kerja">Klemen Kerja</Link></li>
              <li><Link href="/lingkungan">Lingkungan</Link></li>
              <li><Link href="/settings">Pengaturan</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Akses Cepat</h4>
            <div className="quick-access">
              <Link href="/pastoral-letters" className="quick-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
                <span>Surat Pastoral</span>
              </Link>
              <Link href="/whistleblower" className="quick-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Whistleblower</span>
              </Link>
              <Link href="/klemen-kerja" className="quick-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7v15h20V7L12 2z"/><path d="M2 7l10 5 10-5M2 12l10 5 10-5M2 17l10 5 10-5"/></svg>
                <span>Klemen Kerja</span>
              </Link>
              <Link href="/data-gakin" className="quick-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3h18v18H3V3z"/><path d="M3 9h18M3 15h18"/></svg>
                <span>GAKIN</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="copyright">&copy; 2026 Paroki Santo Klemens Sepinggan. Hak cipta dilindungi.</span>
          <span className="version">v5.0.0-alpha</span>
        </div>
      </footer>
    </>
  );
}