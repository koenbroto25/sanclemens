'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2Icon, Trash2Icon } from 'lucide-react';

interface WartaFormData {
  judul: string;
  excerpt: string;
  konten: string; // Simplified for now, will be JSONB
  tanggal: string;
  kategori: string;
  gambar_url: string;
  is_published: boolean;
  published_at?: string;
}

export default function EditWartaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [formData, setFormData] = useState<WartaFormData>({
    judul: '',
    excerpt: '',
    konten: '',
    tanggal: new Date().toISOString().split('T')[0],
    kategori: 'umum',
    gambar_url: '',
    is_published: false,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWarta = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/admin/warta-paroki/${id}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to fetch warta');
        setFormData({
          ...result.data,
          konten: JSON.stringify(result.data.konten, null, 2), // Convert JSONB to string for textarea
          tanggal: result.data.tanggal.split('T')[0], // Format date for input type="date"
        });
      } catch (err) {
        console.error('Error fetching warta:', err);
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat warta');
      } finally {
        setLoading(false);
      }
    };
    fetchWarta();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      const response = await fetch(`/api/admin/warta-paroki/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          konten: formData.konten ? JSON.parse(formData.konten) : null,
          published_at: formData.is_published && !formData.published_at ? new Date().toISOString() : formData.published_at,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update warta');

      router.push('/admin/paroki/warta-paroki');
      router.refresh();
    } catch (err) {
      console.error('Error updating warta:', err);
      setError(err instanceof Error ? err.message : 'Gagal memperbarui warta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus warta ini? Tindakan ini tidak bisa dibatalkan.')) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/warta-paroki/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete warta');
      }
      router.push('/admin/paroki/warta-paroki');
      router.refresh();
    } catch (err) {
      console.error('Error deleting warta:', err);
      alert(err instanceof Error ? err.message : 'Gagal menghapus warta');
      setError(err instanceof Error ? err.message : 'Gagal menghapus warta');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="text-center py-8">
          <Loader2Icon className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-text-secondary mt-2">Memuat warta...</p>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="admin-container">
        <div className="bg-red-100 text-red-800 p-4 rounded-md text-center">
          <p>{error}</p>
          <button onClick={() => router.push('/admin/paroki/warta-paroki')} className="mt-2 text-red-600 underline">
            Kembali ke Daftar Warta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header">
          <h1 className="text-2xl font-bold text-text-primary">Edit Warta Paroki</h1>
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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
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
                'Update Warta'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}