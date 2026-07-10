'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusIcon, EditIcon, Trash2Icon, CheckCircle2Icon, XCircleIcon, Loader2Icon } from 'lucide-react';

interface Warta {
  id: string;
  judul: string;
  excerpt: string;
  tanggal: string;
  kategori: string;
  is_published: boolean;
  published_at?: string;
  created_by?: string;
  profiles?: {
    full_name?: string;
  };
}

export default function AdminWartaParokiPage() {
  const [wartaList, setWartaList] = useState<Warta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchWarta = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/warta-paroki');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to fetch warta');
      setWartaList(result.data);
    } catch (err) {
      console.error('Error fetching warta:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat warta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarta();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus warta ini?')) return;
    try {
      const response = await fetch(`/api/admin/warta-paroki/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete warta');
      }
      fetchWarta(); // Refresh list
    } catch (err) {
      console.error('Error deleting warta:', err);
      alert(err instanceof Error ? err.message : 'Gagal menghapus warta');
    }
  };

  const getKategoriBadgeClass = (kategori: string) => {
    switch (kategori) {
      case 'liturgi': return 'bg-blue-100 text-blue-800';
      case 'kegiatan': return 'bg-purple-100 text-purple-800';
      case 'sosial': return 'bg-green-100 text-green-800';
      case 'umum': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header">
          <h1 className="text-2xl font-bold text-text-primary">Manajemen Warta Paroki</h1>
          <Link href="/admin/paroki/warta-paroki/baru" className="btn btn-primary">
            <PlusIcon className="w-5 h-5 mr-2" /> Buat Warta Baru
          </Link>
        </div>

        {loading && (
          <div className="text-center py-8">
            <Loader2Icon className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-text-secondary mt-2">Memuat warta...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-md text-center">
            <p>{error}</p>
            <button onClick={fetchWarta} className="mt-2 text-red-600 underline">
              Coba Lagi
            </button>
          </div>
        )}

        {!loading && !error && wartaList.length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            <p>Belum ada warta paroki. Silakan buat yang baru.</p>
          </div>
        )}

        {!loading && !error && wartaList.length > 0 && (
          <div className="overflow-x-auto bg-surface rounded-md shadow-sm border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-bg">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Judul</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Created By</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {wartaList.map((warta) => (
                  <tr key={warta.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      {warta.judul}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getKategoriBadgeClass(warta.kategori)}`}>
                        {warta.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {formatDate(warta.tanggal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {warta.is_published ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2Icon className="w-3 h-3 mr-1" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <XCircleIcon className="w-3 h-3 mr-1" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {warta.profiles?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/admin/paroki/warta-paroki/${warta.id}`} className="text-primary hover:text-primary-light mr-3">
                        <EditIcon className="w-5 h-5 inline" />
                      </Link>
                      <button onClick={() => handleDelete(warta.id)} className="text-red-600 hover:text-red-800">
                        <Trash2Icon className="w-5 h-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}