'use client';
export default function DataCompletionPage() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-section">
        <div className="section-header"><h2>Lengkapi Data Profil</h2><a href="/dashboard">Kembali</a></div>
        <div className="dashboard-card">
          <h3>Data Anda Belum Lengkap</h3>
          <p>Mohon lengkapi data profil Anda untuk mendapatkan akses penuh ke semua fitur dan layanan paroki.</p>
          <div className="card-footer"><span>Profile</span><span className="status-pill warning">Wajib</span></div>
        </div>
      </div>
    </div>
  );
}