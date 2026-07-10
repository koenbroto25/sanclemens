'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2Icon } from 'lucide-react';

interface KegiatanFormData {
  nama: string;
  deskripsi: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  lokasi: string;
  kategori: string;
  gambar_url: string;
  is_published: boolean;
}

export default function CreateKegiatanPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<KegiatanFormData>({
    nama: '',
    deskripsi: '',
    tanggal: new Date().toISOString().split('T')[0],
    jam_mulai: '',
    jam_selesai: '',
    lokasi: '',
    kategori: 'umum',
    gambar_url: '',
    is_published: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      const response = await fetch('/api/admin/kegiatan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create kegiatan');

      router.push('/admin/paroki/kegiatan');
      router.refresh();
    } catch (err) {
      console.error('Error creating kegiatan:', err);
      setError(err instanceof Error ? err.message : 'Gagal membuat kegiatan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header">
          <h1 className="text-2xl font-bold text-text-primary">Buat Kegiatan Paroki Baru</h1>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-md text-center mb-4">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-surface rounded-md shadow-sm border border-border p-6 space-y-4">
          <div>
            <label htmlFor="nama" className="block text-sm font-medium text-text-primary mb-1">
              Nama Kegiatan
            </label>
            <input
              type="text"
              id="nama"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="deskripsi" className="block text-sm font-medium text-text-primary mb-1">
              Deskripsi
            </label>
            <textarea
              id="deskripsi"
              name="deskripsi"
              value={formData.deskripsi}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="tanggal" className="block text-sm font-medium text-text-primary mb-1">
              Tanggal
            </label>
            <input
              type="date"
              id="tanggal"
              name="tanggal"
              value={formData.tanggal}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="jam_mulai" className="block text-sm font-medium text-text-primary mb-1">
                Jam Mulai
              </label>
              <input
                type="time"
                id="jam_mulai"
                name="jam_mulai"
                value={formData.jam_mulai}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="jam_selesai" className="block text-sm font-medium text-text-primary mb-1">
                Jam Selesai
              </label>
              <input
                type="time"
                id="jam_selesai"
                name="jam_selesai"
                value={formData.jam_selesai}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={loading}
              />
            </div>
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
            <label htmlFor="kategori" className="block text-sm font-medium text-text-primary mb-1">
              Kategori
            </label>
            <select
              id="kategori"
              name="kategori"
              value={formData.kategori}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loading}
            >
              <option value="umum">Umum</option>
              <option value="ibadah">Ibadah</option>
              <option value="sosial">Sosial</option>
              <option value="pendidikan">Pendidikan</option>
              <option value="pemuda">Pemuda</option>
            </select>
          </div>

          <div>
            <label htmlFor="gambar_url" className="block text-sm font-medium text-text-primary mb-1">
              URL Gambar
            </label>
            <input
              type="url"
              id="gambar_url"
              name="gambar_url"
              value={formData.gambar_url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="https://example.com/gambar.jpg (opsional)"
              disabled={loading}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_published"
              name="is_published"
              checked={formData.is_published}
              onChange={handleChange}
              className="mr-2 h-4 w-4 text-primary rounded border-border focus:ring-primary/30"
              disabled={loading}
            />
            <label htmlFor="is_published" className="text-sm font-medium text-text-primary">
              Publikasikan Kegiatan
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push('/admin/paroki/kegiatan')}
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
                'Simpan Kegiatan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}