'use client';
import { useParams } from 'next/navigation';

export default function LingkunganUserVerificationPage() {
  const params = useParams();
  const slug = params?.slug || 'ar'; // Default to St. Andreas Rasul

  const getLingkunganName = (s: string | string[]) => {
    switch (s) {
      case 'ar': return 'St. Andreas Rasul';
      case 'fa': return 'St. Fransiskus Asisi';
      case 'mrr': return 'St. Maria Ratu Rosari';
      case 'al': return 'St. Albertus';
      case 'msr': return 'St. Maria Salve Regina';
      case 'an': return 'St. Anna';
      case 'cl': return 'St. Clara';
      case 'mn': return 'St. Monica';
      case 'tdl': return 'St. Theresia dari Lisieux';
      case 'tda': return 'St. Theresia dari Avila';
      case 'gb': return 'St. Gabriel';
      case 'mls': return 'St. Maria La Salette';
      case 'mi': return 'St. Maria Immaculata';
      case 'lp': return 'St. Lukas Penginjil';
      case 'yp': return 'St. Yosef Pekerja';
      case 'sy': return 'Stasi St. Yosef';
      case 'rr': return 'Stasi Ratu Rosari';
      default: return 'Lingkungan/Stasi';
    }
  }
  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header"><h2>Verifikasi Umat Lingkungan {getLingkunganName(slug)}</h2><a href={`/admin/lingkungan/${slug}/dashboard`}>Kembali</a></div>
        <div className="admin-card">
          <h3>Daftar Umat Menunggu Verifikasi</h3>
          <p>Tinjau dan verifikasi pendaftaran umat baru di lingkungan {getLingkunganName(slug)}.</p>
          <button className="btn-admin-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Lihat Daftar
          </button>
        </div>
      </div>
    </div>
  );
}