'use client';

import Link from 'next/link';
import { RegisterProvider, useRegister } from './RegisterProvider';
import { FONTS } from './types';
import { AlertCircleIcon, UserPlusIcon, HomeIcon, LogInIcon } from 'lucide-react';

import LookupStep from './components/LookupStep';
import SuggestionsStep from './components/SuggestionsStep';
import VerifySecondaryStep from './components/VerifySecondaryStep';
import NewUserStep from './components/NewUserStep';
import AccountInfoStep from './components/AccountInfoStep';
import OtpStep from './components/OtpStep';
import BenefitsStep from './components/BenefitsStep';
import PersonalDataVerificationStep from './components/PersonalDataVerificationStep';
import DigitalIdDisplayStep from './components/DigitalIdDisplayStep';
import FamilyVerificationStep from './components/FamilyVerificationStep';
import AiMatchingStep from './components/AiMatchingStep';
import SuccessStep from './components/SuccessStep';

function StepRouter() {
  const { phase } = useRegister();
  switch (phase) {
    case 'lookup': return <LookupStep />;
    case 'suggestions': return <SuggestionsStep />;
    case 'verify_secondary': return <VerifySecondaryStep />;
    case 'new': return <NewUserStep />;
    case 'account_info': return <AccountInfoStep />;
    case 'otp': return <OtpStep />;
    case 'benefits': return <BenefitsStep />;
    case 'personal_data_verification': return <PersonalDataVerificationStep />;
    case 'digital_id_display': return <DigitalIdDisplayStep />;
    case 'family_verification': return <FamilyVerificationStep />;
    case 'ai_matching': return <AiMatchingStep />;
    case 'success': return <SuccessStep />;
    default: return <LookupStep />;
  }
}

function RegisterShell() {
  const { error } = useRegister();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(to bottom, var(--color-parchment, #f8f1e2), var(--color-cream, #f5f0e8))' }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, var(--color-gold, #c8a96e), transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, var(--color-glass-red, #8b2635), transparent)' }} />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="flex items-center justify-between mb-8">
          <Link href="/public" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/60 hover:bg-white border border-[rgba(200,169,110,0.2)] text-sm font-medium transition-all" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>
            <HomeIcon className="h-4 w-4" style={{ color: 'var(--color-gold-deep, #c8a96e)' }} /> Beranda
          </Link>
          <Link href="/auth/login" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-white/60 border border-transparent hover:border-[rgba(200,169,110,0.2)] text-sm font-medium transition-all" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>
            <LogInIcon className="h-4 w-4" /> Login
          </Link>
        </div>

        <div className="rounded-2xl border border-[rgba(200,169,110,0.15)] p-8 md:p-10" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', borderRadius: '4px 28px 4px 28px', boxShadow: '0 12px 40px rgba(26,14,5,0.08)' }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: 'linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.25))', border: '2px solid var(--color-gold, #c8a96e)' }}>
              <UserPlusIcon className="h-8 w-8" style={{ color: 'var(--color-gold-deep, #c8a96e)' }} />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold mb-2" style={{ fontFamily: FONTS.heading, color: 'var(--color-text-dark, #1a0e05)' }}>Pendaftaran Akun Digital</h1>
            <p className="text-sm" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>Bergabung dengan ekosistem digital Paroki Santo Klemens Sepinggan</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg flex items-start gap-3 border" style={{ background: 'rgba(139,38,53,0.08)', borderColor: 'rgba(139,38,53,0.2)', color: 'var(--color-error, #8b2635)' }}>
              <AlertCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <StepRouter />
        </div>

        <div className="text-center mt-6">
          <p className="text-xs" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>
            Dengan mendaftar, Anda menyetujui <Link href="#" className="underline hover:text-[var(--color-gold-deep)]">Kebijakan Privasi</Link> dan <Link href="#" className="underline hover:text-[var(--color-gold-deep)]">Syarat & Ketentuan</Link> kami.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <RegisterProvider>
      <RegisterShell />
    </RegisterProvider>
  );
}