'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusIcon, EditIcon, Trash2Icon, CheckCircle2Icon, XCircleIcon, Loader2Icon } from 'lucide-react';

interface JadwalMisa {
  id: string;
  hari: string;
  label?: string;
  jam: string;
  nama_misa: string;
  lokasi: string;
  tipe: string;
  tanggal_spesifik?: string;
  is_active: boolean;
  created_by?: string;
  profiles?: {
    full_name?: string;
  };
}

const hariMap: Record<string, string> = {
  'senin': 'Senin',
  'selasa': 'Selasa',
  'rabu': 'Rabu',
  'kamis': 'Kamis',
  'jumat': 'Jumat',
  'sabtu': 'Sabtu',
  'minggu': 'Minggu',
};

export default function AdminJadwalMisaPage() {
  const [jadwalList, setJadwalList] = useState<JadwalMisa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchJadwal = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/jadwal-misa');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to fetch jadwal misa');
      setJadwalList(result.data);
    } catch (err) {
      console.error('Error fetching jadwal misa:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat jadwal misa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJadwal();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal misa ini?')) return;
    try {
      const response = await fetch(`/api/admin/jadwal-misa/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete jadwal misa');
      }
      fetchJadwal(); // Refresh list
    } catch (err) {
      console.error('Error deleting jadwal misa:', err);
      alert(err instanceof Error ? err.message : 'Gagal menghapus jadwal misa');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Apakah Anda yakin ingin ${currentStatus ? 'menonaktifkan' : 'mengaktifkan'} jadwal misa ini?`)) return;
    try {
      const response = await fetch(`/api/admin/jadwal-misa/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to toggle status');
      }
      fetchJadwal(); // Refresh list
    } catch (err) {
      console.error('Error toggling status:', err);
      alert(err instanceof Error ? err.message : 'Gagal mengubah status jadwal misa');
    }
  };

  const getTipeBadgeClass = (tipe: string) => {
    switch (tipe) {
      case 'harian': return 'bg-indigo-100 text-indigo-800';
      case 'hari_besar': return 'bg-red-100 text-red-800';
      case 'khusus': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTanggalSpesifik = (dateString?: string) => {
    if (!dateString) return '-';
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
          <h1 className="text-2xl font-bold text-text-primary">Manajemen Jadwal Misa</h1>
          <Link href="/admin/paroki/jadwal-misa/tambah" className="btn btn-primary">
            <PlusIcon className="w-5 h-5 mr-2" /> Tambah Jadwal Misa
          </Link>
        </div>

        {loading && (
          <div className="text-center py-8">
            <Loader2Icon className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-text-secondary mt-2">Memuat jadwal misa...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-md text-center">
            <p>{error}</p>
            <button onClick={fetchJadwal} className="mt-2 text-red-600 underline">
              Coba Lagi
            </button>
          </div>
        )}

        {!loading && !error && jadwalList.length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            <p>Belum ada jadwal misa. Silakan tambahkan yang baru.</p>
          </div>
        )}

        {!loading && !error && jadwalList.length > 0 && (
          <div className="overflow-x-auto bg-surface rounded-md shadow-sm border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-bg">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Hari</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Jam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Nama Misa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Lokasi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Tipe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Tanggal Spesifik</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Created By</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {jadwalList.map((jadwal) => (
                  <tr key={jadwal.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      {hariMap[jadwal.hari] || jadwal.hari}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {jadwal.jam.substring(0, 5)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {jadwal.nama_misa}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {jadwal.lokasi}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTipeBadgeClass(jadwal.tipe)}`}>
                        {jadwal.tipe.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {formatTanggalSpesifik(jadwal.tanggal_spesifik)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {jadwal.is_active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2Icon className="w-3 h-3 mr-1" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircleIcon className="w-3 h-3 mr-1" /> Non-aktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {jadwal.profiles?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleToggleActive(jadwal.id, jadwal.is_active)} className={`mr-3 ${jadwal.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}>
                        {jadwal.is_active ? 'Non-aktifkan' : 'Aktifkan'}
                      </button>
                      <Link href={`/admin/paroki/jadwal-misa/${jadwal.id}`} className="text-primary hover:text-primary-light mr-3">
                        <EditIcon className="w-5 h-5 inline" />
                      </Link>
                      <button onClick={() => handleDelete(jadwal.id)} className="text-red-600 hover:text-red-800">
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