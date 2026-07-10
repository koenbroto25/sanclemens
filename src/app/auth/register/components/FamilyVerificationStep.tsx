'use client';

import { useState } from 'react';
import { useRegister } from '../RegisterProvider';
import { FONTS, normalizePhone } from '../types';
import { PrimaryButton, SecondaryButton } from '../shared/StepHeader';
import { UsersIcon, MessageCircleIcon, CheckCircle2Icon, Loader2Icon } from 'lucide-react';

interface MemberRow {
  id: string;
  full_name: string;
  phone: string;
  verified: boolean;
  send_invite: boolean;
  editing: boolean;
}

export default function FamilyVerificationStep() {
  const { formData, setPhase, setError } = useRegister();
  const [members, setMembers] = useState<MemberRow[]>(
    formData.familyMembers.map((m: any) => ({
      id: m.id,
      full_name: m.full_name || m.profiles?.full_name || '',
      phone: m.phone || m.profiles?.phone || '',
      verified: false,
      send_invite: false,
      editing: false,
    }))
  );
  const [saving, setSaving] = useState(false);

  const update = (id: string, fields: Partial<MemberRow>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...fields } : m));
  };

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-family-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: formData.matchedFamily?.id,
          members: members.map(m => ({ id: m.id, full_name: m.full_name, phone: m.phone, verified: m.verified, send_invite: m.send_invite })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Gagal menyimpan');
      setPhase('ai_matching');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ background: 'rgba(200,169,110,0.15)' }}>
          <UsersIcon className="h-6 w-6" style={{ color: 'var(--color-gold-deep, #c8a96e)' }} />
        </div>
        <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: FONTS.heading, color: 'var(--color-text-dark, #1a0e05)' }}>Verifikasi Anggota Keluarga</h2>
        <p className="text-sm" style={{ fontFamily: FONTS.body, color: 'var(--color-stone-dark, #4a3c31)' }}>Berdasarkan data KK Dukcapil, Anda terhubung dengan anggota keluarga berikut.</p>
      </div>

      {members.length > 0 ? (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="p-3 rounded-lg border" style={{ background: 'var(--color-parchment, #f8f1e2)', borderColor: 'rgba(200,169,110,0.12)' }}>
              {m.editing ? (
                <div className="space-y-2">
                  <input type="text" value={m.full_name} onChange={(e) => update(m.id, { full_name: e.target.value })} placeholder="Nama"
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.3)', background: '#fff', color: 'var(--color-text-dark, #1a0e05)' }} />
                  <input type="text" value={m.phone} onChange={(e) => update(m.id, { phone: e.target.value })} placeholder="Nomor WhatsApp"
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.3)', background: '#fff', color: 'var(--color-text-dark, #1a0e05)' }} />
                  <button type="button" onClick={() => update(m.id, { editing: false, verified: true })} className="text-xs font-semibold" style={{ color: 'var(--color-success, #4a8c5c)' }}>Simpan</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>{m.full_name}</p>
                      <p className="text-xs" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>{m.phone ? normalizePhone(m.phone) : 'Belum ada nomor WA'}</p>
                    </div>
                    {m.verified && <CheckCircle2Icon className="h-4 w-4" style={{ color: 'var(--color-success, #4a8c5c)' }} />}
                  </div>
                  <div className="flex gap-3 mt-2 flex-wrap">
                    <button type="button" onClick={() => update(m.id, { editing: true })} className="text-xs font-medium" style={{ color: 'var(--color-gold-deep, #c8a96e)' }}>Edit</button>
                    <button type="button" onClick={() => update(m.id, { verified: true })} className="text-xs font-medium" style={{ color: 'var(--color-stone-dark, #4a3c31)' }}>Sesuai</button>
                    <label className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--color-info, #2573b0)' }}>
                      <input type="checkbox" checked={m.send_invite} onChange={(e) => update(m.id, { send_invite: e.target.checked })} /> Share via WA
                    </label>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-center py-4" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>Tidak ada anggota keluarga lain yang terdeteksi dalam KK ini.</p>
      )}

      <div className="flex gap-3 pt-2">
        <SecondaryButton onClick={() => setPhase('digital_id_display')}>Kembali</SecondaryButton>
        <PrimaryButton onClick={handleSave} disabled={saving}>
          {saving ? (<><Loader2Icon className="h-4 w-4 animate-spin" />Menyimpan...</>) : 'Simpan & Lanjut'}
        </PrimaryButton>
      </div>
    </div>
  );
}