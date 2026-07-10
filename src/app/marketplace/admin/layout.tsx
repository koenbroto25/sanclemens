'use client';
import Link from 'next/link';
import { useState } from 'react';
import '../../../styles/admin.css'; // Reusing admin.css for styling

export default function MarketplaceAdminLayout({
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
          <Link href="/marketplace/admin/dashboard" className="navbar-logo" aria-label="Admin Pasar Kasih">
            <span className="logo-icon">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9H30V27H6V9Z" fill="#e8c44a" stroke="#0a470a" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M12 9V6H24V9" stroke="#0a470a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="15" cy="18" r="2" fill="#0a470a"/>
                <circle cx="21" cy="18" r="2" fill="#0a470a"/>
              </svg>
            </span>
            <span className="logo-text">
              <span className="logo-name" style={{color:'var(--marketplace-accent)'}}>Admin Pasar Kasih</span>
              <span className="logo-sub" style={{color:'var(--color-stone)'}}>Moderasi & Keuangan</span>
            </span>
          </Link>
          <div className="navbar-right">
            <div className="user-profile" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <div className="avatar" style={{background:'var(--marketplace-accent)'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{color:'var(--marketplace-primary)'}}>
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className="user-info">
                <span className="user-name" style={{color:'var(--marketplace-text-light)'}}>Manager Pasar</span>
                <span className="user-role" style={{color:'var(--color-stone)'}}>Manager (Layer 6)</span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chevron" style={{color:'var(--marketplace-accent)'}}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>
        </div>
      </header>

      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="adminSidebar" style={{background:'var(--marketplace-primary)', borderRight:'1px solid rgba(232, 196, 74, 0.15)'}}>
        <nav>
          <div className="sidebar-section">
            <div className="section-title" style={{color:'var(--marketplace-accent)', opacity:0.6}}>Marketplace Admin</div>
            <Link href="/marketplace/admin/dashboard" className="nav-item" style={{color:'var(--marketplace-text-light)'}}>Dashboard Admin</Link>
            <Link href="/marketplace/admin/products/moderation" className="nav-item" style={{color:'var(--marketplace-text-light)'}}>Moderasi Produk</Link>
            <Link href="/marketplace/admin/orders" className="nav-item" style={{color:'var(--marketplace-text-light)'}}>Manajemen Pesanan</Link>
            <Link href="/marketplace/admin/sellers" className="nav-item" style={{color:'var(--marketplace-text-light)'}}>Manajemen Penjual</Link>
            <Link href="/marketplace/admin/finance" className="nav-item" style={{color:'var(--marketplace-text-light)'}}>Keuangan Marketplace</Link>
          </div>
          <div className="sidebar-footer" style={{borderTop:'1px solid rgba(232, 196, 74, 0.1)'}}>
            <Link href="/auth/logout" className="btn-logout" style={{color:'#d4758a'}}>
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