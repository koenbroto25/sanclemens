'use client';
export default function AdminAdsPage() {
  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header"><h2>Manajemen Iklan Non-Marketplace</h2><a href="/admin/paroki/dashboard">Kembali</a></div>
        <div className="admin-grid">
          <div className="admin-card">
            <h3>Daftar Iklan</h3>
            <p>Kelola iklan yang tampil di halaman publik dan dashboard umat (non-marketplace).</p>
            <button className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M5 3h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2z"/><path d="M16 8H8M16 12H8M12 16H8"/></svg>
              Kelola Iklan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}