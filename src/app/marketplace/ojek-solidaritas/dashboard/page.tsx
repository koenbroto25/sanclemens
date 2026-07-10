'use client';
import Link from 'next/link';

export default function OjekDashboardPage() {
  return (
    <div className="marketplace-container">
      <div className="marketplace-section">
        <div className="section-header"><h2>Dashboard Ojek Solidaritas</h2><Link href="/marketplace/ojek-solidaritas/profile">Pengaturan</Link></div>
        <div className="products-grid">
          <div className="product-card">
            <h3 className="product-title">Pesanan Aktif</h3>
            <p className="product-seller">Jumlah: 1 pesanan dalam pengantaran</p>
            <Link href="/marketplace/ojek-solidaritas/orders" className="btn-marketplace-primary" style={{marginTop:'1rem'}}>
              Lihat Pesanan
            </Link>
          </div>
          <div className="product-card">
            <h3 className="product-title">Riwayat Pengantaran</h3>
            <p className="product-seller">Total: 12 pengantaran selesai</p>
            <Link href="/marketplace/ojek-solidaritas/history" className="btn-marketplace-primary" style={{marginTop:'1rem'}}>
              Lihat Riwayat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}