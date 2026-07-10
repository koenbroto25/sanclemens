'use client';

import { useRegister } from '../RegisterProvider';
import { FONTS } from '../types';
import { PrimaryButton, SecondaryButton } from '../shared/StepHeader';
import { PhoneCallIcon, UserIcon, LockIcon } from 'lucide-react';

export default function AccountInfoStep() {
  const { formData, updateFormData, handleAccountInfoSubmit, loading, setPhase } = useRegister();
  const isExisting = !!formData.matchedUmatStagingData;
  return (
    <form onSubmit={handleAccountInfoSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: FONTS.heading, color: 'var(--color-text-dark, #1a0e05)' }}>Info Akun</h2>
        <p className="text-sm" style={{ fontFamily: FONTS.body, color: 'var(--color-stone-dark, #4a3c31)' }}>Silakan lengkapi detail akun Anda.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>Nama Lengkap</label>
        <input type="text" value={formData.fullName} onChange={(e) => updateFormData({ fullName: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border transition-all" readOnly={isExisting} disabled={isExisting}
          style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)', color: 'var(--color-text-dark, #1a0e05)' }} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>
          Nomor WhatsApp <span style={{ color: 'var(--color-error, #8b2635)' }}>*</span>
        </label>
        <div className="relative">
          <PhoneCallIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--color-stone, #8b7355)' }} />
          <input type="tel" value={formData.phone} onChange={(e) => updateFormData({ phone: e.target.value })} placeholder="08xxxxxxxxxx"
            className="w-full pl-11 pr-4 py-3 rounded-lg border transition-all" required
            style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)', color: 'var(--color-text-dark, #1a0e05)' }} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>Username (Opsional)</label>
        <div className="relative">
          <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--color-stone, #8b7355)' }} />
          <input type="text" value={formData.username} onChange={(e) => updateFormData({ username: e.target.value })} placeholder="Contoh: klemens_sepinggan"
            className="w-full pl-11 pr-4 py-3 rounded-lg border transition-all"
            style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)', color: 'var(--color-text-dark, #1a0e05)' }} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>
          Kata Sandi <span style={{ color: 'var(--color-error, #8b2635)' }}>*</span>
        </label>
        <div className="relative">
          <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--color-stone, #8b7355)' }} />
          <input type="password" value={formData.password} onChange={(e) => updateFormData({ password: e.target.value })} placeholder="Minimal 8 karakter"
            className="w-full pl-11 pr-4 py-3 rounded-lg border transition-all" required
            style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)', color: 'var(--color-text-dark, #1a0e05)' }} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>
          Konfirmasi Kata Sandi <span style={{ color: 'var(--color-error, #8b2635)' }}>*</span>
        </label>
        <div className="relative">
          <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--color-stone, #8b7355)' }} />
          <input type="password" value={formData.confirmPassword} onChange={(e) => updateFormData({ confirmPassword: e.target.value })} placeholder="Ulangi kata sandi"
            className="w-full pl-11 pr-4 py-3 rounded-lg border transition-all" required
            style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)', color: 'var(--color-text-dark, #1a0e05)' }} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <SecondaryButton onClick={() => setPhase(formData.selectedUmatStagingId ? 'verify_secondary' : 'lookup')}>Kembali</SecondaryButton>
        <PrimaryButton type="submit" disabled={loading || !formData.phone || !formData.password || !formData.confirmPassword}>Kirim OTP & Daftar</PrimaryButton>
      </div>
    </form>
  );
}