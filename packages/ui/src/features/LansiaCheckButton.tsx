// LansiaCheckButton [DS §8.8] — Tombol cek pagi lansia
import React from 'react';

interface LansiaCheckButtonProps {
  checked: boolean;
  lastCheck?: string;
  streak?: number;
  onCheck: () => void;
  name?: string;
  className?: string;
}

export function LansiaCheckButton({
  checked,
  lastCheck,
  streak = 0,
  onCheck,
  name = '',
  className = '',
}: LansiaCheckButtonProps) {
  const now = new Date();
  const hour = now.getHours();
  const isLate = hour >= 9 && !checked;

  // Format last check time
  const formattedLastCheck = lastCheck
    ? new Date(lastCheck).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Makassar',
      })
    : null;

  return (
    <button
      onClick={checked ? undefined : onCheck}
      disabled={checked}
      className={`lansia-check-button ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        border: checked
          ? '2px solid var(--success, #2e7d32)'
          : '2px solid var(--accent, #c9a227)',
        backgroundColor: checked
          ? 'var(--success-wash, #e8f5e9)'
          : isLate
          ? 'rgba(211, 47, 47, 0.15)'
          : 'var(--accent-wash, #fdf6e3)',
        cursor: checked ? 'default' : 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        animation: isLate && !checked ? 'lansia-pulse 2s infinite' : 'none',
      }}
      title={checked ? 'Sudah dikonfirmasi' : 'Tap untuk konfirmasi Anda baik-baik saja'}
    >
      {checked ? (
        <span style={{ fontSize: '24px', color: 'var(--success, #2e7d32)' }}>✓</span>
      ) : isLate ? (
        <span style={{ fontSize: '20px', color: 'var(--error, #d32f2f)' }}>⚠</span>
      ) : (
        <span style={{ fontSize: '24px', color: 'var(--accent, #c9a227)' }}>☀</span>
      )}

      {name && (
        <span
          style={{
            position: 'absolute',
            bottom: '-20px',
            whiteSpace: 'nowrap',
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--text-secondary, #6b5e50)',
          }}
        >
          {name}
        </span>
      )}

      <style>{`
        @keyframes lansia-pulse {
          0% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(211, 47, 47, 0); }
          100% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0); }
        }
        .lansia-check-button:hover:not(:disabled) {
          transform: scale(1.08);
          box-shadow: 0 4px 14px rgba(201, 162, 39, 0.3);
        }
      `}</style>
    </button>
  );
}

export default LansiaCheckButton;