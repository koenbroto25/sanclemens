// SacramentStatusBadge [DS §8.1] — Status sakramen dengan warna dan ikon
import React from 'react';

type SacramentStatus = 'completed' | 'in_progress' | 'not_started' | 'not_applicable';
type BadgeSize = 'sm' | 'md' | 'lg';

interface SacramentStatusBadgeProps {
  status: SacramentStatus;
  size?: BadgeSize;
  className?: string;
}

const STATUS_CONFIG: Record<SacramentStatus, { label: string; icon: string; color: string; bg: string }> = {
  completed: {
    label: 'Selesai',
    icon: '✓',
    color: '#2e7d32',
    bg: '#e8f5e9',
  },
  in_progress: {
    label: 'Dalam Proses',
    icon: '⏳',
    color: '#ed6c02',
    bg: '#fff3e0',
  },
  not_started: {
    label: 'Belum',
    icon: '–',
    color: '#757575',
    bg: '#e0dbd4',
  },
  not_applicable: {
    label: 'Tidak Berlaku',
    icon: '⊘',
    color: '#9e9e9e',
    bg: '#f0ebf0',
  },
};

const SIZE_MAP: Record<BadgeSize, { container: number; icon: number; fontSize: string }> = {
  sm: { container: 24, icon: 12, fontSize: '10px' },
  md: { container: 32, icon: 16, fontSize: '11px' },
  lg: { container: 40, icon: 20, fontSize: '13px' },
};

export function SacramentStatusBadge({ status, size = 'md', className = '' }: SacramentStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const dims = SIZE_MAP[size];

  return (
    <span
      className={`sacrament-status-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 10px 2px 6px',
        borderRadius: '100px',
        backgroundColor: config.bg,
        color: config.color,
        fontSize: dims.fontSize,
        fontWeight: 500,
        lineHeight: 1,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: dims.container,
          height: dims.container,
          borderRadius: '50%',
          backgroundColor: config.color,
          color: '#ffffff',
          fontSize: `${dims.icon}px`,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {config.icon}
      </span>
      <span>{config.label}</span>
    </span>
  );
}

export default SacramentStatusBadge;