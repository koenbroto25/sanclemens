'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

interface Renungan {
  id: string;
  tanggal: string;
  mode_persona: 'ignas' | 'anton';
  judul: string;
  konten: string;
  bacaan_utama: string;
  musim_liturgi: string;
  tema_renungan: string;
  status: 'draft' | 'published' | 'rejected';
  status_kurasi: 'menunggu' | 'disetujui' | 'ditolak' | 'revisi';
  disetujui_oleh?: string;
  waktu_kurasi?: string;
  catatan_kurator?: string;
  batch_id: string;
  created_at: string;
  updated_at: string;
}

interface BatchSummary {
  id: string;
  minggu_ke: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  deadline_kurasi: string;
  status_batch: string;
  jumlah_renungan: number;
}

interface KurasiRenunganPanelProps {
  mode: 'pastor' | 'super_admin';
}

// Dummy Supabase client for component side (replace with actual auth-helpers client)
const supabase = createClient(); 

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let bgColor = 'bg-gray-200';
  let textColor = 'text-gray-800';
  let text = status;

  switch (status) {
    case 'menunggu':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      text = 'Menunggu';
      break;
    case 'disetujui':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      text = 'Disetujui';
      break;
    case 'ditolak':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      text = 'Ditolak';
      break;
    case 'revisi':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      text = 'Revisi';
      break;
    case 'published': // For super_admin view, 'published' status is important
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      text = 'Published';
      break;
    case 'draft':
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
      text = 'Draft';
      break;
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {text}
    </span>
  );
};

const PersonaBadge: React.FC<{ persona: 'ignas' | 'anton' }> = ({ persona }) => {
  const bgColor = persona === 'ignas' ? 'bg-indigo-100' : 'bg-orange-100';
  const textColor = persona === 'ignas' ? 'text-indigo-800' : 'text-orange-800';
  const text = persona === 'ignas' ? 'Bruder Ignas' : 'Pater Anton';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {text}
    </span>
  );
};

export default function KurasiRenunganPanel({ mode }: KurasiRenunganPanelProps) {
  const [renunganList, setRenunganList] = useState<Renungan[]>([]);
  const [batchSummary, setBatchSummary] = useState<BatchSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRenungan, setSelectedRenungan] = useState<Renungan | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Placeholder for getting auth token (replace with actual Next.js auth-helpers)
  const getAuthToken = async () => {
    // In a real app, you'd get the session or token here.
    // For this mock-up, we'll return a dummy token.
    return 'dummy-admin-token'; 
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const queryParams = new URLSearchParams();
      queryParams.append('mode', mode);
      if (mode === 'pastor') {
        queryParams.append('status', 'draft'); // Pastor focuses on drafts awaiting action
      }

      const res = await fetch(`/api/admin/kurasi/list?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error(`Error fetching data: ${res.statusText}`);
      }
      const data = await res.json();
      setRenunganList(data.renungan);
      if (mode === 'super_admin') {
        setBatchSummary(data.batchSummary);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch renungan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [mode]);

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this renungan?')) return;
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/kurasi/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Approval failed: ${res.statusText}`);
      alert('Renungan approved!');
      setShowModal(false);
      fetchData(); // Refresh list
    } catch (err: any) {
      alert(`Error approving renungan: ${err.message}`);
      console.error('Approval error:', err);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert('Rejection reason cannot be empty.');
      return;
    }
    if (!confirm('Are you sure you want to reject this renungan?')) return;
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/kurasi/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rejectionReason }),
      });
      if (!res.ok) throw new Error(`Rejection failed: ${res.statusText}`);
      alert('Renungan rejected!');
      setShowModal(false);
      fetchData(); // Refresh list
    } catch (err: any) {
      alert(`Error rejecting renungan: ${err.message}`);
      console.error('Rejection error:', err);
    }
  };

  const handleReview = (renungan: Renungan) => {
    setSelectedRenungan(renungan);
    setRejectionReason(renungan.catatan_kurator || '');
    setShowModal(true);
  };

  const renunganMenunggu = renunganList.filter(r => r.status_kurasi === 'menunggu' || r.status_kurasi === 'revisi').length;

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>{mode === 'pastor' ? 'Kurasi Renungan Harian' : 'Monitoring Kurasi Renungan'}</h2>
        {mode === 'pastor' && renunganMenunggu > 0 && (
          <span className="badge bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
            {renunganMenunggu} menunggu persetujuan
          </span>
        )}
        {mode === 'super_admin' && (
           <Link href="/admin/super-admin/kurasi" className="btn-admin-secondary">Lihat Semua</Link>
           // This link is a placeholder, will assume a /super-admin/kurasi page for full list,
           // or keep it embedded if the table is the full list.
        )}
      </div>

      {loading && <p>Loading renungan...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && renunganList.length === 0 && (
        <p>{mode === 'pastor' ? 'Tidak ada renungan yang perlu dikurasi saat ini.' : 'Tidak ada renungan untuk ditampilkan.'}</p>
      )}

      {!loading && !error && renunganList.length > 0 && (
        <div className="admin-card mt-4">
          <h3 className="mb-4">{mode === 'pastor' ? 'Daftar Menunggu Persetujuan' : 'Daftar Renungan Terbaru'}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Persona</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Kurasi</th>
                  {mode === 'super_admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disetujui Oleh</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {renunganList.map((renungan) => (
                  <tr key={renungan.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(new Date(renungan.tanggal), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><PersonaBadge persona={renungan.mode_persona} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{renungan.judul}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><StatusBadge status={renungan.status_kurasi} /></td>
                    {mode === 'super_admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renungan.disetujui_oleh || '-'}
                        {renungan.waktu_kurasi && renungan.disetujui_oleh && (
                          <span className="block text-xs text-gray-500">{format(new Date(renungan.waktu_kurasi), 'dd/MM HH:mm')}</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(renungan)}
                          className="text-indigo-600 hover:text-indigo-900 px-3 py-1 border border-indigo-300 rounded-md"
                        >
                          Review
                        </button>
                        {mode === 'pastor' && (renungan.status_kurasi === 'menunggu' || renungan.status_kurasi === 'revisi') && (
                          <button
                            onClick={() => handleApprove(renungan.id)}
                            className="text-green-600 hover:text-green-900 px-3 py-1 border border-green-300 rounded-md"
                          >
                            Setujui
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mode === 'super_admin' && batchSummary && batchSummary.length > 0 && (
        <div className="admin-card mt-8">
          <h3 className="mb-4">Ringkasan Batch Kurasi Terbaru</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minggu Ke</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Mulai</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline Kurasi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Renungan</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {batchSummary.map((batch) => (
                  <tr key={batch.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{batch.minggu_ke}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(new Date(batch.tanggal_mulai), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(new Date(batch.deadline_kurasi), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><StatusBadge status={batch.status_batch} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{batch.jumlah_renungan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showModal && selectedRenungan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">Review Renungan</h3>
            <p className="text-sm text-gray-600 mb-2">Tanggal: {format(new Date(selectedRenungan.tanggal), 'dd MMM yyyy')} | Persona: <PersonaBadge persona={selectedRenungan.mode_persona} /></p>
            <h4 className="text-lg font-semibold mb-3">{selectedRenungan.judul}</h4>
            <div className="prose max-h-96 overflow-y-auto border border-gray-300 p-4 rounded-md bg-gray-50 mb-4">
              <p className="whitespace-pre-wrap">{selectedRenungan.konten}</p>
            </div>

            {mode === 'pastor' && (
              <>
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">Catatan/Alasan Penolakan (opsional):</label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
                  placeholder="Isi alasan jika ingin menolak atau memberi catatan revisi..."
                ></textarea>
              </>
            )}

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Tutup
              </button>
              {mode === 'pastor' && (
                <>
                  <button
                    onClick={() => handleReject(selectedRenungan.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRenungan.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Setujui
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}