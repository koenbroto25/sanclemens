'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LockIcon, 
  Loader2Icon, 
  AlertCircleIcon,
  CheckCircle2Icon,
  HomeIcon,
  KeyRoundIcon
} from 'lucide-react';

const FONTS = {
  heading: "'Cormorant Garamond', Georgia, serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Get phone from sessionStorage
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('resetPhone') : null;
    if (!stored) {
      setError('Sesi reset kadaluarsa. Silakan kembali ke halaman lupa kata sandi.');
    } else {
      setPhone(stored);
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Kata sandi baru dan konfirmasi harus diisi');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }

    if (newPassword.length < 8) {
      setError('Kata sandi minimal 8 karakter');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          otp, 
          newPassword 
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal reset kata sandi');
      }

      setSuccess(true);
      sessionStorage.removeItem('resetPhone');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setLoading(true);
    setError('');
    setCanResend(false);
    setCountdown(60);

    try {
      const res = await fetch('/api/auth/send-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal mengirim ulang OTP');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!phone && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(to bottom, var(--color-parchment, #f8f1e2), var(--color-cream, #f5f0e8))' }}>
        <div className="text-center">
          <Loader2Icon className="h-12 w-12 animate-spin mx-auto" style={{ color: 'var(--color-gold, #c8a96e)' }} />
        </div>
      </div>
    );
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
          {!success && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: 'linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.25))', border: '2px solid var(--color-gold, #c8a96e)' }}>
                <KeyRoundIcon className="h-8 w-8" style={{ color: 'var(--color-gold-deep, #c8a96e)' }} />
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold mb-2" style={{ fontFamily: FONTS.heading, color: 'var(--color-text-dark, #1a0e05)' }}>
                Reset Kata Sandi
              </h1>
              <p className="text-sm" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>
                Buat kata sandi baru untuk akun Anda
              </p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-lg flex items-start gap-3 border" style={{ background: 'rgba(139,38,53,0.08)', borderColor: 'rgba(139,38,53,0.2)', color: 'var(--color-error, #8b2635)' }}>
              <AlertCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-6 p-5 rounded-lg flex items-start gap-4 border" style={{ background: 'rgba(74,140,92,0.08)', borderColor: 'rgba(74,140,92,0.2)', color: 'var(--color-success, #4a8c5c)' }}>
              <CheckCircle2Icon className="h-6 w-6 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-base" style={{ fontFamily: FONTS.heading }}>Kata Sandi Berhasil Diubah!</p>
                <p className="text-sm mt-1 opacity-90">Anda akan diarahkan ke halaman login dalam 3 detik...</p>
              </div>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>
                  Kode OTP <span style={{ color: 'var(--color-error, #8b2635)' }}>*</span>
                </label>
                <input 
                  type="text" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="______"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg border text-center tracking-widest text-lg font-semibold transition-all"
                  style={{ fontFamily: FONTS.heading, borderColor: 'rgba(200,169,110,0.3)', background: 'var(--color-parchment, #f8f1e2)', color: 'var(--color-text-dark, #1a0e05)', letterSpacing: '0.5em' }}
                />
                <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--color-stone, #8b7355)' }}>
                  Kode berlaku 5 menit
                </p>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>
                  Kata Sandi Baru <span style={{ color: 'var(--color-error, #8b2635)' }}>*</span>
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--color-stone, #8b7355)' }} />
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border transition-all"
                    style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)', color: 'var(--color-text-dark, #1a0e05)' }}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>
                  Konfirmasi Kata Sandi <span style={{ color: 'var(--color-error, #8b2635)' }}>*</span>
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--color-stone, #8b7355)' }} />
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border transition-all"
                    style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)', color: 'var(--color-text-dark, #1a0e05)' }}
                  />
                </div>
              </div>

              {/* Resend OTP */}
              <p className="text-center text-sm" style={{ color: 'var(--color-stone, #8b7355)' }}>
                Tidak menerima kode?{' '}
                {canResend ? (
                  <button 
                    type="button"
                    onClick={handleResendOtp} 
                    disabled={loading}
                    className="font-medium transition-colors" 
                    style={{ color: 'var(--color-gold-deep, #c8a96e)' }}
                  >
                    Kirim Ulang OTP
                  </button>
                ) : (
                  <span>Kirim ulang dalam {countdown} detik</span>
                )}
              </p>

              <button 
                type="submit" 
                disabled={loading || success || otp.length !== 6}
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
                    Memproses...
                  </>
                ) : (
                  <>
                    <LockIcon className="h-4 w-4" />
                    Reset Kata Sandi
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          {!success && (
            <div className="mt-6 pt-6 border-t border-[rgba(200,169,110,0.15)]">
              <p className="text-xs text-center" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>
                Ingat kata sandi? <Link href="/auth/login" className="font-semibold underline" style={{ color: 'var(--color-gold-deep, #c8a96e)' }}>Masuk di sini</Link>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}