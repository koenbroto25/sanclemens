'use client';
import Link from 'next/link';
import { useState } from 'react';

interface Product {
  id: number;
  name: string;
  price: string;
  stock: number;
  status: string;
  images?: string[];
}

export default function SellerProductsPage() {
  const [products] = useState<Product[]>([
    { id: 1, name: 'Kerajinan Tangan Salib Kayu', price: 'Rp 75.000', stock: 10, status: 'Active', images: [] },
    { id: 2, name: 'Makanan Ringan Khas Lokal', price: 'Rp 25.000', stock: 50, status: 'Active', images: [] },
    { id: 3, name: 'Jasa Desain Grafis', price: 'Mulai Rp 150.000', stock: 0, status: 'Active', images: [] },
    { id: 4, name: 'Pakaian Batik Motif Katolik', price: 'Rp 200.000', stock: 5, status: 'Pending Moderation', images: [] },
  ]);

  return (
    <div className="marketplace-container">
      <div className="marketplace-section">
        <div className="section-header">
          <h2>Produk Saya</h2>
          <Link href="/marketplace/seller/products/add">Tambah Produk Baru</Link>
        </div>
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-images">
                {product.images && product.images.length > 0 ? (
                  product.images.map((img, idx) => (
                    <img key={idx} src={img} alt={`${product.name} - ${idx + 1}`} className="product-image" />
                  ))
                ) : (
                  <div className="no-image">Tidak ada foto</div>
                )}
              </div>
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