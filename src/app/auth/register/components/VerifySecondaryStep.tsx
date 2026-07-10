'use client';

import { useRegister } from '../RegisterProvider';
import { FONTS } from '../types';
import { PrimaryButton, SecondaryButton } from '../shared/StepHeader';

export default function VerifySecondaryStep() {
  const { formData, updateFormData, handleVerifySecondary, loading, setPhase } = useRegister();
  if (!formData.selectedUmatStagingId || !formData.matchedUmatStagingData) return null;
  return (
    <form onSubmit={handleVerifySecondary} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: FONTS.heading, color: 'var(--color-text-dark, #1a0e05)' }}>Verifikasi Data</h2>
        <p className="text-sm" style={{ fontFamily: FONTS.body, color: 'var(--color-stone-dark, #4a3c31)' }}>Untuk memastikan ini benar-benar Anda, mohon masukkan tanggal lahir Anda.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>
          Nama Lengkap: <span className="font-semibold">{formData.matchedUmatStagingData.nama}</span>
        </label>
        {formData.matchedUmatStagingData.alamat && (
          <p className="text-sm mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-stone-dark, #4a3c31)' }}>Alamat: {formData.matchedUmatStagingData.alamat}</p>
        )}
        {formData.matchedUmatStagingData.tempat_lahir_dan_tanggal && (
          <p className="text-sm mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-stone-dark, #4a3c31)' }}>Tempat/Tgl Lahir: {formData.matchedUmatStagingData.tempat_lahir_dan_tanggal}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>
          Tanggal Lahir <span style={{ color: 'var(--color-error, #8b2635)' }}>*</span>
        </label>
        <input type="date" value={formData.tanggalLahirInput} onChange={(e) => updateFormData({ tanggalLahirInput: e.target.value })} required
          className="w-full pl-4 pr-4 py-3 rounded-lg border transition-all"
          style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)', color: 'var(--color-text-dark, #1a0e05)' }} />
      </div>

      <div className="flex gap-3 pt-2">
        <SecondaryButton onClick={() => setPhase('lookup')}>Kembali</SecondaryButton>
        <PrimaryButton type="submit" disabled={loading || !formData.tanggalLahirInput}>
          {loading ? 'Memverifikasi...' : 'Verifikasi & Lanjut'}
        </PrimaryButton>
      </div>
    </form>
  );
}