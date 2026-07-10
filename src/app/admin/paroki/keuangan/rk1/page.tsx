'use client';
export default function KeuanganRK1Page() {
  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header"><h2>Laporan Keuangan RK1</h2><a href="/admin/paroki/dashboard">Kembali</a></div>
        <div className="admin-card">
          <h3>Rencana & Realisasi Keuangan 1</h3>
          <p>Tinjau dan kelola laporan keuangan RK1 Paroki Santo Klemens.</p>
          <button className="btn-admin-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M22 19V2H11a2 2 0 00-2 2v15z"/><path d="M2 18h11a2 2 0 012 2v2H2z"/></svg>
            Lihat Laporan
          </button>
        </div>
      </div>
    </div>
  );
}