'use client';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-cream)', padding: '2rem' }}>
      <div style={{ maxWidth: '480px', width: '100%', background: '#fff', borderRadius: '8px 32px 8px 32px', padding: '3rem 2.5rem', boxShadow: 'var(--shadow-warm)', textAlign: 'center', border: '1px solid rgba(200,169,110,0.1)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.8rem', color: 'var(--color-text-dark)', marginBottom: '0.75rem' }}>
          Akses Tidak Diizinkan
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--color-stone)', lineHeight: '1.7', marginBottom: '2rem' }}>
          Maaf, Anda tidak memiliki izin untuk mengakses halaman ini. 
          Silakan hubungi admin paroki jika Anda merasa seharusnya memiliki akses.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.75rem', color: '#fff', background: 'var(--color-gold)', padding: '0.75rem 2rem', borderRadius: '2px 24px 2px 24px' }}>
            Kembali ke Dashboard
          </Link>
          <Link href="/auth/login" style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.75rem', color: 'var(--color-gold)', border: '1px solid var(--color-gold)', padding: '0.75rem 2rem', borderRadius: '2px 24px 2px 24px' }}>
            Halaman Login
          </Link>
        </div>
      </div>
    </div>
  );
}