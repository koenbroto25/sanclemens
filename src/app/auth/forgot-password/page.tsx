'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  PhoneCallIcon, 
  LockIcon, 
  Loader2Icon, 
  AlertCircleIcon,
  HomeIcon,
  KeyRoundIcon
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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!phone) {
      setError('Nomor WhatsApp harus diisi');
      setLoading(false);
      return;
    }

    try {
      const normalized = normalizePhone(phone);
      const res = await fetch('/api/auth/send-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal mengirim OTP');
      }
      // Store phone in sessionStorage for reset page
      sessionStorage.setItem('resetPhone', normalized);
      setSuccess(true);
      // Auto redirect after 3 seconds
      setTimeout(() => {
        router.push('/auth/reset-password');
      }, 3000);
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
              <KeyRoundIcon className="h-8 w-8" style={{ color: 'var(--color-gold-deep, #c8a96e)' }} />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold mb-2" style={{ fontFamily: FONTS.heading, color: 'var(--color-text-dark, #1a0e05)' }}>
              Lupa Kata Sandi
            </h1>
            <p className="text-sm" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>
              Masukkan nomor WhatsApp Anda untuk mereset kata sandi
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-lg flex items-start gap-3 border" style={{ background: 'rgba(139,38,53,0.08)', borderColor: 'rgba(139,38,53,0.2)', color: 'var(--color-error, #8b2635)' }}>
              <AlertCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-6 p-4 rounded-lg flex items-start gap-3 border" style={{ background: 'rgba(74,140,92,0.08)', borderColor: 'rgba(74,140,92,0.2)', color: 'var(--color-success, #4a8c5c)' }}>
              <AlertCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">OTP telah dikirim!</p>
                <p className="text-xs mt-1 opacity-90">Anda akan diarahkan ke halaman verifikasi dalam 3 detik...</p>
              </div>
            </div>
          )}

          {/* Info Box */}
          {!success && (
            <div className="mb-6 p-4 rounded-lg border" style={{ background: 'rgba(200,169,110,0.08)', borderColor: 'rgba(200,169,110,0.2)', color: 'var(--color-gold-deep, #8a6a35)' }}>
              <p className="text-xs leading-relaxed">
                <strong>ℹ️ Informasi:</strong> Kami akan mengirimkan kode OTP 6 digit ke nomor WhatsApp Anda. Gunakan kode tersebut untuk membuat kata sandi baru.
              </p>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              
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
              </div>

              <button 
                type="submit" 
                disabled={loading || success}
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
                    Mengirim OTP...
                  </>
                ) : (
                  <>
                    <LockIcon className="h-4 w-4" />
                    Kirim OTP Reset
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-[rgba(200,169,110,0.15)]">
            <p className="text-xs text-center" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>
              Ingat kata sandi? <Link href="/auth/login" className="font-semibold underline" style={{ color: 'var(--color-gold-deep, #c8a96e)' }}>Masuk di sini</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}