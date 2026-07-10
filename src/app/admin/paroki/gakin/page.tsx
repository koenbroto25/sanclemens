'use client';
export default function AdminGakinPage() {
  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header"><h2>Manajemen Data GAKIN</h2><a href="/admin/paroki/dashboard">Kembali</a></div>
        <div className="admin-grid">
          <div className="admin-card">
            <h3>Daftar Warga Kurang Mampu</h3>
            <p>Kelola data warga kurang mampu, verifikasi, dan pantau status bantuan.</p>
            <button className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M3 3h18v18H3V3z"/><path d="M3 9h18M3 15h18"/></svg>
              Lihat Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}