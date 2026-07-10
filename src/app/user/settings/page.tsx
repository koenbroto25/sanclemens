'use client';
export default function SettingsPage() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-section">
        <div className="section-header"><h2>Pengaturan</h2><a href="/dashboard">Kembali</a></div>
        <div className="dashboard-card">
          <h3>Pengaturan Akun</h3>
          <p>Kelola profil, password, dan preferensi notifikasi Anda.</p>
          <div className="card-footer"><span>Account</span><span className="status-pill active">Layer 2</span></div>
        </div>
      </div>
    </div>
  );
}