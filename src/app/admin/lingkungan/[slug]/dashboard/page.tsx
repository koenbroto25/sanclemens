'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function LingkunganDashboardPage() {
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
        <div className="section-header"><h2>Dashboard {getLingkunganName(slug)}</h2><Link href={`/admin/lingkungan/${slug}/settings`}>Pengaturan</Link></div>
        <div className="admin-grid">
          <div className="admin-card">
            <h3>Verifikasi Umat Baru</h3>
            <p>Tinjau dan verifikasi pendaftaran umat baru di lingkungan Anda.</p>
            <Link href={`/admin/lingkungan/${slug}/users/verification`} className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Verifikasi Umat
            </Link>
          </div>
          <div className="admin-card">
            <h3>Dana Duka Lokal</h3>
            <p>Kelola dana duka khusus untuk umat di lingkungan {getLingkunganName(slug)}.</p>
            <Link href={`/admin/lingkungan/${slug}/dana-duka`} className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Kelola Dana
            </Link>
          </div>
          <div className="admin-card">
            <h3>Manajemen WDL Proxy</h3>
            <p>Kelola akses WDL Proxy untuk umat di lingkungan Anda.</p>
            <Link href={`/admin/lingkungan/${slug}/wdl`} className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              Manajemen Proxy
            </Link>
          </div>
          <div className="admin-card">
            <h3>Pendaftaran Umat Baru</h3>
            <p>Daftarkan umat baru di lingkungan {getLingkunganName(slug)} dengan OCR scan atau manual input.</p>
            <Link href={`/admin/lingkungan/${slug}/pendaftaran-umat`} className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Daftar Umat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}