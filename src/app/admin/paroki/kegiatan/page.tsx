'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusIcon, EditIcon, Trash2Icon, CheckCircle2Icon, XCircleIcon, Loader2Icon, CalendarIcon, MapPinIcon, ClockIcon } from 'lucide-react';

interface Kegiatan {
  id: string;
  nama: string;
  deskripsi: string;
  tanggal: string;
  jam_mulai?: string;
  jam_selesai?: string;
  lokasi?: string;
  kategori: string;
  is_published: boolean;
  created_by?: string;
  profiles?: {
    full_name?: string;
  };
}

export default function AdminKegiatanParokiPage() {
  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchKegiatan = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/kegiatan');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to fetch kegiatan');
      setKegiatanList(result.data);
    } catch (err) {
      console.error('Error fetching kegiatan:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat kegiatan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKegiatan();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) return;
    try {
      const response = await fetch(`/api/admin/kegiatan/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete kegiatan');
      }
      fetchKegiatan(); // Refresh list
    } catch (err) {
      console.error('Error deleting kegiatan:', err);
      alert(err instanceof Error ? err.message : 'Gagal menghapus kegiatan');
    }
  };

  const getKategoriBadgeClass = (kategori: string) => {
    switch (kategori) {
      case 'ibadah': return 'bg-blue-100 text-blue-800';
      case 'sosial': return 'bg-green-100 text-green-800';
      case 'pendidikan': return 'bg-purple-100 text-purple-800';
      case 'pemuda': return 'bg-pink-100 text-pink-800';
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
          <h1 className="text-2xl font-bold text-text-primary">Manajemen Kegiatan Paroki</h1>
          <Link href="/admin/paroki/kegiatan/baru" className="btn btn-primary">
            <PlusIcon className="w-5 h-5 mr-2" /> Buat Kegiatan Baru
          </Link>
        </div>

        {loading && (
          <div className="text-center py-8">
            <Loader2Icon className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-text-secondary mt-2">Memuat kegiatan...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-md text-center">
            <p>{error}</p>
            <button onClick={fetchKegiatan} className="mt-2 text-red-600 underline">
              Coba Lagi
            </button>
          </div>
        )}

        {!loading && !error && kegiatanList.length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            <p>Belum ada kegiatan paroki. Silakan buat yang baru.</p>
          </div>
        )}

        {!loading && !error && kegiatanList.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kegiatanList.map((kegiatan) => (
              <div key={kegiatan.id} className="bg-surface rounded-md shadow-sm border border-border p-6 relative">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-text-primary">{kegiatan.nama}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getKategoriBadgeClass(kegiatan.kategori)}`}>
                    {kegiatan.kategori}
                  </span>
                </div>
                <p className="text-sm text-text-secondary mb-4 line-clamp-3">{kegiatan.deskripsi || 'Tidak ada deskripsi.'}</p>
                
                <div className="text-sm text-text-tertiary space-y-1 mb-4">
                  <p className="flex items-center"><CalendarIcon className="w-4 h-4 mr-2" /> {formatDate(kegiatan.tanggal)}</p>
                  {kegiatan.jam_mulai && (
                    <p className="flex items-center"><ClockIcon className="w-4 h-4 mr-2" /> {kegiatan.jam_mulai} {kegiatan.jam_selesai ? `- ${kegiatan.jam_selesai}` : ''}</p>
                  )}
                  {kegiatan.lokasi && (
                    <p className="flex items-center"><MapPinIcon className="w-4 h-4 mr-2" /> {kegiatan.lokasi}</p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
                  <div className="text-sm">
                    {kegiatan.is_published ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2Icon className="w-3 h-3 mr-1" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <XCircleIcon className="w-3 h-3 mr-1" /> Draft
                      </span>
                    )}
                  </div>
                  <div>
                    <Link href={`/admin/paroki/kegiatan/${kegiatan.id}`} className="text-primary hover:text-primary-light mr-3">
                      <EditIcon className="w-5 h-5 inline" />
                    </Link>
                    <button onClick={() => handleDelete(kegiatan.id)} className="text-red-600 hover:text-red-800">
                      <Trash2Icon className="w-5 h-5 inline" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}