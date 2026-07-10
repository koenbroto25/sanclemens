'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PhoneCallIcon, Loader2Icon } from 'lucide-react';

export default function RequestOTPPage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  function normalizePhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const normalizedPhone = normalizePhone(phone);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengirim OTP');
      }

      // Store phone in sessionStorage for verify page
      sessionStorage.setItem('phone', normalizedPhone);
      
      // Redirect to verify page
      router.push('/auth/verify-otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-semibold text-primary">
          Masuk dengan WhatsApp
        </h1>
        <p className="text-text-secondary mt-2">
          Masukkan nomor WhatsApp Anda untuk menerima kode OTP
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl shadow-sm border border-border p-6 space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-error-wash text-error text-sm border border-error/20">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-1">
            Nomor WhatsApp
          </label>
          <div className="relative">
            <PhoneCallIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-bg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          <p className="text-xs text-text-tertiary mt-1">
            Contoh: 0812xxxx atau +62812xxxx
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || countdown > 0}
          className="w-full py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-light transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2Icon className="h-5 w-5 animate-spin" />
              Mengirim...
            </>
          ) : countdown > 0 ? (
            `Coba lagi dalam ${countdown} detik`
          ) : (
            'Kirim OTP'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-text-tertiary">
        Belum punya akun?{' '}
        <Link href="/auth/register" className="text-primary font-medium hover:underline">
          Daftar di sini
        </Link>
      </p>
    </div>
  );
}