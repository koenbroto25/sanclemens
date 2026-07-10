import React from 'react';
import ProductCard from './ProductCard';
import JobCard from './JobCard';

// Define types for items that can be displayed
interface BusinessItem {
  type: 'product' | 'job';
  id: string;
  // Common properties
  nama: string; // or judul for jobs
  lokasi: string;
  is_active: boolean;
  // Specific to ProductCard
  kategori?: string;
  rating?: number;
  gambar?: string;
  deskripsi_singkat?: string;
  harga?: number;
  is_verified?: boolean;
  // Specific to JobCard
  tipe_pekerjaan?: string;
  gaji_range?: string;
  deadline?: string;
}

interface BusinessDirectoryProps {
  items: BusinessItem[];
  layout: 'grid' | 'list';
  emptyMessage?: string;
}

const BusinessDirectory: React.FC<BusinessDirectoryProps> = ({
  items,
  layout,
  emptyMessage = "Tidak ada listing yang ditemukan saat ini.",
}) => {
  if (items.length === 0) {
    return <p className="text-center text-pk-text-muted py-8">{emptyMessage}</p>;
  }

  const gridClasses = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
  const listClasses = "grid grid-cols-1 gap-4"; // Can be styled differently if needed for distinct list layout

  return (
    <div className={layout === 'grid' ? gridClasses : listClasses}>
      {items.map((item) => (
        <React.Fragment key={item.id}>
          {item.type === 'product' && (
            <ProductCard
              nama={item.nama}
              kategori={item.kategori || 'Umum'}
              lokasi={item.lokasi}
              rating={item.rating || 0}
              gambar={item.gambar || '/images/default-product.jpg'} // Provide a default image
              is_active={item.is_active}
              harga={item.harga}
              deskripsi_singkat={item.deskripsi_singkat}
              is_verified={item.is_verified}
            />
          )}
          {item.type === 'job' && (
            <JobCard
              judul={item.nama} // Using 'nama' for 'judul' in JobCard
              tipe_pekerjaan={item.tipe_pekerjaan || 'Full-time'}
              lokasi={item.lokasi}
              gaji_range={item.gaji_range}
              deskripsi_singkat={item.deskripsi_singkat || 'Lihat detail untuk informasi lebih lanjut.'}
              deadline={item.deadline}
              is_active={item.is_active}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default BusinessDirectory;