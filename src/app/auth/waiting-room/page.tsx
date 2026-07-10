'use client';
import Link from 'next/link';

export default function WaitingRoomPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-cream)', padding: '2rem' }}>
      <div style={{ maxWidth: '480px', width: '100%', background: '#fff', borderRadius: '8px 32px 8px 32px', padding: '3rem 2.5rem', boxShadow: 'var(--shadow-warm)', textAlign: 'center', border: '1px solid rgba(200,169,110,0.1)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.8rem', color: 'var(--color-text-dark)', marginBottom: '0.75rem' }}>
          Akun Anda Sedang Ditinjau
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--color-stone)', lineHeight: '1.7', marginBottom: '2rem' }}>
          Terima kasih telah mendaftar. Akun Anda saat ini sedang menunggu verifikasi oleh admin paroki atau ketua lingkungan. 
          Anda akan menerima notifikasi WhatsApp setelah akun diaktifkan.
        </p>
        <div style={{ background: 'var(--color-cream)', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem', textAlign: 'left' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-stone)', marginBottom: '0.5rem' }}>Status Pendaftaran:</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-dark)' }}>Menunggu Verifikasi</span>
          </div>
        </div>
        <Link href="/auth/login" style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.75rem', color: 'var(--color-gold)', textDecoration: 'underline' }}>
          Kembali ke halaman login
        </Link>
      </div>
    </div>
  );
}