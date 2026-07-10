'use client';
import Link from 'next/link';

export default function MarketplaceAdminDashboardPage() {
  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header"><h2>Dashboard Admin Pasar Kasih</h2><Link href="/marketplace/admin/settings">Pengaturan</Link></div>
        <div className="admin-grid">
          <div className="admin-card">
            <h3>Moderasi Produk</h3>
            <p>Tinjau dan setujui produk baru atau kelola produk yang ditolak.</p>
            <Link href="/marketplace/admin/products/moderation" className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 2L2 7v15h20V7L12 2z"/><path d="M2 7l10 5 10-5M2 12l10 5 10-5M2 17l10 5 10-5"/></svg>
              Lihat Produk
            </Link>
          </div>
          <div className="admin-card">
            <h3>Manajemen Penjual</h3>
            <p>Kelola pendaftaran penjual, status akun, dan performa.</p>
            <Link href="/marketplace/admin/sellers" className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Kelola Penjual
            </Link>
          </div>
          <div className="admin-card">
            <h3>Manajemen Keuangan</h3>
            <p>Laporan keuangan marketplace, pembayaran ke penjual, dan audit.</p>
            <Link href="/marketplace/admin/finance" className="btn-admin-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M22 19V2H11a2 2 0 00-2 2v15z"/><path d="M2 18h11a2 2 0 012 2v2H2z"/></svg>
              Lihat Laporan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}