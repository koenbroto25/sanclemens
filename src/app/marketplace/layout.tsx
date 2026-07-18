'use client';
import Link from 'next/link';
import { useState } from 'react';
import '../../styles/marketplace.css';

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <>
      <header className="navbar marketplace-navbar" id="navbar" role="banner">
        <div className="navbar-inner">
          <Link href="/marketplace" className="navbar-logo" aria-label="Pasar Kasih">
            <span className="logo-icon">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9H30V27H6V9Z" fill="#c8a96e" stroke="#1a0e05" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M12 9V6H24V9" stroke="#1a0e05" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="15" cy="18" r="2" fill="#1a0e05"/>
                <circle cx="21" cy="18" r="2" fill="#1a0e05"/>
              </svg>
            </span>
            <span className="logo-text">
              <span className="logo-name">Pasar Kasih</span>
              <span className="logo-sub">Ekonomi Kreatif Umat</span>
            </span>
          </Link>
          <div className="marketplace-top-actions">
            <Link href="/user/dashboard" className="marketplace-back-link" title="Kembali ke Dashboard Umat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span>Dashboard</span>
            </Link>
          </div>
          <nav className="navbar-nav" aria-label="Navigasi marketplace">
            <Link href="/marketplace" className="nav-item active">Beranda</Link>
            <Link href="/marketplace/seller/dashboard" className="nav-item">Jual Produk</Link>
            <Link href="/marketplace/ojek-solidaritas/dashboard" className="nav-item">Jadi Ojek</Link>
            <Link href="/marketplace/admin/dashboard" className="nav-item">Admin</Link>
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
                <span className="user-name">Pembeli Aktif</span>
                <span className="user-role">Buyer (Layer 2)</span>
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
          <Link href="/marketplace" onClick={() => setMobileMenuOpen(false)}>Beranda</Link>
          <Link href="/marketplace/seller/dashboard" onClick={() => setMobileMenuOpen(false)}>Jual Produk</Link>
          <Link href="/marketplace/ojek-solidaritas/dashboard" onClick={() => setMobileMenuOpen(false)}>Jadi Ojek</Link>
          <Link href="/marketplace/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>Admin</Link>
        </nav>
      </div>
      <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      <main className="marketplace-content">{children}</main>

      <footer className="footer marketplace-footer" role="contentinfo">
        <div className="footer-inner">
          <div className="footer-col">
            <div className="footer-logo">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9H30V27H6V9Z" fill="#c8a96e" stroke="#1a0e05" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M12 9V6H24V9" stroke="#1a0e05" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="15" cy="18" r="2" fill="#1a0e05"/>
                <circle cx="21" cy="18" r="2" fill="#1a0e05"/>
              </svg>
              <span>Pasar Kasih</span>
            </div>
            <p>Platform ekonomi kreatif umat Paroki Santo Klemens.</p>
            <p>Jalan Ekonomi Kreatif No. 1, Balikpapan</p>
            <p>Kalimantan Timur 76115</p>
          </div>
          <div className="footer-col">
            <h4>Navigasi</h4>
            <ul>
              <li><Link href="/marketplace">Beranda</Link></li>
              <li><Link href="/marketplace/seller/dashboard">Jual Produk</Link></li>
              <li><Link href="/marketplace/ojek-solidaritas/dashboard">Jadi Ojek</Link></li>
              <li><Link href="/marketplace/admin/dashboard">Admin</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Tentang Kami</h4>
            <ul>
              <li><Link href="/marketplace/about">Visi & Misi</Link></li>
              <li><Link href="/marketplace/terms">Syarat & Ketentuan</Link></li>
              <li><Link href="/marketplace/privacy">Kebijakan Privasi</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="copyright">&copy; 2026 Pasar Kasih. Hak cipta dilindungi.</span>
          <span className="version">v5.0.0-alpha</span>
        </div>
      </footer>
    </>
  );
}