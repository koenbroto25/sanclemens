'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

export type MedallionStatus = 'completed' | 'current' | 'locked' | 'default';

/* ============================================================
   QUATREFOIL MEDALLION — motif "kaca patri" inti seluruh area
   Belajar Katolik. Geometri disamakan dengan --pattern-gothic-dark
   (4 lingkaran + bingkai belah ketupat) di public.css, hanya diberi
   isi warna kaca. Dipakai di peta kurikulum maupun header/TOC
   halaman modul supaya satu keluarga visual di semua tempat.
   ============================================================ */
export function QuatrefoilMedallion({
  size,
  base,
  light,
  icon,
  status = 'default',
  animateSheen = false,
  reducedMotion = false,
}: {
  size: number;
  base: string;
  light: string;
  icon: string;
  status?: MedallionStatus;
  animateSheen?: boolean;
  reducedMotion?: boolean;
}) {
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const isCurrent = status === 'current';
  const gradId = useMemo(() => `glass-${base.replace('#', '')}-${Math.round(size)}`, [base, size]);

  return (
    <div className="relative shrink-0 select-none" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 70 70"
        width={size}
        height={size}
        className={`absolute inset-0 transition-[filter,opacity] duration-500 ${
          isLocked ? 'grayscale opacity-40' : 'opacity-100'
        }`}
      >
        <defs>
          <radialGradient id={gradId} cx="35%" cy="28%" r="78%">
            <stop offset="0%" stopColor={light} stopOpacity="0.95" />
            <stop offset="100%" stopColor={base} stopOpacity="0.97" />
          </radialGradient>
        </defs>
        <path d="M35 3 L67 35 L35 67 L3 35 Z" fill="none" stroke="var(--color-gold)" strokeWidth="1.3" opacity="0.55" />
        <circle cx="35" cy="24" r="12.5" fill={`url(#${gradId})`} stroke="var(--color-gold)" strokeWidth="0.75" opacity="0.92" />
        <circle cx="46" cy="35" r="12.5" fill={`url(#${gradId})`} stroke="var(--color-gold)" strokeWidth="0.75" opacity="0.88" />
        <circle cx="35" cy="46" r="12.5" fill={`url(#${gradId})`} stroke="var(--color-gold)" strokeWidth="0.75" opacity="0.92" />
        <circle cx="24" cy="35" r="12.5" fill={`url(#${gradId})`} stroke="var(--color-gold)" strokeWidth="0.75" opacity="0.88" />
        <circle cx="35" cy="35" r="4.5" fill="var(--color-gold)" opacity="0.9" />
        <circle cx="3" cy="35" r="2.2" fill="var(--color-gold)" opacity="0.6" />
        <circle cx="67" cy="35" r="2.2" fill="var(--color-gold)" opacity="0.6" />
        <circle cx="35" cy="3" r="2.2" fill="var(--color-gold)" opacity="0.6" />
        <circle cx="35" cy="67" r="2.2" fill="var(--color-gold)" opacity="0.6" />
      </svg>

      {animateSheen && !reducedMotion && !isLocked && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.55) 6%, transparent 18%, transparent 100%)',
            mixBlendMode: 'overlay',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <span className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ fontSize: size * 0.36 }}>
        {isLocked ? '🔒' : icon}
      </span>

      {isCompleted && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center rounded-full font-bold"
          style={{
            width: Math.max(16, size * 0.32),
            height: Math.max(16, size * 0.32),
            fontSize: Math.max(9, size * 0.16),
            background: 'var(--color-gold)',
            color: 'var(--color-primary)',
            boxShadow: 'var(--shadow-gold)',
          }}
        >
          ✓
        </span>
      )}

      {isCurrent && !reducedMotion && (
        <motion.span
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 0 2px var(--color-gold), 0 0 0 2px var(--color-gold)',
              '0 0 0 2px var(--color-gold), 0 0 14px 6px rgba(200,169,110,0)',
            ],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      {isCurrent && reducedMotion && (
        <span className="absolute inset-0 rounded-full pointer-events-none" style={{ boxShadow: '0 0 0 2px var(--color-gold)' }} />
      )}
    </div>
  );
}
