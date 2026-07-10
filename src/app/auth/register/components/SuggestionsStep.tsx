'use client';

import { useRegister } from '../RegisterProvider';
import { FONTS } from '../types';
import { PrimaryButton, SecondaryButton } from '../shared/StepHeader';
import { AlertCircleIcon } from 'lucide-react';

export default function SuggestionsStep() {
  const { formData, updateFormData, setPhase } = useRegister();
  return (
    <div className="space-y-5">
      <div className="p-4 rounded-lg flex items-start gap-3 border" style={{ background: 'rgba(200,169,110,0.08)', borderColor: 'rgba(200,169,110,0.2)', color: 'var(--color-gold-deep, #8a6a35)' }}>
        <AlertCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-sm">Data tidak ditemukan secara persis</p>
          <p className="text-xs mt-0.5 opacity-90">{formData.suggestionMessage}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>Pilih salah satu:</p>
        {formData.suggestions.map((s) => (
          <div key={s.id} className="p-3 rounded-lg border flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(200,169,110,0.2)' }}>
            <div>
              <p className="text-sm font-semibold" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>{s.nama}</p>
              <p className="text-xs" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>
                {s.hubungan_keluarga} {s.alamat ? `· ${s.alamat}` : ''} {s.tempat_lahir_dan_tanggal ? `· ${s.tempat_lahir_dan_tanggal}` : ''}
              </p>
            </div>
            <button type="button" onClick={() => { updateFormData({ selectedUmatStagingId: s.id, matchedUmatStagingData: s }); setPhase('verify_secondary'); }}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg, #dfc493, var(--color-gold, #c8a96e))', color: 'var(--color-primary, #1a0e05)' }}>Pilih</button>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <SecondaryButton onClick={() => setPhase('lookup')}>Kembali</SecondaryButton>
        <PrimaryButton onClick={() => { setPhase('new'); updateFormData({ fullName: formData.namaLookup, phone: '', username: '', password: '', confirmPassword: '' }); }}>Bukan Saya, Daftar Baru</PrimaryButton>
      </div>
    </div>
  );
}