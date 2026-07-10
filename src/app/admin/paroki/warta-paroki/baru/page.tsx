'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2Icon } from 'lucide-react';

interface WartaFormData {
  judul: string;
  excerpt: string;
  konten: string; // Simplified for now, will be JSONB
  tanggal: string;
  kategori: string;
  gambar_url: string;
  is_published: boolean;
}

export default function CreateWartaPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<WartaFormData>({
    judul: '',
    excerpt: '',
    konten: '',
    tanggal: new Date().toISOString().split('T')[0], // Default today
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
      const response = await fetch('/api/admin/warta-paroki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          konten: formData.konten ? JSON.parse(formData.konten) : null, // Parse content as JSONB
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create warta');

      router.push('/admin/paroki/warta-paroki');
      router.refresh(); // Clear cache and re-fetch data on list page
    } catch (err) {
      console.error('Error creating warta:', err);
      setError(err instanceof Error ? err.message : 'Gagal membuat warta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header">
          <h1 className="text-2xl font-bold text-text-primary">Buat Warta Paroki Baru</h1>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-md text-center mb-4">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-surface rounded-md shadow-sm border border-border p-6 space-y-4">
          <div>
            <label htmlFor="judul" className="block text-sm font-medium text-text-primary mb-1">
              Judul
            </label>
            <input
              type="text"
              id="judul"
              name="judul"
              value={formData.judul}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-text-primary mb-1">
              Ringkasan (Excerpt)
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label htmlFor="konten" className="block text-sm font-medium text-text-primary mb-1">
              Konten (JSON)
            </label>
            <textarea
              id="konten"
              name="konten"
              value={formData.konten}
              onChange={handleChange}
              rows={6}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono text-xs"
              placeholder='{"blocks": [{"type": "paragraph", "data": {"text": "Isi warta di sini..."}}]}'
            />
            <p className="text-xs text-text-tertiary mt-1">
              Gunakan format JSON untuk konten rich text (misal dari editor Block Note).
            </p>
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
            >
              <option value="umum">Umum</option>
              <option value="liturgi">Liturgi</option>
              <option value="kegiatan">Kegiatan</option>
              <option value="sosial">Sosial</option>
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
            />
            <label htmlFor="is_published" className="text-sm font-medium text-text-primary">
              Publikasikan Warta
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push('/admin/paroki/warta-paroki')}
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
                'Simpan Warta'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}