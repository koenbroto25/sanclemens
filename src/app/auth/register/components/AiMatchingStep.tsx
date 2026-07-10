'use client';

import { useState } from 'react';
import { useRegister } from '../RegisterProvider';
import { FONTS } from '../types';
import { PrimaryButton, SecondaryButton } from '../shared/StepHeader';
import { MessageCircleIcon, Loader2Icon, CheckCircle2Icon } from 'lucide-react';

const skillOptions = ['Desain Grafis', 'Pemrograman', 'Konseling', 'Memasak', 'Akuntansi', 'Marketing', 'Pendinginan', 'Guru/Lesson', 'Teknisi', 'Videografi', 'Penulis', 'Translator'];
const ministryOptions = ['Katekese', 'Liturgi', 'Sosial', 'Koor', 'OMK', 'TPK', 'KDK', 'Wilayah'];

export default function AiMatchingStep() {
  const { setPhase } = useRegister();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pekerjaan: '',
    bidang_industri: '',
    keahlian: [] as string[],
    minat_pelayanan: [] as string[],
    link_portofolio: '',
    ketersediaan_charity: false,
    preferensi_lokasi: '',
    business_category: '',
    has_delivery: false,
    charity_discount: false,
  });

  const toggleArr = (field: 'keahlian' | 'minat_pelayanan', val: string) => {
    setForm(prev => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  };

  async function handleSubmit() {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/ai-matching-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Gagal menyimpan');
      setPhase('success');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!showForm) {
    return (
      <div className="space-y-5">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ background: 'rgba(200,169,110,0.15)' }}>
            <MessageCircleIcon className="h-6 w-6" style={{ color: 'var(--color-gold-deep, #c8a96e)' }} />
          </div>
          <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: FONTS.heading, color: 'var(--color-text-dark, #1a0e05)' }}>Fitur AI Matching</h2>
          <p className="text-sm" style={{ fontFamily: FONTS.body, color: 'var(--color-stone-dark, #4a3c31)' }}>Menghubungkan Anda di Paroki berdasarkan keahlian, minat, atau kebutuhan.</p>
        </div>
        <div className="space-y-3">
          <div className="p-3 rounded-lg border" style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(200,169,110,0.2)' }}>
            <p className="text-sm font-semibold mb-1" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>Business Matching</p>
            <p className="text-xs" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>Cari supplier, jasa, produk via chat.</p>
          </div>
          <div className="p-3 rounded-lg border" style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(200,169,110,0.2)' }}>
            <p className="text-sm font-semibold mb-1" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>Charity Matching</p>
            <p className="text-xs" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>Volunteer medis/guru/teknis bisa membantu umat butuh.</p>
          </div>
          <div className="p-3 rounded-lg border" style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(200,169,110,0.2)' }}>
            <p className="text-sm font-semibold mb-1" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>Skill Exchange</p>
            <p className="text-xs" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>Barter jasa tanpa uang.</p>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <SecondaryButton onClick={() => setPhase('family_verification')}>Kembali</SecondaryButton>
          <PrimaryButton onClick={() => setPhase('success')}>Lewati (Bisa Diisi Nanti)</PrimaryButton>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="w-full text-sm font-semibold" style={{ color: 'var(--color-gold-deep, #c8a96e)' }}>Ya, Isi Data Sekarang</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: FONTS.heading, color: 'var(--color-text-dark, #1a0e05)' }}>Isi Data untuk AI Matching</h2>
        <p className="text-sm" style={{ fontFamily: FONTS.body, color: 'var(--color-stone-dark, #4a3c31)' }}>Lengkapi informasi agar AI menemukan koneksi relevan.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>Pekerjaan / Profesi</label>
        <input type="text" value={form.pekerjaan} onChange={(e) => setForm({ ...form, pekerjaan: e.target.value })} placeholder="Contoh: Guru, Programmer"
          className="w-full px-3 py-2 rounded-lg border text-sm" style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.3)', background: '#fff', color: 'var(--color-text-dark, #1a0e05)' }} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>Bidang Industri / Bisnis</label>
        <input type="text" value={form.bidang_industri} onChange={(e) => setForm({ ...form, bidang_industri: e.target.value })} placeholder="Pisahkan dengan koma"
          className="w-full px-3 py-2 rounded-lg border text-sm" style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.3)', background: '#fff', color: 'var(--color-text-dark, #1a0e05)' }} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>Keahlian Khusus</label>
        <div className="flex flex-wrap gap-2">
          {skillOptions.map(s => (
            <button key={s} type="button" onClick={() => toggleArr('keahlian', s)}
              className="px-2.5 py-1 rounded-full text-xs border"
              style={{ borderColor: form.keahlian.includes(s) ? 'var(--color-gold-deep, #c8a96e)' : 'rgba(200,169,110,0.3)', background: form.keahlian.includes(s) ? 'rgba(200,169,110,0.15)' : 'transparent', color: 'var(--color-stone-dark, #4a3c31)' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>Minat Pelayanan di Paroki</label>
        <div className="flex flex-wrap gap-2">
          {ministryOptions.map(s => (
            <button key={s} type="button" onClick={() => toggleArr('minat_pelayanan', s)}
              className="px-2.5 py-1 rounded-full text-xs border"
              style={{ borderColor: form.minat_pelayanan.includes(s) ? 'var(--color-gold-deep, #c8a96e)' : 'rgba(200,169,110,0.3)', background: form.minat_pelayanan.includes(s) ? 'rgba(200,169,110,0.15)' : 'transparent', color: 'var(--color-stone-dark, #4a3c31)' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>Link Portofolio / LinkedIn (Opsional)</label>
        <input type="url" value={form.link_portofolio} onChange={(e) => setForm({ ...form, link_portofolio: e.target.value })} placeholder="https://"
          className="w-full px-3 py-2 rounded-lg border text-sm" style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.3)', background: '#fff', color: 'var(--color-text-dark, #1a0e05)' }} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>Preferensi Lokasi</label>
        <input type="text" value={form.preferensi_lokasi} onChange={(e) => setForm({ ...form, preferensi_lokasi: e.target.value })} placeholder="Contoh: Sepinggan"
          className="w-full px-3 py-2 rounded-lg border text-sm" style={{ fontFamily: FONTS.body, borderColor: 'rgba(200,169,110,0.3)', background: '#fff', color: 'var(--color-text-dark, #1a0e05)' }} />
      </div>

      <label className="flex items-center gap-2 text-sm" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>
        <input type="checkbox" checked={form.ketersediaan_charity} onChange={(e) => setForm({ ...form, ketersediaan_charity: e.target.checked })} /> Ketersediaan untuk Charity / Volunteer
      </label>

      <label className="flex items-center gap-2 text-sm" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>
        <input type="checkbox" checked={form.charity_discount} onChange={(e) => setForm({ ...form, charity_discount: e.target.checked })} /> Bersedia memberikan diskon amal
      </label>

      <div className="flex gap-3 pt-2">
        <SecondaryButton onClick={() => setShowForm(false)}>Kembali</SecondaryButton>
        <PrimaryButton onClick={handleSubmit} disabled={saving}>
          {saving ? (<><Loader2Icon className="h-4 w-4 animate-spin" />Menyimpan...</>) : (<><CheckCircle2Icon className="h-4 w-4" />Simpan & Selesai</>)}
        </PrimaryButton>
      </div>
    </div>
  );
}