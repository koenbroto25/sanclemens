'use client';
import Link from 'next/link';

export default function SellerDashboardPage() {
  return (
    <div className="marketplace-container">
      <div className="marketplace-section">
        <div className="section-header"><h2>Dashboard Penjual</h2><Link href="/marketplace/seller/products">Kelola Produk</Link></div>
        <div className="products-grid">
          <div className="product-card">
            <h3 className="product-title">Produk Saya</h3>
            <p className="product-seller">Total: 5 produk aktif</p>
            <Link href="/marketplace/seller/products" className="btn-marketplace-primary" style={{marginTop:'1rem'}}>
              Lihat Produk
            </Link>
          </div>
          <div className="product-card">
            <h3 className="product-title">Pesanan Baru</h3>
            <p className="product-seller">Jumlah: 2 pesanan menunggu proses</p>
            <Link href="/marketplace/seller/orders" className="btn-marketplace-primary" style={{marginTop:'1rem'}}>
              Proses Pesanan
            </Link>
          </div>
          <div className="product-card">
            <h3 className="product-title">Total Penjualan</h3>
            <p className="product-seller">Rp 1.250.000</p>
            <Link href="/marketplace/seller/reports" className="btn-marketplace-primary" style={{marginTop:'1rem'}}>
              Lihat Laporan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}