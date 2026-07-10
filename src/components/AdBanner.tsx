'use client';
import { useState } from 'react';

const MOCK_ADS = [
  {
    id: 'ad1',
    title: 'Donasi Panti Asuhan',
    description: 'Bantu anak-anak yatim piatu meraih masa depan yang lebih baik.',
    imageUrl: '/images/ad_orphanage_donation.jpg',
    link: '#',
  },
  {
    id: 'ad2',
    title: 'Promo UMKM Lingkungan',
    description: 'Dukung usaha kecil menengah di lingkungan Anda! Diskon 15% bulan ini.',
    imageUrl: '/images/ad_umkm_promo.jpg',
    link: '#',
  },
  {
    id: 'ad3',
    title: 'Relawan Petugas Gereja',
    description: 'Bergabunglah menjadi relawan kegiatan Gereja. Hubungi sekretariat.',
    imageUrl: '/images/ad_volunteer.jpg',
    link: '#',
  },
];

interface AdBannerProps {
  location?: 'homepage' | 'portal-hub' | 'marketplace';
}

export function AdBanner({ location = 'homepage' }: AdBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = MOCK_ADS.filter(ad => !dismissed.has(ad.id));
  if (visible.length === 0) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', width: '100%' }}>
      {visible.map(ad => (
        <div key={ad.id} style={{ position: 'relative', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,169,110,0.15)', borderRadius: '12px', overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
          <button
            onClick={() => setDismissed(prev => new Set([...prev, ad.id]))}
            aria-label="Tutup iklan"
            style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 2, background: 'rgba(26,14,5,0.55)', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f0ebe0', fontSize: 14, lineHeight: 1 }}
          >×</button>
          <span style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', zIndex: 2, background: 'rgba(26,14,5,0.6)', color: '#c8a96e', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.15rem 0.5rem', borderRadius: 20, fontFamily: 'var(--font-body)' }}>Ad</span>
          <a href={ad.link} style={{ textDecoration: 'none', display: 'block' }}>
            <img src={ad.imageUrl} alt={ad.title} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '0.9rem 1rem 1.1rem' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--color-text-light)', marginBottom: '0.35rem', lineHeight: 1.3 }}>{ad.title}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(240,235,224,0.55)', lineHeight: 1.55 }}>{ad.description}</div>
            </div>
          </a>
        </div>
      ))}
    </div>
  );
}
