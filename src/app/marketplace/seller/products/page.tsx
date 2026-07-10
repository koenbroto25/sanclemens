'use client';
import Link from 'next/link';

export default function SellerProductsPage() {
  const products = [
    { id: 1, name: 'Kerajinan Tangan Salib Kayu', price: 'Rp 75.000', stock: 10, status: 'Active' },
    { id: 2, name: 'Makanan Ringan Khas Lokal', price: 'Rp 25.000', stock: 50, status: 'Active' },
    { id: 3, name: 'Jasa Desain Grafis', price: 'Mulai Rp 150.000', stock: 'N/A', status: 'Active' },
    { id: 4, name: 'Pakaian Batik Motif Katolik', price: 'Rp 200.000', stock: 5, status: 'Pending Moderation' },
  ];

  return (
    <div className="marketplace-container">
      <div className="marketplace-section">
        <div className="section-header"><h2>Produk Saya</h2><Link href="/marketplace/seller/products/add">Tambah Produk Baru</Link></div>
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <h3 className="product-title">{product.name}</h3>
              <p className="product-price">{product.price}</p>
              <p className="product-seller">Stok: {product.stock}</p>
              <p className="product-seller">Status: {product.status}</p>
              <div className="marketplace-actions" style={{marginTop:'1rem', justifyContent:'flex-start', gap:'0.5rem'}}>
                <Link href={`/marketplace/seller/products/${product.id}/edit`} className="btn-marketplace-primary" style={{padding:'0.5rem 1rem', fontSize:'0.7rem'}}>
                  Edit
                </Link>
                <button className="btn-marketplace-secondary" style={{padding:'0.5rem 1rem', fontSize:'0.7rem'}}>
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}