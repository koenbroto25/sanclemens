'use client';
import Link from 'next/link';
import { useState } from 'react';
import '../../styles/admin.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <>
      <header className="navbar admin-navbar" id="navbar" role="banner">
        <div className="navbar-inner">
          <button 
            className="hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <span></span><span></span><span></span>
          </button>
          <Link href="/admin/paroki/dashboard" className="navbar-logo" aria-label="Admin Paroki Santo Klemens">
            <span className="logo-icon">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="15" y="4" width="6" height="28" rx="1" fill="#c8a96e"/>
                <rect x="8" y="11" width="20" height="5" rx="1" fill="#c8a96e"/>
                <circle cx="18" cy="9" r="2.5" fill="#c8a96e" opacity="0.6"/>
              </svg>
            </span>
            <span className="logo-text">
              <span className="logo-name">Admin Clemens</span>
              <span className="logo-sub">Paroki Sepinggan</span>
            </span>
          </Link>
          <div className="navbar-right">
            <div className="user-profile" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <div className="avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className="user-info">
                <span className="user-name">Admin DPP</span>
                <span className="user-role">Pastor Paroki (Layer 9)</span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chevron">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>
        </div>
      </header>

      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="adminSidebar">
        <nav>
          <div className="sidebar-section">
            <div className="section-title">Paroki & DPP</div>
            <Link href="/admin/paroki/dashboard" className="nav-item">Dashboard Paroki</Link>
            <Link href="/admin/paroki/users/activate" className="nav-item">Aktivasi User</Link>
            <Link href="/admin/paroki/pastoral/sakramen/register" className="nav-item">Daftar Sakramen</Link>
            <Link href="/admin/paroki/pastoral/surat-pastoral" className="nav-item">Surat Pastoral</Link>
            <Link href="/admin/paroki/warta-paroki" className="nav-item">Manajemen Warta</Link>
            <Link href="/admin/paroki/kegiatan" className="nav-item">Manajemen Kegiatan</Link>
            <Link href="/admin/paroki/jadwal-misa" className="nav-item">Manajemen Jadwal Misa</Link>
            <Link href="/admin/paroki/gakin" className="nav-item">Manajemen GAKIN</Link>
            <Link href="/admin/paroki/dana-kasih" className="nav-item">Dana Kasih Escrow</Link>
            <Link href="/admin/paroki/dana-duka" className="nav-item">Dana Duka</Link>
            <Link href="/admin/paroki/keuangan/rk1" className="nav-item">Keuangan RK1</Link>
            <Link href="/admin/paroki/keuangan/rk2" className="nav-item">Keuangan RK2</Link>
            <Link href="/admin/paroki/keuangan/rk3" className="nav-item">Keuangan RK3</Link>
            <Link href="/admin/paroki/keuangan/kolekte/input" className="nav-item">Input Kolekte</Link>
            <Link href="/admin/paroki/audit" className="nav-item">Audit Keuangan</Link>
            <Link href="/admin/paroki/ads" className="nav-item">Manajemen Iklan</Link>
          </div>
          <div className="sidebar-section">
            <div className="section-title">Lingkungan & Stasi</div>
            <Link href="/admin/lingkungan/ar/dashboard" className="nav-item">Lingkungan St. Andreas</Link>
            <Link href="/admin/lingkungan/fa/dashboard" className="nav-item">Lingkungan St. Fransiskus</Link>
          </div>
          <div className="sidebar-section">
            <div className="section-title">Pastor</div>
            <Link href="/admin/pastor/dashboard" className="nav-item">Dashboard Pastor</Link>
            <Link href="/admin/pastor/dashboard?tab=kurasi" className="nav-item">Kurasi Renungan</Link>  {/* Link to Kurasi Renungan */}
            <Link href="/admin/paroki/pastoral/lansia/morning-check" className="nav-item">Morning Check Lansia</Link>
          </div>
          <div className="sidebar-section">
            <div className="section-title">Marketplace</div>
            <Link href="/marketplace/admin/dashboard" className="nav-item">Admin Marketplace</Link>
            <Link href="/marketplace/admin/products/moderation" className="nav-item">Moderasi Produk</Link>
          </div>
          <div className="sidebar-section">
            <div className="section-title">Super Admin</div>
            <Link href="/super-admin/dashboard" className="nav-item">Dashboard Super Admin</Link>
            <Link href="/super-admin/settings" className="nav-item">Pengaturan Sistem</Link>
          </div>
          <div className="sidebar-footer">
            <Link href="/auth/logout" className="btn-logout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </Link>
          </div>
        </nav>
      </div>
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      <main className={`admin-content ${sidebarOpen ? 'sidebar-open' : ''}`}>{children}</main>
    </>
  );
}