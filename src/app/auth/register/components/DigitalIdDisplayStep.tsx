'use client';

import { useRegister } from '../RegisterProvider';
import { FONTS } from '../types';
import { PrimaryButton, SecondaryButton } from '../shared/StepHeader';
import { CheckCircle2Icon } from 'lucide-react';

export default function DigitalIdDisplayStep() {
  const { formData, setPhase } = useRegister();
  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ background: 'rgba(200,169,110,0.15)' }}>
          <CheckCircle2Icon className="h-6 w-6" style={{ color: 'var(--color-gold-deep, #c8a96e)' }} />
        </div>
        <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: FONTS.heading, color: 'var(--color-text-dark, #1a0e05)' }}>Digital ID Anda</h2>
        <p className="text-sm" style={{ fontFamily: FONTS.body, color: 'var(--color-stone-dark, #4a3c31)' }}>Selamat! Ini adalah identitas digital unik Anda di Paroki St. Klemens.</p>
      </div>

      <div className="p-6 rounded-lg border text-center" style={{ background: 'linear-gradient(135deg, rgba(200,169,110,0.1), rgba(200,169,110,0.2))', borderColor: 'rgba(200,169,110,0.3)' }}>
        <p className="text-xs font-medium mb-2" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>PIDU ID</p>
        <p className="text-2xl font-bold tracking-wider" style={{ fontFamily: FONTS.heading, color: 'var(--color-text-dark, #1a0e05)' }}>
          {formData.piduId || '6270-XXXXX'}
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <SecondaryButton onClick={() => setPhase('personal_data_verification')}>Kembali</SecondaryButton>
        <PrimaryButton onClick={() => setPhase('family_verification')}>Lanjutkan Verifikasi Keluarga</PrimaryButton>
      </div>
    </div>
  );
}