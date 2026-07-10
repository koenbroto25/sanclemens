'use client';
import Link from 'next/link';
import { useState } from 'react';
import '../../styles/admin.css'; // Reusing admin.css for now

export default function SuperAdminLayout({
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
          <Link href="/super-admin/dashboard" className="navbar-logo" aria-label="Super Admin Paroki Santo Klemens">
            <span className="logo-icon">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="15" y="4" width="6" height="28" rx="1" fill="#c8a96e"/>
                <rect x="8" y="11" width="20" height="5" rx="1" fill="#c8a96e"/>
                <circle cx="18" cy="9" r="2.5" fill="#c8a96e" opacity="0.6"/>
              </svg>
            </span>
            <span className="logo-text">
              <span className="logo-name">Super Admin</span>
              <span className="logo-sub">Sistem Pusat</span>
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
                <span className="user-name">Root Admin</span>
                <span className="user-role">Super Admin (Layer 10)</span>
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
            <div className="section-title">Super Admin Controls</div>
            <Link href="/super-admin/dashboard" className="nav-item">Dashboard Sistem</Link>
            <Link href="/super-admin/roles" className="nav-item">Manajemen Role</Link>
            <Link href="/super-admin/notifications/templates" className="nav-item">Template Notifikasi</Link>
            <Link href="/super-admin/settings" className="nav-item">Pengaturan Umum</Link>
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