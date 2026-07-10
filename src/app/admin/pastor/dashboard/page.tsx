'use client';
import Link from 'next/link';
import KurasiRenunganPanel from '@/components/admin/KurasiRenunganPanel';

export default function PastorDashboardPage() {
  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header"><h2>Dashboard Pastor & Vikaris</h2><Link href="/admin/paroki/settings">Pengaturan</Link></div>
        <div className="admin-grid">
          <KurasiRenunganPanel mode="pastor" /> {/* Integrated Renungan Curation Panel */}
          <div className="admin-card">
            <h3>Surat Pastoral</h3>
            <p>Buat, kirim, dan arsipkan surat pastoral kepada seluruh umat.</p>
            <Link href="/admin/paroki/pastoral/surat-pastoral" className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
              Kelola Surat
            </Link>
          </div>
          <div className="admin-card">
            <h3>Morning Check Lansia</h3>
            <p>Pantau status kesehatan dan kebutuhan lansia setiap pagi.</p>
            <Link href="/admin/paroki/pastoral/lansia/morning-check" className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Lihat Status
            </Link>
          </div>
          <div className="admin-card">
            <h3>Pendaftaran Sakramen</h3>
            <p>Tinjau dan proses pendaftaran sakramen dari umat.</p>
            <Link href="/admin/paroki/pastoral/sakramen/register" className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 2L2 7v15h20V7L12 2z"/><path d="M2 7l10 5 10-5M2 12l10 5 10-5M2 17l10 5 10-5"/></svg>
              Lihat Daftar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
