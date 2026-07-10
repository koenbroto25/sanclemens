'use client';
import Link from 'next/link';

export default function ProfilParokiPage() {
  const lingkungan = [
    { kode: 'AR', nama: 'St. Andreas Rasul', wilayah: 'Wilayah I' },
    { kode: 'FA', nama: 'St. Fransiskus Asisi', wilayah: 'Wilayah I' },
    { kode: 'MRR', nama: 'St. Maria Ratu Rosari', wilayah: 'Wilayah I' },
    { kode: 'AL', nama: 'St. Albertus', wilayah: 'Wilayah I' },
    { kode: 'MSR', nama: 'St. Maria Salve Regina', wilayah: 'Wilayah II' },
    { kode: 'AN', nama: 'St. Anna', wilayah: 'Wilayah II' },
    { kode: 'CL', nama: 'St. Clara', wilayah: 'Wilayah II' },
    { kode: 'MN', nama: 'St. Monica', wilayah: 'Wilayah II' },
    { kode: 'TDL', nama: 'St. Theresia dari Lisieux', wilayah: 'Wilayah III' },
    { kode: 'TDA', nama: 'St. Theresia dari Avila', wilayah: 'Wilayah III' },
    { kode: 'GB', nama: 'St. Gabriel', wilayah: 'Wilayah III' },
    { kode: 'MLS', nama: 'St. Maria La Salette', wilayah: 'Wilayah III' },
    { kode: 'MI', nama: 'St. Maria Immaculata', wilayah: 'Wilayah IV' },
    { kode: 'LP', nama: 'St. Lukas Penginjil', wilayah: 'Wilayah IV' },
    { kode: 'YP', nama: 'St. Yosef Pekerja', wilayah: 'Wilayah IV' },
    { kode: 'SY', nama: 'Stasi St. Yosef', wilayah: 'Stasi' },
    { kode: 'RR', nama: 'Stasi Ratu Rosari', wilayah: 'Stasi' },
  ];

  return (
    <div className="section-misa">
      <div className="section-inner" style={{ paddingTop: '6rem', paddingBottom: '4rem' }}>
        <p className="section-eyebrow">Tentang Paroki</p>
        <h2 className="section-title">Profil Paroki Santo Klemens</h2>
        <div className="ornament-divider">
          <span className="line"></span>
          <span className="cross">
            <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="1" width="2" height="12" rx="0.5" fill="#c8a96e"/>
              <rect x="3" y="4" width="8" height="2" rx="0.5" fill="#c8a96e"/>
            </svg>
          </span>
          <span className="line"></span>
        </div>
        
        <div style={{maxWidth:'800px', margin:'0 auto 3rem', lineHeight:'2', color:'var(--color-text-dark)'}}>
          <h3 style={{fontFamily:'var(--font-heading)', fontSize:'1.5rem', marginBottom:'1rem', color:'var(--color-primary)'}}>Sejarah Singkat</h3>
          <p style={{marginBottom:'1rem'}}>Paroki Santo Klemens Sepinggan didirikan pada tahun 1985 sebagai stasi dari Paroki Santo Petrus dan Paulus. Seiring perkembangan jumlah umat dan kebutuhan pelayanan pastoral, stasi ini ditingkatkan menjadi paroki mandiri pada tahun 1995 dengan nama Santo Klemens I.</p>
          <p style={{marginBottom:'1rem'}}>Gereja Santo Martinus di Lanud Sepinggan menjadi pusat kegiatan pastoral Paroki Santo Klemens. Hingga saat ini, paroki memiliki 17 lingkungan/stasi yang tersebar di wilayah Balikpapan.</p>
          
          <h3 style={{fontFamily:'var(--font-heading)', fontSize:'1.5rem', marginBottom:'1rem', marginTop:'2rem', color:'var(--color-primary)'}}>Visi & Misi</h3>
          <p style={{marginBottom:'1rem'}}><strong>Visi:</strong> Menjadi komunitas umat Katolik yang hidup, bersatu, dan bersaksi dalam terang iman akan Kristus.</p>
          <p><strong>Misi:</strong> Meningkatkan kualitas hidup beriman, memperkuat persaudaraan lintas lingkungan, dan melayani sesama dengan kasih.</p>
        </div>

        <h3 style={{fontFamily:'var(--font-heading)', fontSize:'1.5rem', textAlign:'center', marginBottom:'1.5rem', color:'var(--color-primary)'}}>Daftar Lingkungan & Stasi</h3>
        <div style={{maxWidth:'800px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(230px, 1fr))', gap:'1rem'}}>
          {lingkungan.map((l, i) => (
            <Link key={i} href={`/lingkungan/${l.kode}`} className="misa-card" style={{ textDecoration: 'none', display: 'block', background: '#fffdf9' }}>
              <div style={{fontFamily:'var(--font-heading)', fontWeight:600, fontSize:'1.1rem', color:'var(--color-gold-deep)'}}>{l.kode}</div>
              <div style={{fontFamily:'var(--font-body)', fontWeight:500, fontSize:'0.85rem', color:'var(--color-text-dark)', marginTop:'0.25rem'}}>{l.nama}</div>
              <div style={{fontFamily:'var(--font-body)', fontSize:'0.7rem', color:'var(--color-stone)', marginTop:'0.25rem'}}>{l.wilayah}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
