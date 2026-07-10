'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyOtpPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main registration page as OTP verification is handled there.
    router.replace('/auth/register');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg relative z-10 text-center">
        <h1 className="text-2xl font-semibold mb-4">Mengarahkan...</h1>
        <p className="text-sm text-gray-600">Anda akan diarahkan ke halaman pendaftaran utama.</p>
      </div>
    </div>
  );
}