// LiturgicalColorBand [DS] §8.7 — Pita liturgi 4px di header
// Menampilkan warna musim liturgi yang aktif
import React from 'react';

const LITURGICAL_SEASONS = [
  { id: 'advent', label: 'Advent', color: 'var(--liturgi-ungu, #6a1b9a)' },
  { id: 'christmas', label: 'Natal', color: 'var(--liturgi-putih, #f5f5f5)' },
  { id: 'lent', label: 'Prapaskah', color: 'var(--liturgi-ungu, #6a1b9a)' },
  { id: 'easter', label: 'Paskah', color: 'var(--liturgi-emas, #ffd700)' },
  { id: 'ordinary', label: 'Biasa', color: 'var(--liturgi-hijau, #2d7d3c)' },
  { id: 'pentecost', label: 'Pentakosta', color: 'var(--liturgi-merah, #c62828)' },
];

// Ini akan diganti dengan data dari API liturgical calendar
const CURRENT_SEASON = LITURGICAL_SEASONS[4]; // Default: Ordinary Time

interface LiturgicalColorBandProps {
  seasonId?: string;
  showTooltip?: boolean;
  className?: string;
}

export function LiturgicalColorBand({
  seasonId,
  showTooltip = true,
  className = '',
}: LiturgicalColorBandProps) {
  const season = seasonId
    ? LITURGICAL_SEASONS.find((s) => s.id === seasonId) || CURRENT_SEASON
    : CURRENT_SEASON;

  return (
    <div
      className={`liturgical-band relative ${className}`}
      style={{
        height: '4px',
        backgroundColor: season.color,
        transition: 'background-color 1s ease',
        position: 'relative',
      }}
      title={showTooltip ? `Musim ${season.label}` : undefined}
    >
      {showTooltip && (
        <div
          className="liturgical-band-tooltip"
          style={{
            position: 'absolute',
            right: '16px',
            top: '6px',
            fontSize: '10px',
            color: 'var(--text-tertiary, #9e9e9e)',
            whiteSpace: 'nowrap',
            opacity: 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          {season.label}
        </div>
      )}
      <style>{`
        .liturgical-band:hover .liturgical-band-tooltip {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}