'use client';
export default function SakramenRegisterPage() {
  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header"><h2>Daftar Pendaftaran Sakramen</h2><a href="/admin/paroki/dashboard">Kembali</a></div>
        <div className="admin-grid">
          <div className="admin-card">
            <h3>Pendaftaran Sakramen Baptis</h3>
            <p>Tinjau dan proses pendaftaran sakramen baptis.</p>
            <button className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 2L2 7v15h20V7L12 2z"/><path d="M2 7l10 5 10-5M2 12l10 5 10-5M2 17l10 5 10-5"/></svg>
              Lihat Daftar
            </button>
          </div>
          <div className="admin-card">
            <h3>Pendaftaran Sakramen Krisma</h3>
            <p>Tinjau dan proses pendaftaran sakramen krisma.</p>
            <button className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 2L2 7v15h20V7L12 2z"/><path d="M2 7l10 5 10-5M2 12l10 5 10-5M2 17l10 5 10-5"/></svg>
              Lihat Daftar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}