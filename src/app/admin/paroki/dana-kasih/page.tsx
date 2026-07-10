'use client';
export default function AdminDanaKasihPage() {
  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header"><h2>Manajemen Dana Kasih Escrow</h2><a href="/admin/paroki/dashboard">Kembali</a></div>
        <div className="admin-grid">
          <div className="admin-card">
            <h3>Daftar Pengajuan Dana Kasih</h3>
            <p>Tinjau dan proses pengajuan dana kasih dari umat.</p>
            <button className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Lihat Pengajuan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}