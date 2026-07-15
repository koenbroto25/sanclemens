'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  PhoneCallIcon, 
  LockIcon, 
  Loader2Icon, 
  AlertCircleIcon,
  HomeIcon
} from 'lucide-react';

const FONTS = {
  heading: "'Cormorant Garamond', Georgia, serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
};

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export default function LoginPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<'phone' | 'username'>('phone');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (loginMethod === 'phone') {
      if (!phone || !password) {
        setError('Nomor WhatsApp dan kata sandi harus diisi');
        setLoading(false);
        return;
      }
    } else {
      if (!username || !password) {
        setError('Username dan kata sandi harus diisi');
        setLoading(false);
        return;
      }
    }

    try {
      const body: any = { password };
      if (loginMethod === 'phone') {
        body.phone = normalizePhone(phone);
      } else {
        body.username = username;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Login gagal');
      }
      window.location.href = json.redirect || '/user/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(to bottom, var(--color-parchment, #f8f1e2), var(--color-cream, #f5f0e8))' }}>
      
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, var(--color-gold, #c8a96e), transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, var(--color-glass-red, #8b2635), transparent)' }} />
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/public" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/60 hover:bg-white border border-[rgba(200,169,110,0.2)] text-sm font-medium transition-all" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>
            <HomeIcon className="h-4 w-4" style={{ color: 'var(--color-gold-deep, #c8a96e)' }} />
            Beranda
          </Link>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-[rgba(200,169,110,0.15)] p-8 md:p-10" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', borderRadius: '4px 28px 4px 28px', boxShadow: '0 12px 40px rgba(26,14,5,0.08)' }}>
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: 'linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.25))', border: '2px solid var(--color-gold, #c8a96e)' }}>
              <LockIcon className="h-8 w-8" style={{ color: 'var(--color-gold-deep, #c8a96e)' }} />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold mb-2" style={{ fontFamily: FONTS.heading, color: 'var(--color-text-dark, #1a0e05)' }}>
              Masuk ke Akun
            </h1>
            <p className="text-sm" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>
              Selamat datang kembali di ekosistem Paroki Santo Klemens
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-lg flex items-start gap-3 border" style={{ background: 'rgba(139,38,53,0.08)', borderColor: 'rgba(139,38,53,0.2)', color: 'var(--color-error, #8b2635)' }}>
              <AlertCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Login Method Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'phone'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{ fontFamily: FONTS.body }}
            >
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('username')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'username'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{ fontFamily: FONTS.body }}
            >
              Username
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {loginMethod === 'phone' ? (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>
                  Nomor WhatsApp <span style={{ color: 'var(--color-error, #8b2635)' }}>*</span>
                </label>
                <div className="relative">
                  <PhoneCallIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--color-stone, #8b7355)' }} />
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border transition-all"
                    style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)', color: 'var(--color-text-dark, #1a0e05)' }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5" style={{ fontFamily: FONTS.body }}>
                  Masukkan nomor WhatsApp terdaftar
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>
                  Username <span style={{ color: 'var(--color-error, #8b2635)' }}>*</span>
                </label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--color-stone, #8b7355)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: maria@1234"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border transition-all"
                    style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)', color: 'var(--color-text-dark, #1a0e05)' }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5" style={{ fontFamily: FONTS.body }}>
                  Username Wali Digital (nama@4digitKK)
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>
                Kata Sandi <span style={{ color: 'var(--color-error, #8b2635)' }}>*</span>
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--color-stone, #8b7355)' }} />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-11 pr-4 py-3 rounded-lg border transition-all"
                  style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)', color: 'var(--color-text-dark, #1a0e05)' }}
                />
              </div>
            </div>

            <div className="text-right">
            <Link href="/auth/forgot-password" className="text-xs font-medium transition-colors" style={{ fontFamily: FONTS.body, color: 'var(--color-gold-deep, #c8a96e)' }}>
              Lupa kata sandi?
            </Link>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 rounded-lg font-semibold text-sm uppercase tracking-wide transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ 
                fontFamily: FONTS.body,
                background: 'linear-gradient(135deg, #dfc493, var(--color-gold, #c8a96e))',
                color: 'var(--color-primary, #1a0e05)',
                borderRadius: '2px 24px 2px 24px',
                boxShadow: '0 4px 18px rgba(200,169,110,0.28)'
              }}
            >
              {loading ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : 'Masuk'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-[rgba(200,169,110,0.15)]">
            <p className="text-xs text-center" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>
              {loginMethod === 'phone' ? 'Belum punya akun?' : 'Belum terdaftar sebagai wali digital?'}{' '}
              <Link 
                href={loginMethod === 'phone' ? '/auth/register' : '/auth/register'} 
                className="font-semibold underline" 
                style={{ color: 'var(--color-gold-deep, #c8a96e)' }}
              >
                Daftar di sini
              </Link>
            </p>
            <p className="text-xs text-center mt-2" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>
              {loginMethod === 'username' && (
                <span className="italic">
                 Username diberikan oleh Ketua Lingkungan saat pendaftaran keluarga
                </span>
              )}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}