'use client';
export default function DataGakinPage() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-section">
        <div className="section-header"><h2>Data GAKIN</h2><a href="/dashboard">Kembali</a></div>
        <div className="dashboard-card">
          <h3>Status Bantuan</h3>
          <p>Belum ada permohonan bantuan yang diajukan.</p>
          <div className="card-footer"><span>GAKIN</span><span className="status-pill pending">Belum Ada</span></div>
        </div>
      </div>
    </div>
  );
}