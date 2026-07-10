'use client';

import { useRegister } from '../RegisterProvider';
import { FONTS } from '../types';
import { PrimaryButton, SecondaryButton } from '../shared/StepHeader';
import { AlertCircleIcon, UserIcon } from 'lucide-react';

export default function NewUserStep() {
  const { formData, updateFormData, setPhase } = useRegister();
  const goAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setPhase('account_info');
  };
  return (
    <form onSubmit={goAccount} className="space-y-5">
      <div className="p-4 rounded-lg flex items-start gap-3 border" style={{ background: 'rgba(200,169,110,0.08)', borderColor: 'rgba(200,169,110,0.2)', color: 'var(--color-gold-deep, #8a6a35)' }}>
        <AlertCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-sm">Data belum ditemukan</p>
          <p className="text-xs mt-0.5 opacity-90">Silakan isi data diri Anda untuk membuat akun baru.</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>
          Nama Lengkap <span style={{ color: 'var(--color-error, #8b2635)' }}>*</span>
        </label>
        <div className="relative">
          <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--color-stone, #8b7355)' }} />
          <input type="text" value={formData.fullName} onChange={(e) => updateFormData({ fullName: e.target.value })} placeholder="Nama sesuai KK"
            className="w-full pl-11 pr-4 py-3 rounded-lg border transition-all"
            style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)', color: 'var(--color-text-dark, #1a0e05)' }} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <SecondaryButton onClick={() => setPhase('lookup')}>Kembali</SecondaryButton>
        <PrimaryButton type="submit" disabled={!formData.fullName}>Lanjut ke Info Akun</PrimaryButton>
      </div>
    </form>
  );
}