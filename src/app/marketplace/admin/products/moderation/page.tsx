'use client';
import Link from 'next/link';

export default function ProductModerationPage() {
  const productsToModerate = [
    { id: 4, name: 'Pakaian Batik Motif Katolik', seller: 'Umat St. Theresia', status: 'Pending Moderation' },
    { id: 5, name: 'Buku Rohani "Jalan Salib Modern"', seller: 'Umat St. Agustinus', status: 'Pending Moderation' },
  ];

  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header"><h2>Moderasi Produk Pasar Kasih</h2><a href="/marketplace/admin/dashboard">Kembali</a></div>
        <div className="admin-grid">
          {productsToModerate.map(product => (
            <div key={product.id} className="admin-card">
              <h3>{product.name}</h3>
              <p>Penjual: {product.seller}</p>
              <p>Status: {product.status}</p>
              <div className="marketplace-actions" style={{marginTop:'1rem', justifyContent:'flex-start', gap:'0.5rem'}}>
                <button className="btn-admin-primary" style={{padding:'0.5rem 1rem', fontSize:'0.7rem', background:'var(--marketplace-accent)', color:'var(--marketplace-primary)'}}>
                  Setujui
                </button>
                <button className="btn-admin-primary" style={{padding:'0.5rem 1rem', fontSize:'0.7rem', background:'#d4758a', color:'#fff'}}>
                  Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}