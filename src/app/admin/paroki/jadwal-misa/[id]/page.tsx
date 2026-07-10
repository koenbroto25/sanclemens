'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2Icon, Trash2Icon } from 'lucide-react';

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

export default function EditJadwalMisaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJadwal = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/admin/jadwal-misa/${id}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to fetch jadwal misa');
        setFormData({
          ...result.data,
          jam: result.data.jam.substring(0, 5), // Format time for input type="time"
          tanggal_spesifik: result.data.tanggal_spesifik ? result.data.tanggal_spesifik.split('T')[0] : '', // Format date
        });
      } catch (err) {
        console.error('Error fetching jadwal misa:', err);
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat jadwal misa');
      } finally {
        setLoading(false);
      }
    };
    fetchJadwal();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        label: formData.label || null,
        tanggal_spesifik: formData.tanggal_spesifik || null,
      };

      const response = await fetch(`/api/admin/jadwal-misa/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update jadwal misa');

      router.push('/admin/paroki/jadwal-misa');
      router.refresh();
    } catch (err) {
      console.error('Error updating jadwal misa:', err);
      setError(err instanceof Error ? err.message : 'Gagal memperbarui jadwal misa');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal misa ini? Tindakan ini tidak bisa dibatalkan.')) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/jadwal-misa/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete jadwal misa');
      }
      router.push('/admin/paroki/jadwal-misa');
      router.refresh();
    } catch (err) {
      console.error('Error deleting jadwal misa:', err);
      alert(err instanceof Error ? err.message : 'Gagal menghapus jadwal misa');
      setError(err instanceof Error ? err.message : 'Gagal menghapus jadwal misa');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="text-center py-8">
          <Loader2Icon className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-text-secondary mt-2">Memuat jadwal misa...</p>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="admin-container">
        <div className="bg-red-100 text-red-800 p-4 rounded-md text-center">
          <p>{error}</p>
          <button onClick={() => router.push('/admin/paroki/jadwal-misa')} className="mt-2 text-red-600 underline">
            Kembali ke Daftar Jadwal Misa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header">
          <h1 className="text-2xl font-bold text-text-primary">Edit Jadwal Misa</h1>
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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
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
                disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="btn bg-red-600 text-white hover:bg-red-700"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2Icon className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Trash2Icon className="w-5 h-5 mr-2" />
              )}
              Hapus
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2Icon className="w-5 h-5 animate-spin mr-2" />
              ) : (
                'Update Jadwal Misa'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}