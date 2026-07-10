import React from 'react';

interface ProductCardProps {
  nama: string;
  kategori: string;
  lokasi: string;
  rating: number; // 0-5
  gambar: string; // URL to product image
  is_active: boolean;
  harga?: number; // Optional, for products with explicit price
  deskripsi_singkat?: string; // Short description
  is_verified?: boolean; // New: optional badge for verified businesses
}

const ProductCard: React.FC<ProductCardProps> = ({
  nama,
  kategori,
  lokasi,
  rating,
  gambar,
  is_active,
  harga,
  deskripsi_singkat,
  is_verified = false,
}) => {
  const renderStars = (num: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`h-4 w-4 ${i < num ? 'text-pk-accent' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-.755-1.018-.588-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
        </svg>
      );
    }
    return stars;
  };

  return (
    <div className={`pk-card flex flex-col h-full ${!is_active ? 'opacity-60 grayscale' : ''}`}>
      <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
        <img
          src={gambar}
          alt={nama}
          className="object-cover w-full h-full"
        />
        {is_verified && (
          <span className="pk-badge pk-badge-verified absolute top-2 left-2 flex items-center gap-1">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
            Verified
          </span>
        )}
        {!is_active && (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            Tidak Aktif
          </span>
        )}
      </div>
      <div className="flex-grow">
        <div className="flex items-center mb-2">
          <span className="pk-badge pk-badge-category">{kategori}</span>
          <div className="flex items-center ml-auto">
            {renderStars(rating)}
            <span className="ml-1 text-sm text-pk-text-muted">{rating.toFixed(1)}</span>
          </div>
        </div>
        <h3 className="text-xl font-bold text-pk-text mb-2">{nama}</h3>
        {deskripsi_singkat && (
          <p className="text-pk-text-muted text-sm mb-3">{deskripsi_singkat}</p>
        )}
        <p className="text-sm text-pk-text-muted flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9A1.998 1.998 0 0110 20.9l-4.243-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          {lokasi}
        </p>
      </div>
      {harga !== undefined && (
        <div className="mt-4 pt-4 border-t border-pk-border flex justify-between items-center">
          <span className="text-lg font-bold text-pk-primary">Rp{harga.toLocaleString('id-ID')}</span>
          <button className="pk-btn-primary px-4 py-2 text-sm">Lihat Detail</button>
        </div>
      )}
      {harga === undefined && (
        <div className="mt-4 pt-4 border-t border-pk-border">
          <button className="pk-btn-primary w-full text-sm">Lihat Detail</button>
        </div>
      )}
    </div>
  );
};

export default ProductCard;