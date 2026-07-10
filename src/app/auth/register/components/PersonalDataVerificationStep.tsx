'use client';

import { useEffect, useState } from 'react';
import { useRegister } from '../RegisterProvider';
import { FONTS } from '../types';
import { PrimaryButton, SecondaryButton } from '../shared/StepHeader';
import { UserIcon, CheckCircle2Icon, AlertCircleIcon, Loader2Icon } from 'lucide-react';

interface FieldRow {
  key: string;
  label: string;
  value: string;
  verified: boolean;
  editing: boolean;
}

export default function PersonalDataVerificationStep() {
  const { formData, setPhase, setError, loading } = useRegister();
  const [rows, setRows] = useState<FieldRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setFetching(true);
      try {
        const res = await fetch('/api/auth/profile-data', { method: 'GET' });
        if (res.ok) {
          const json = await res.json();
          const p = json.profile || {};
          const initial: FieldRow[] = [
            { key: 'full_name', label: 'Nama Lengkap', value: p.full_name || formData.fullName || '', verified: false, editing: false },
            { key: 'nik', label: 'NIK', value: p.nik || '', verified: false, editing: false },
            { key: 'tanggal_lahir', label: 'Tanggal Lahir', value: p.tanggal_lahir || '', verified: false, editing: false },
            { key: 'tempat_lahir', label: 'Tempat Lahir', value: p.tempat_lahir || '', verified: false, editing: false },
            { key: 'alamat_lengkap', label: 'Alamat', value: p.alamat_lengkap || '', verified: false, editing: false },
            { key: 'jenis_kelamin', label: 'Jenis Kelamin', value: p.jenis_kelamin || '', verified: false, editing: false },
            { key: 'status_perkawinan', label: 'Status Perkawinan', value: p.status_perkawinan || '', verified: false, editing: false },
            { key: 'agama', label: 'Agama', value: p.agama || 'Katolik', verified: false, editing: false },
          ];
          setRows(initial);
        } else {
          setError('Gagal memuat data pribadi');
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setFetching(false);
      }
    }
    load();
  }, []);

  const toggleEdit = (key: string) => {
    setRows(prev => prev.map(r => r.key === key ? { ...r, editing: !r.editing } : r));
  };
  const setVal = (key: string, value: string) => {
    setRows(prev => prev.map(r => r.key === key ? { ...r, value } : r));
  };
  const markVerified = (key: string) => {
    setRows(prev => prev.map(r => r.key === key ? { ...r, verified: true, editing: false } : r));
  };

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const payload: any = {};
      for (const r of rows) {
        if (r.value !== '') payload[r.key] = r.value;
      }
      const res = await fetch('/api/auth/verify-personal-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Gagal menyimpan');
      setPhase('digital_id_display');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (fetching) {
    return (
      <div className="text-center py-10">
        <Loader2Icon className="h-8 w-8 animate-spin mx-auto" style={{ color: 'var(--color-gold-deep, #c8a96e)' }} />
        <p className="text-sm mt-3" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>Memuat data pribadi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ background: 'rgba(200,169,110,0.15)' }}>
          <UserIcon className="h-6 w-6" style={{ color: 'var(--color-gold-deep, #c8a96e)' }} />
        </div>
        <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: FONTS.heading, color: 'var(--color-text-dark, #1a0e05)' }}>Verifikasi Data Pribadi Detail</h2>
        <p className="text-sm" style={{ fontFamily: FONTS.body, color: 'var(--color-stone-dark, #4a3c31)' }}>Pastikan data di bawah ini sesuai dengan dokumen asli Anda (KTP/KK Dukcapil).</p>
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.key} className="p-3 rounded-lg border" style={{ background: 'var(--color-parchment, #f8f1e2)', borderColor: 'rgba(200,169,110,0.12)' }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>{r.label}</p>
              {r.verified && <CheckCircle2Icon className="h-4 w-4" style={{ color: 'var(--color-success, #4a8c5c)' }} />}
            </div>
            {r.editing ? (
              <input type="text" value={r.value} onChange={(e) => setVal(r.key, e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm" style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.3)', background: '#fff', color: 'var(--color-text-dark, #1a0e05)' }} />
            ) : (
              <p className="text-xs" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>{r.value || '—'}</p>
            )}
            <div className="flex gap-3 mt-2">
              {r.editing ? (
                <button type="button" onClick={() => markVerified(r.key)} className="text-xs font-semibold" style={{ color: 'var(--color-success, #4a8c5c)' }}>Simpan & Sesuai</button>
              ) : (
                <>
                  <button type="button" onClick={() => toggleEdit(r.key)} className="text-xs font-medium" style={{ color: 'var(--color-gold-deep, #c8a96e)' }}>Edit</button>
                  <button type="button" onClick={() => markVerified(r.key)} className="text-xs font-medium" style={{ color: 'var(--color-stone-dark, #4a3c31)' }}>Sesuai</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <SecondaryButton onClick={() => setPhase('benefits')}>Kembali</SecondaryButton>
        <PrimaryButton onClick={handleSave} disabled={saving || loading}>
          {saving ? (<><Loader2Icon className="h-4 w-4 animate-spin" />Menyimpan...</>) : 'Simpan & Lanjut ke Digital ID'}
        </PrimaryButton>
      </div>
    </div>
  );
}