'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import '../../../styles/admin.css';

export default function LingkunganAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const params = useParams();
  const slug = params?.slug || 'ar'; // Default to St. Andreas Rasul

  const getLingkunganName = (s: string | string[]) => {
    switch (s) {
      case 'ar': return 'St. Andreas Rasul';
      case 'fa': return 'St. Fransiskus Asisi';
      case 'mrr': return 'St. Maria Ratu Rosari';
      case 'al': return 'St. Albertus';
      case 'msr': return 'St. Maria Salve Regina';
      case 'an': return 'St. Anna';
      case 'cl': return 'St. Clara';
      case 'mn': return 'St. Monica';
      case 'tdl': return 'St. Theresia dari Lisieux';
      case 'tda': return 'St. Theresia dari Avila';
      case 'gb': return 'St. Gabriel';
      case 'mls': return 'St. Maria La Salette';
      case 'mi': return 'St. Maria Immaculata';
      case 'lp': return 'St. Lukas Penginjil';
      case 'yp': return 'St. Yosef Pekerja';
      case 'sy': return 'Stasi St. Yosef';
      case 'rr': return 'Stasi Ratu Rosari';
      default: return 'Lingkungan/Stasi';
    }
  }

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
          <Link href={`/admin/lingkungan/${slug}/dashboard`} className="navbar-logo" aria-label="Admin Lingkungan">
            <span className="logo-icon">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="15" y="4" width="6" height="28" rx="1" fill="#c8a96e"/>
                <rect x="8" y="11" width="20" height="5" rx="1" fill="#c8a96e"/>
                <circle cx="18" cy="9" r="2.5" fill="#c8a96e" opacity="0.6"/>
              </svg>
            </span>
            <span className="logo-text">
              <span className="logo-name">Admin Lingkungan</span>
              <span className="logo-sub">{getLingkunganName(slug)}</span>
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
                <span className="user-name">Ketua Lingkungan</span>
                <span className="user-role">{getLingkunganName(slug)} (Layer 4)</span>
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
            <div className="section-title">Lingkungan {getLingkunganName(slug)}</div>
            <Link href={`/admin/lingkungan/${slug}/dashboard`} className="nav-item">Dashboard Lingkungan</Link>
            <Link href={`/admin/lingkungan/${slug}/users/verification`} className="nav-item">Verifikasi Umat</Link>
            <Link href={`/admin/lingkungan/${slug}/dana-duka`} className="nav-item">Dana Duka Lokal</Link>
            <Link href={`/admin/lingkungan/${slug}/wdl`} className="nav-item">Manajemen WDL Proxy</Link>
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