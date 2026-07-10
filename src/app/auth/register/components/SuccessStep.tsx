'use client';

import { useRouter } from 'next/navigation';
import { FONTS } from '../types';
import { PrimaryButton, SecondaryButton } from '../shared/StepHeader';
import { CheckCircle2Icon, HomeIcon, LogInIcon } from 'lucide-react';

export default function SuccessStep() {
  const router = useRouter();
  return (
    <div className="space-y-5">
      <div className="p-5 rounded-lg flex items-start gap-4 border" style={{ background: 'rgba(74,140,92,0.08)', borderColor: 'rgba(74,140,92,0.2)', color: 'var(--color-success, #4a8c5c)' }}>
        <CheckCircle2Icon className="h-6 w-6 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-bold text-base" style={{ fontFamily: FONTS.heading }}>Pendaftaran Berhasil!</p>
          <p className="text-sm mt-1 opacity-90">Anda dapat login menggunakan nomor WhatsApp dan kata sandi yang didaftarkan.</p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <SecondaryButton onClick={() => router.push('/public')}>
          <span className="inline-flex items-center justify-center gap-2"><HomeIcon className="h-4 w-4" />Beranda</span>
        </SecondaryButton>
        <PrimaryButton onClick={() => router.push('/auth/login')}>
          <span className="inline-flex items-center justify-center gap-2"><LogInIcon className="h-4 w-4" />Login</span>
        </PrimaryButton>
      </div>
    </div>
  );
}