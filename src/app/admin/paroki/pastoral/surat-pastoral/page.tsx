'use client';
export default function AdminSuratPastoralPage() {
  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header"><h2>Kelola Surat Pastoral</h2><a href="/admin/paroki/dashboard">Kembali</a></div>
        <div className="admin-grid">
          <div className="admin-card">
            <h3>Daftar Surat Pastoral</h3>
            <p>Buat surat baru, edit yang sudah ada, atau kirim notifikasi ke umat.</p>
            <button className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
              Lihat Surat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}