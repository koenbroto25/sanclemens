'use client';
import { useParams } from 'next/navigation';

export default function LingkunganPage() {
  const params = useParams();
  const slug = params?.slug || 'AR';

  return (
    <div className="dashboard-container">
      <div className="dashboard-section">
        <div className="section-header"><h2>Lingkungan {slug}</h2><a href="/dashboard">Kembali</a></div>
        <div className="dashboard-card">
          <h3>Dashboard Lingkungan</h3>
          <p>Kelola data umat, kegiatan, dan informasi lingkungan Anda di sini.</p>
          <div className="card-footer"><span>Layer 2+</span><span className="status-pill active">Aktif</span></div>
        </div>
      </div>
    </div>
  );
}