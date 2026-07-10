'use client';
export default function LansiaMorningCheckPage() {
  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header"><h2>Morning Check Lansia</h2><a href="/admin/pastor/dashboard">Kembali</a></div>
        <div className="admin-card">
          <h3>Daftar Lansia untuk Morning Check</h3>
          <p>Pantau status kesehatan dan kebutuhan lansia di paroki setiap pagi melalui notifikasi otomatis.</p>
          <button className="btn-admin-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Lihat Status
          </button>
        </div>
      </div>
    </div>
  );
}