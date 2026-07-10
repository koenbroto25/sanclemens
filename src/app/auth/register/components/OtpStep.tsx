'use client';

import { useRegister } from '../RegisterProvider';
import { FONTS, normalizePhone } from '../types';
import { PrimaryButton } from '../shared/StepHeader';
import { MailIcon, AlertCircleIcon, Loader2Icon } from 'lucide-react';

export default function OtpStep() {
  const { formData, updateFormData, handleVerifyOtp, loading, error, otpCountdown, resendOtpHandler } = useRegister();
  const currentPhone = formData.phone || (formData.matchedUmatStagingData ? formData.matchedUmatStagingData.phone : '');
  return (
    <form onSubmit={handleVerifyOtp} className="space-y-5">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ background: 'rgba(200,169,110,0.15)' }}>
          <MailIcon className="h-6 w-6" style={{ color: 'var(--color-gold-deep, #c8a96e)' }} />
        </div>
        <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: FONTS.heading, color: 'var(--color-text-dark, #1a0e05)' }}>Verifikasi WhatsApp</h2>
        <p className="text-sm" style={{ fontFamily: FONTS.body, color: 'var(--color-stone-dark, #4a3c31)' }}>
          Kode OTP telah dikirim ke <strong>{normalizePhone(currentPhone).slice(0, 4)}****{normalizePhone(currentPhone).slice(-4)}</strong>
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg flex items-start gap-2 border text-sm" style={{ background: 'rgba(139,38,53,0.08)', borderColor: 'rgba(139,38,53,0.2)', color: 'var(--color-error, #8b2635)' }}>
          <AlertCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5 text-center" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>Kode OTP</label>
        <input type="text" value={formData.otp} onChange={(e) => updateFormData({ otp: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="______" maxLength={6}
          className="w-full px-4 py-4 rounded-lg border text-center tracking-widest text-lg font-semibold transition-all"
          style={{ fontFamily: FONTS.heading, borderColor: 'rgba(200,169,110,0.3)', background: 'var(--color-parchment, #f8f1e2)', color: 'var(--color-text-dark, #1a0e05)', letterSpacing: '0.5em' }} />
      </div>

      <PrimaryButton type="submit" disabled={loading || formData.otp.length !== 6}>
        {loading ? (<><Loader2Icon className="h-4 w-4 animate-spin" />Memverifikasi...</>) : 'Verifikasi'}
      </PrimaryButton>

      {otpCountdown > 0 && (<p className="text-xs text-center" style={{ color: 'var(--color-stone, #8b7355)' }}>Kirim ulang dalam {otpCountdown} detik</p>)}
      {otpCountdown === 0 && (
        <button type="button" onClick={resendOtpHandler} disabled={loading} className="w-full text-sm font-medium transition-colors" style={{ color: 'var(--color-gold-deep, #c8a96e)' }}>Kirim Ulang OTP</button>
      )}
    </form>
  );
}