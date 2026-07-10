'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2Icon } from 'lucide-react';

interface JadwalMisaFormData {
  hari: string;
  label: string;
  jam: string;
  nama_misa: string;
  lokasi: string;
  tipe: string;
  tanggal_spesifik: string;
  is_active: boolean;
}

const hariOptions = [
  { value: 'senin', label: 'Senin' },
  { value: 'selasa', label: 'Selasa' },
  { value: 'rabu', label: 'Rabu' },
  { value: 'kamis', label: 'Kamis' },
  { value: 'jumat', label: 'Jumat' },
  { value: 'sabtu', label: 'Sabtu' },
  { value: 'minggu', label: 'Minggu' },
];

const tipeOptions = [
  { value: 'harian', label: 'Harian' },
  { value: 'hari_besar', label: 'Hari Besar' },
  { value: 'khusus', label: 'Khusus' },
];

export default function TambahJadwalMisaPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<JadwalMisaFormData>({
    hari: 'minggu',
    label: '',
    jam: '07:00',
    nama_misa: '',
    lokasi: 'Gereja Utama',
    tipe: 'harian',
    tanggal_spesifik: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        label: formData.label || null,
        tanggal_spesifik: formData.tanggal_spesifik || null,
      };

      const response = await fetch('/api/admin/jadwal-misa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to add jadwal misa');

      router.push('/admin/paroki/jadwal-misa');
      router.refresh();
    } catch (err) {
      console.error('Error adding jadwal misa:', err);
      setError(err instanceof Error ? err.message : 'Gagal menambah jadwal misa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header">
          <h1 className="text-2xl font-bold text-text-primary">Tambah Jadwal Misa Baru</h1>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-md text-center mb-4">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-surface rounded-md shadow-sm border border-border p-6 space-y-4">
          <div>
            <label htmlFor="hari" className="block text-sm font-medium text-text-primary mb-1">
              Hari
            </label>
            <select
              id="hari"
              name="hari"
              value={formData.hari}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loading}
            >
              {hariOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="jam" className="block text-sm font-medium text-text-primary mb-1">
              Jam
            </label>
            <input
              type="time"
              id="jam"
              name="jam"
              value={formData.jam}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="nama_misa" className="block text-sm font-medium text-text-primary mb-1">
              Nama Misa
            </label>
            <input
              type="text"
              id="nama_misa"
              name="nama_misa"
              value={formData.nama_misa}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="lokasi" className="block text-sm font-medium text-text-primary mb-1">
              Lokasi
            </label>
            <input
              type="text"
              id="lokasi"
              name="lokasi"
              value={formData.lokasi}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="tipe" className="block text-sm font-medium text-text-primary mb-1">
              Tipe Misa
            </label>
            <select
              id="tipe"
              name="tipe"
              value={formData.tipe}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loading}
            >
              {tipeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {formData.tipe !== 'harian' && (
            <div>
              <label htmlFor="tanggal_spesifik" className="block text-sm font-medium text-text-primary mb-1">
                Tanggal Spesifik (untuk Hari Besar/Khusus)
              </label>
              <input
                type="date"
                id="tanggal_spesifik"
                name="tanggal_spesifik"
                value={formData.tanggal_spesifik}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label htmlFor="label" className="block text-sm font-medium text-text-primary mb-1">
              Label (Opsional, misal: "Misa Anak")
            </label>
            <input
              type="text"
              id="label"
              name="label"
              value={formData.label}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loading}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="mr-2 h-4 w-4 text-primary rounded border-border focus:ring-primary/30"
              disabled={loading}
            />
            <label htmlFor="is_active" className="text-sm font-medium text-text-primary">
              Jadwal Aktif
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push('/admin/paroki/jadwal-misa')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <Loader2Icon className="w-5 h-5 animate-spin mr-2" />
              ) : (
                'Simpan Jadwal Misa'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}