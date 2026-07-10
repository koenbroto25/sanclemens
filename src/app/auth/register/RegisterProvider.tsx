'use client';

import { createContext, useContext, useState, ReactNode, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RegisterFormData, RegistrationPhase, normalizePhone } from './types';

interface RegisterContextValue {
  phase: RegistrationPhase;
  setPhase: (p: RegistrationPhase) => void;
  loading: boolean;
  error: string;
  setError: (e: string) => void;
  formData: RegisterFormData;
  updateFormData: (fields: Partial<RegisterFormData>) => void;
  otpCountdown: number;
  handleLookup: (e: FormEvent) => Promise<void>;
  handleVerifySecondary: (e: FormEvent) => Promise<void>;
  handleAccountInfoSubmit: (e: FormEvent) => Promise<void>;
  handleVerifyOtp: (e: FormEvent) => Promise<void>;
  resendOtpHandler: () => Promise<void>;
  sendOtpForRegistration: (regPhone: string, regFullName: string, regPassword: string, regUsername?: string, regFamilyId?: string, umatStagingId?: string | null) => Promise<void>;
}

const RegisterContext = createContext<RegisterContextValue | null>(null);

export function useRegister() {
  const ctx = useContext(RegisterContext);
  if (!ctx) throw new Error('useRegister must be used within RegisterProvider');
  return ctx;
}

const initialFormData: RegisterFormData = {
  nomorKk: '',
  namaLookup: '',
  tanggalLahirInput: '',
  fullName: '',
  phone: '',
  username: '',
  password: '',
  confirmPassword: '',
  otp: '',
  piduId: '',
  matchedFamily: null,
  matchedUmatStagingData: null,
  selectedUmatStagingId: null,
  familyMembers: [],
  suggestions: [],
  suggestionMessage: '',
};

export function RegisterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [phase, setPhase] = useState<RegistrationPhase>('lookup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<RegisterFormData>(initialFormData);
  const [otpCountdown, setOtpCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0 && phase === 'otp') {
      timer = setTimeout(() => setOtpCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown, phase]);

  const updateFormData = (fields: Partial<RegisterFormData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const currentPhone = formData.phone || (formData.matchedUmatStagingData ? formData.matchedUmatStagingData.phone : '');
  const currentFullName = formData.fullName || (formData.matchedUmatStagingData ? formData.matchedUmatStagingData.nama : '');
  const currentPassword = formData.password;
  const currentUsername = formData.username;

  async function handleVerifySecondary(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!formData.selectedUmatStagingId || !formData.tanggalLahirInput) {
      setError('ID profil dan tanggal lahir harus diisi untuk verifikasi.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/verify-profile-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          umatStagingId: formData.selectedUmatStagingId,
          tanggalLahir: formData.tanggalLahirInput,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Verifikasi tanggal lahir gagal');
      setPhase('account_info');
      updateFormData({
        fullName: formData.matchedUmatStagingData?.nama || '',
        phone: formData.matchedUmatStagingData?.phone || '',
        password: '',
        confirmPassword: '',
        username: '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/check-kk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomor_kk_gereja: formData.nomorKk, nama_lengkap: formData.namaLookup }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal cek database');

      if (json.found && json.families && json.families.length > 0) {
        const fam = json.families[0];
        const kepalaKeluargaUmatStaging = json.anggota.find((member: any) => member.hubungan_keluarga === 'Kepala Keluarga');
        const selectedUmat = kepalaKeluargaUmatStaging || json.anggota[0];
        updateFormData({
          matchedFamily: fam,
          matchedUmatStagingData: selectedUmat,
          selectedUmatStagingId: selectedUmat?.id || null,
          fullName: selectedUmat?.nama || '',
          phone: (fam.profiles && fam.profiles[0] ? fam.profiles[0].phone : '') || '',
          password: '',
          confirmPassword: '',
          username: '',
          tanggalLahirInput: '',
        });
        setPhase('verify_secondary');
      } else if (json.suggestions && json.suggestions.length > 0) {
        updateFormData({ suggestions: json.suggestions, suggestionMessage: json.message || 'Apakah salah satu ini Anda?' });
        setPhase('suggestions');
      } else {
        setPhase('new');
        updateFormData({ fullName: formData.namaLookup, phone: '', username: '', password: '', confirmPassword: '' });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function sendOtpForRegistration(regPhone: string, regFullName: string, regPassword: string, regUsername?: string, regFamilyId?: string, umatStagingId?: string | null) {
    const normalized = normalizePhone(regPhone);
    const res = await fetch('/api/auth/send-registration-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalized, fullName: regFullName, password: regPassword, username_wd: regUsername, familyId: regFamilyId, umatStagingId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal mengirim OTP');
    updateFormData({ otp: '' });
    setOtpCountdown(60);
  }

  async function handleAccountInfoSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const phoneToRegister = formData.phone;
    const fullNameToRegister = formData.fullName;
    const passwordToRegister = formData.password;
    const confirmPasswordToRegister = formData.confirmPassword;
    const usernameToRegister = formData.username;
    if (!fullNameToRegister || !phoneToRegister || !passwordToRegister) {
      setError('Nama, nomor WhatsApp, dan kata sandi harus diisi');
      return;
    }
    if (passwordToRegister !== confirmPasswordToRegister) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }
    setLoading(true);
    try {
      await sendOtpForRegistration(phoneToRegister, fullNameToRegister, passwordToRegister, usernameToRegister, formData.matchedFamily?.id, formData.selectedUmatStagingId);
      setPhase('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizePhone(currentPhone), otp: formData.otp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Verifikasi OTP gagal');

      // Ambil pidu_id dari profil
      const prof = json.user;
      if (prof?.pidu_id) updateFormData({ piduId: prof.pidu_id });

      if (formData.matchedFamily?.id) {
        const memRes = await fetch('/api/auth/family-members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ familyId: formData.matchedFamily.id }),
        });
        const memJson = await memRes.json();
        if (memRes.ok) updateFormData({ familyMembers: memJson.members || [] });
      }
      setPhase('benefits');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resendOtpHandler() {
    setLoading(true);
    setError('');
    try {
      await sendOtpForRegistration(currentPhone, currentFullName, currentPassword, currentUsername, formData.matchedFamily?.id, formData.selectedUmatStagingId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const value: RegisterContextValue = {
    phase, setPhase, loading, error, setError, formData, updateFormData, otpCountdown,
    handleLookup, handleVerifySecondary, handleAccountInfoSubmit, handleVerifyOtp, resendOtpHandler, sendOtpForRegistration,
  };

  return <RegisterContext.Provider value={value}>{children}</RegisterContext.Provider>;
}