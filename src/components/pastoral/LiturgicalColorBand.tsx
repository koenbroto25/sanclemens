'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface LiturgicalColorBandProps {
  className?: string;
  showTooltip?: boolean;
}

const WARNA_INFO: Record<string, { label: string; hex: string; makna: string }> = {
  hijau: {
    label: 'Hijau',
    hex: '#2d7d3c',
    makna: 'Masa Biasa — harapan, kehidupan, pertumbuhan iman',
  },
  ungu: {
    label: 'Ungu',
    hex: '#6a1b9a',
    makna: 'Adven & Prapaskah — pertobatan dan persiapan',
  },
  putih: {
    label: 'Putih',
    hex: '#f5f5f5',
    makna: 'Natal, Paskah, Pesta Tuhan — sukacita dan kemurnian',
  },
  merah: {
    label: 'Merah',
    hex: '#c62828',
    makna: 'Palma, Jumat Agung, Pentakosta, Martir — semangat dan Roh Kudus',
  },
  pink: {
    label: 'Pink',
    hex: '#e91e8c',
    makna: 'Gaudete & Laetare — sukacita di tengah pertobatan',
  },
  emas: {
    label: 'Emas',
    hex: '#ffd700',
    makna: 'Hari Raya Agung — kemuliaan dan perayaan',
  },
};

export function LiturgicalColorBand({ className = '', showTooltip = true }: LiturgicalColorBandProps) {
  const [color, setColor] = useState<string>('hijau');
  const [feastName, setFeastName] = useState<string>('Masa Biasa');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTodayColor() {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];

      const { data } = await supabase
        .from('liturgical_calendar')
        .select('warna_liturgi, hari_raya')
        .eq('tanggal', today)
        .single();

      if (data) {
        setColor(data.warna_liturgi);
        setFeastName(data.hari_raya);
      } else {
        // Default calculation by liturgical season
        const season = getLiturgicalSeason(new Date());
        setColor(season.color);
        setFeastName(season.name);
      }
      setLoading(false);
    }
    loadTodayColor();
  }, []);

  if (loading) {
    return <div className={`h-1 w-full bg-liturgi-hijau/30 ${className}`} />;
  }

  const warnaInfo = WARNA_INFO[color] || WARNA_INFO.hijau;
  const textColor = ['putih', 'emas', 'hijau'].includes(color) ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)';

  return (
    <div
      className={`w-full h-1 transition-colors duration-1000 ${className}`}
      style={{ backgroundColor: warnaInfo.hex }}
      title={showTooltip ? `${feastName} — ${warnaInfo.makna}` : ''}
      aria-label={`Warna liturgi hari ini: ${warnaInfo.label}`}
    >
      {showTooltip && (
        <div className="sr-only">
          {feastName} — Warna liturgi: {warnaInfo.label}
        </div>
      )}
    </div>
  );
}

// Helper: hitung musim liturgi otomatis
function getLiturgicalSeason(date: Date): { color: string; name: string } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Approximate dates (akan ditimpa oleh DB jika tersedia)
  if ((month === 12 && day >= 25) || (month === 1 && day <= 13)) {
    return { color: 'putih', name: 'Natal' };
  }
  if (month === 11 && day >= 27) {
    return { color: 'ungu', name: 'Adven' };
  }
  // Paskah approximation (akan ditimpa DB)
  if (month === 4 || (month === 5 && day <= 15)) {
    return { color: 'putih', name: 'Paskah' };
  }
  if (month === 2 || (month === 3 && day < 20)) {
    return { color: 'ungu', name: 'Prapaskah' };
  }
  return { color: 'hijau', name: 'Masa Biasa' };
}
