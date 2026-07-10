'use client';
import Link from 'next/link';
import KurasiRenunganPanel from '@/components/admin/KurasiRenunganPanel';

export default function SuperAdminDashboardPage() {
  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header"><h2>Dashboard Super Admin</h2><Link href="/super-admin/settings">Pengaturan Sistem</Link></div>
        <div className="admin-grid">
          <KurasiRenunganPanel mode="super_admin" /> {/* Integrated Renungan Curation Panel (Read-only) */}
          <div className="admin-card">
            <h3>Monitoring Sistem</h3>
            <p>Pantau kesehatan sistem, status server, dan kinerja database.</p>
            <button className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2H8a2 2 0 00-2 2v16"/></svg>
              Lihat Laporan
            </button>
          </div>
          <div className="admin-card">
            <h3>Manajemen Data Global</h3>
            <p>Kelola data dan konfigurasi aplikasi yang bersifat global.</p>
            <button className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              Kelola Data
            </button>
          </div>
          <div className="admin-card">
            <h3>Pengaturan AI & Bot</h3>
            <p>Konfigurasi prompt, update Bot Law, dan kerangka kerja sumber teologis.</p>
            <Link href="/super-admin/settings" className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Pengaturan AI
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
