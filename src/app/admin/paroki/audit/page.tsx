'use client';
export default function AuditPage() {
  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header"><h2>Audit Keuangan</h2><a href="/admin/paroki/dashboard">Kembali</a></div>
        <div className="admin-card">
          <h3>Laporan Audit Tahunan</h3>
          <p>Tinjau laporan audit keuangan tahunan dan bulanan paroki.</p>
          <button className="btn-admin-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 2L2 7v15h20V7L12 2z"/><path d="M2 7l10 5 10-5M2 12l10 5 10-5M2 17l10 5 10-5"/></svg>
            Lihat Laporan
          </button>
        </div>
      </div>
    </div>
  );
}