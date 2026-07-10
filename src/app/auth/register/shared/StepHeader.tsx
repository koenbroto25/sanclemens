import { ReactNode } from 'react';
import { FONTS } from '../types';

interface StepHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export default function StepHeader({ icon, title, subtitle }: StepHeaderProps) {
  return (
    <div className="text-center mb-6">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ background: 'rgba(200,169,110,0.15)' }}>
        {icon}
      </div>
      <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: FONTS.heading, color: 'var(--color-text-dark, #1a0e05)' }}>
        {title}
      </h2>
      <p className="text-sm" style={{ fontFamily: FONTS.body, color: 'var(--color-stone-dark, #4a3c31)' }}>
        {subtitle}
      </p>
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3.5 rounded-lg font-semibold text-sm uppercase tracking-wide transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      style={{
        fontFamily: FONTS.body,
        background: 'linear-gradient(135deg, #dfc493, var(--color-gold, #c8a96e))',
        color: 'var(--color-primary, #1a0e05)',
        borderRadius: '2px 24px 2px 24px',
        boxShadow: '0 4px 18px rgba(200,169,110,0.28)',
      }}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="flex-1 py-3 rounded-lg border font-medium text-sm transition-all hover:bg-white/60"
      style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.3)', color: 'var(--color-stone-dark, #4a3c31)' }}
    >
      {children}
    </button>
  );
}