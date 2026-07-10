'use client';

import { useRegister } from '../RegisterProvider';
import { FONTS } from '../types';
import { PrimaryButton } from '../shared/StepHeader';
import { SearchIcon, UserIcon } from 'lucide-react';

export default function LookupStep() {
  const { formData, updateFormData, handleLookup, loading } = useRegister();
  return (
    <form onSubmit={handleLookup} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: FONTS.heading, color: 'var(--color-text-dark, #1a0e05)' }}>Cek Data Keluarga</h2>
        <p className="text-sm" style={{ fontFamily: FONTS.body, color: 'var(--color-stone-dark, #4a3c31)' }}>Apakah data Anda sudah terdaftar di database paroki?</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>
          Nomor Kartu Keluarga <span className="text-xs font-normal" style={{ color: 'var(--color-stone, #8b7355)' }}>(Opsional)</span>
        </label>
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--color-stone, #8b7355)' }} />
          <input type="text" value={formData.nomorKk} onChange={(e) => updateFormData({ nomorKk: e.target.value })}
            placeholder="Contoh: 64.12.01.xxxxx" className="w-full pl-11 pr-4 py-3 rounded-lg border transition-all"
            style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)', color: 'var(--color-text-dark, #1a0e05)' }} />
        </div>
        <p className="text-xs mt-1.5 flex items-start gap-1.5" style={{ color: 'var(--color-stone, #8b7355)' }}>
          <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <span>Masukkan nomor KK dari dokumen kependudukan. Jika dimasukkan, sistem akan otomatis menemukan data keluarga Anda.</span>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>
          Nama Lengkap <span style={{ color: 'var(--color-error, #8b2635)' }}>*</span>
        </label>
        <div className="relative">
          <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--color-stone, #8b7355)' }} />
          <input type="text" value={formData.namaLookup} onChange={(e) => updateFormData({ namaLookup: e.target.value })}
            placeholder="Nama sesuai KK" required className="w-full pl-11 pr-4 py-3 rounded-lg border transition-all"
            style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)', color: 'var(--color-text-dark, #1a0e05)' }} />
        </div>
      </div>

      <PrimaryButton type="submit" disabled={loading}>
        {loading ? 'Mencari...' : 'Cek Database'}
      </PrimaryButton>
    </form>
  );
}