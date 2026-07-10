'use client';
import { useState, useEffect, useRef } from 'react';
import { UsersIcon, ArrowRightIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const FEATURES = [
  'Pendataan Umat & Lingkungan',
  'AI Match (Pekerjaan, Bantuan, Bakat)',
  'AI Companion Rohani',
  'Sistem SOS Anti-Abuse',
  'Pasar Kasih & Dana Kasih',
  'Digital Vault & Dokumen',
  'Dashboard Umat Interaktif',
];

const SESSION_KEY_ABOUT_US = 'about_us_slide_dismissed';

export default function AboutUsSlide() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // New state for login status

  const supabase = createClient();

  const closePanel = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 400);
  };

  const dismiss = () => {
    closePanel();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY_ABOUT_US, '1');
    }
    setIsDismissed(true);
  };

  useEffect(() => {
    // Check login status
    const checkLoginStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    checkLoginStatus();

    // Only show if not dismissed and not logged in
    if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(SESSION_KEY_ABOUT_US)) {
      setIsOpen(true);
    } else if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY_ABOUT_US)) {
      setIsDismissed(true);
    }

    // Since it's not auto-closing, no timeout needed here
  }, [supabase, isLoggedIn]); // Re-run effect if supabase or isLoggedIn changes

  // Close when logged in
  useEffect(() => {
    if (isLoggedIn && isOpen) {
      closePanel();
    }
  }, [isLoggedIn, isOpen]);

  const panelClass = `lc-slide-panel${isOpen ? ' open' : ''}${isClosing ? ' closing' : ''}`;

  if (isLoggedIn) return null; // Do not render anything if user is logged in

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Styles adapted from LearnCatholicSlide.tsx, with minor adjustments */
        .lc-slide-overlay {
          position: fixed; inset: 0;
          background: rgba(26, 14, 5, 0.45);
          z-index: 1100; opacity: 0; pointer-events: none;
          transition: opacity 0.4s ease;
        }
        .lc-slide-overlay.open { opacity: 1; pointer-events: auto; }
        .lc-slide-panel {
          position: fixed; top: 0; right: -480px; /* Adjusted from right */
          width: 440px; max-width: 95vw; height: 100vh;
          z-index: 1101; background: var(--color-primary);
          border-left: 1px solid rgba(200,169,110,0.15);
          box-shadow: -8px 0 48px rgba(26,14,5,0.4);
          transition: right 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease;
          display: flex; flex-direction: column; overflow: hidden; opacity: 1;
        }
        .lc-slide-panel.open { right: 0; }
        .lc-slide-panel.closing { opacity: 0; }
        .lc-countdown-bar { /* This bar is not needed for non-auto-closing slide, but keeping CSS in case */
          height: 3px; width: 100%;
          background: linear-gradient(90deg, var(--color-gold), rgba(200,169,110,0.3));
          /* animation: lc-shrink 3s linear forwards; */
          transform-origin: left;
        }
        /* @keyframes lc-shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } } */
        .lc-slide-panel .lc-header { padding: 2rem 2rem 1.5rem; position: relative; flex-shrink: 0; }
        .lc-slide-panel .lc-close {
          position: absolute; top: 1.25rem; right: 1.25rem;
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.2s; border: none;
        }
        .lc-slide-panel .lc-close:hover { background: rgba(255,255,255,0.14); }
        .lc-slide-panel .lc-close svg { width: 14px; height: 14px; color: var(--color-stone); }
        .lc-eyebrow {
          font-family: var(--font-body); font-weight: 500; font-size: 0.6rem;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-gold);
          margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;
        }
        .lc-eyebrow::before { content: ''; width: 20px; height: 1px; background: var(--color-gold); opacity: 0.6; }
        .lc-title { font-family: var(--font-heading); font-weight: 400; font-size: 2rem; color: var(--color-text-light); line-height: 1.15; margin-bottom: 0.75rem; }
        .lc-subtitle { font-family: var(--font-body); font-size: 0.82rem; color: rgba(240,235,224,0.6); line-height: 1.7; }
        .lc-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(200,169,110,0.2), transparent); margin: 0 2rem; flex-shrink: 0; }
        .lc-body { padding: 1.5rem 2rem; flex: 1; overflow-y: auto; }
        .lc-topics-label { font-family: var(--font-body); font-weight: 500; font-size: 0.6rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--color-stone); margin-bottom: 1rem; }
        .lc-topics { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2rem; }
        .lc-topic-item {
          display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1rem;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(200,169,110,0.08);
          border-radius: 2px 14px 2px 14px; font-family: var(--font-body); font-size: 0.82rem;
          color: rgba(240,235,224,0.8); transition: all 0.2s;
        }
        .lc-topic-item:hover { background: rgba(255,255,255,0.08); border-color: rgba(200,169,110,0.2); color: var(--color-text-light); transform: translateX(4px); }
        .lc-topic-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color-gold); flex-shrink: 0; opacity: 0.7; }
        .lc-cta-area { padding: 1.5rem 2rem 2rem; flex-shrink: 0; border-top: 1px solid rgba(200,169,110,0.08); }
        .lc-badge { display: inline-flex; align-items: center; gap: 0.4rem; font-family: var(--font-body); font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-gold); background: rgba(200,169,110,0.1); padding: 0.25rem 0.75rem; border-radius: 20px; margin-bottom: 1rem; }
        .lc-btn-primary {
          display: flex; align-items: center; justify-content: center; gap: 0.6rem; width: 100%;
          font-family: var(--font-body); font-weight: 600; font-size: 0.75rem; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--color-primary); background: var(--color-gold);
          padding: 0.9rem 1.5rem; border-radius: var(--radius-btn); transition: all 0.3s ease;
          text-decoration: none; min-height: 48px; margin-bottom: 0.75rem;
        }
        .lc-btn-primary:hover { background: var(--color-gold-light); box-shadow: 0 6px 24px rgba(200,169,110,0.4); }
        .lc-dismiss { display: block; text-align: center; font-family: var(--font-body); font-size: 0.68rem; color: rgba(240,235,224,0.35); cursor: pointer; transition: color 0.2s; background: none; border: none; width: 100%; padding: 0.25rem; }
        .lc-dismiss:hover { color: rgba(240,235,224,0.6); }
        .lc-reopen-tab {
          position: fixed; right: 0; top: 50%; transform: translateY(-50%);
          z-index: 1099; background: var(--color-primary);
          border: 1px solid rgba(200,169,110,0.2); border-right: none;
          border-radius: 8px 0 0 8px; padding: 1rem 0.6rem;
          display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
          cursor: pointer; transition: all 0.3s ease; box-shadow: -4px 0 20px rgba(26,14,5,0.3);
          transform: translateY(-50%);
          opacity: 1; /* Always visible unless logged in */
        }
        .lc-reopen-tab:hover { background: var(--color-secondary); padding-right: 0.9rem; }
        .lc-reopen-tab svg { width: 16px; height: 16px; color: var(--color-gold); }
        .lc-tab-text { font-family: var(--font-body); font-size: 0.58rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-gold); writing-mode: vertical-rl; text-orientation: mixed; }
        @media (max-width: 768px) {
          .lc-slide-panel { width: 100vw; max-width: 100vw; right: 0; border-left: none; border-top: 1px solid rgba(200,169,110,0.15); height: 85vh; top: auto; bottom: -85vh; border-radius: 20px 20px 0 0; transition: bottom 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease; }
          .lc-slide-panel.open { bottom: 0; right: 0; }
          .lc-slide-panel.closing { opacity: 0; }
          .lc-reopen-tab { top: auto; bottom: 5rem; transform: none; }
        }
      `}} />

      {/* Overlay is only shown when panel is open */}
      {isOpen && <div className={`lc-slide-overlay ${isOpen ? 'open' : ''}`} onClick={dismiss} aria-hidden="true" />}

      <div className={panelClass} role="dialog" aria-label="Tentang Ekosistem Digital Paroki" aria-hidden={!isOpen}>
        <div className="lc-header">
          <button className="lc-close" aria-label="Tutup" onClick={dismiss}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          <div className="lc-eyebrow">Bergabunglah Bersama Kami</div>
          <h2 className="lc-title">Ekosistem Digital<br />Paroki Santo Klemens</h2>
          <p className="lc-subtitle">Platform terpadu untuk pelayanan umat, pendataan cerdas berbasis AI, dan komunitas yang terhubung.</p>
        </div>
        <div className="lc-divider" />
        <div className="lc-body">
          <div className="lc-topics-label">Fitur Utama</div>
          <div className="lc-topics">
            {FEATURES.map((feature) => (
              <div key={feature} className="lc-topic-item">
                <span className="lc-topic-dot" />
                {feature}
              </div>
            ))}
          </div>
        </div>
        <div className="lc-cta-area">
          <span className="lc-badge">
            <svg viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="3" /></svg>
            Untuk Umat, Oleh Umat
          </span>
          <a href="/public/tentang-ekosistem" className="lc-btn-primary">
            <UsersIcon style={{ width: 14, height: 14 }} />
            Pelajari Lebih Lanjut
            <ArrowRightIcon style={{ width: 14, height: 14 }} />
          </a>
          <button className="lc-dismiss" onClick={dismiss}>Tutup sementara</button>
        </div>
      </div>

      {isDismissed && !isOpen && (
        <button className="lc-reopen-tab" aria-label="Buka Tentang Ekosistem Digital Paroki" onClick={() => { setIsDismissed(false); setIsOpen(true); }}>
          <UsersIcon style={{ width: 16, height: 16, color: 'var(--color-gold)' }} />
          <span className="lc-tab-text">Tentang Ekosistem</span>
        </button>
      )}
    </>
  );
}