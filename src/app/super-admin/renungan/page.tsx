'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Renungan {
  id: string;
  tanggal: string;
  mode_persona: string;
  perayaan: string;
  warna_liturgi: string;
  tema_renungan: string;
  skor_total: number;
  status_kurasi: string;
  status: string;
  created_at: string;
  batch_id: string | null;
}

interface Batch {
  id: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status_batch: string;
  jumlah_renungan: number;
  deadline_kurasi: string;
  created_at: string;
}

export default function RenunganMonitoringPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'semua' | 'draft' | 'published' | 'rejected'>('semua');
  
  const [renunganList, setRenunganList] = useState<Renungan[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    menunggu: 0,
    disetujui: 0,
    revisi: 0,
    ditolak: 0,
    avg_skor: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login/admin');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('access_layer')
      .eq('id', user.id)
      .single();

    if (!profile || profile.access_layer < 9) {
      router.push('/auth/unauthorized');
      return;
    }

    loadData();
  }

  async function loadData() {
    setLoading(true);

    // Load renungan dengan filter
    let query = supabase
      .from('renungan_harian')
      .select('*')
      .order('tanggal', { ascending: false })
      .limit(100);

    if (activeTab !== 'semua') {
      query = query.eq('status', activeTab);
    }

    const { data: renungan } = await query;
    setRenunganList(renungan || []);

    // Load batch terbaru
    const { data: batchData } = await supabase
      .from('batch_kurasi')
      .select('*')
      .order('tanggal_mulai', { ascending: false })
      .limit(10);
    
    setBatches(batchData || []);

    // Hitung statistik
    if (renungan) {
      const stats = {
        total: renungan.length,
        menunggu: renungan.filter((r: any) => r.status_kurasi === 'menunggu').length,
        disetujui: renungan.filter((r: any) => r.status_kurasi === 'disetujui').length,
        revisi: renungan.filter((r: any) => r.status_kurasi === 'revisi').length,
        ditolak: renungan.filter((r: any) => r.status_kurasi === 'ditolak' || r.status === 'rejected').length,
        avg_skor: renungan.length > 0
          ? Math.round(renungan.reduce((acc: number, r: any) => acc + (r.skor_total || 0), 0) / renungan.length)
          : 0,
      };
      setStats(stats);
    }

    setLoading(false);
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      menunggu: 'bg-yellow-100 text-yellow-800',
      disetujui: 'bg-green-100 text-green-800',
      revisi: 'bg-blue-100 text-blue-800',
      ditolak: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-purple-100 text-purple-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getModeBadge = (mode: string) => {
    return mode === 'ignas' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-purple-100 text-purple-800';
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 p-8">Memuat data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Monitoring Renungan Harian
          </h1>
          <p className="text-gray-600">
            Dashboard Super Admin â€” Monitoring batch renungan harian
          </p>
        </div>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Renungan</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-yellow-600">{stats.menunggu}</div>
            <div className="text-sm text-gray-500">Menunggu Kurasi</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">{stats.disetujui}</div>
            <div className="text-sm text-gray-500">Disetujui</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600">{stats.revisi}</div>
            <div className="text-sm text-gray-500">Perlu Revisi</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-red-600">{stats.ditolak}</div>
            <div className="text-sm text-gray-500">Ditolak</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600">{stats.avg_skor}</div>
            <div className="text-sm text-gray-500">Rata-rata Skor</div>
          </div>
        </div>

        {/* Batch Terbaru */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Batch Terbaru</h2>
          <div className="space-y-3">
            {batches.map((batch) => (
              <div key={batch.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">
                      {batch.tanggal_mulai} â€” {batch.tanggal_selesai}
                    </div>
                    <div className="text-sm text-gray-500">
                      {batch.jumlah_renungan} renungan â€¢ Deadline: {new Date(batch.deadline_kurasi).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status_batch)}`}>
                    {batch.status_batch}
                  </span>
                </div>
              </div>
            ))}
            {batches.length === 0 && (
              <div className="text-gray-500 text-sm">Belum ada batch renungan</div>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex gap-2 mb-6">
            {(['semua', 'draft', 'published', 'rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium capitalize ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab === 'semua' ? 'Semua' : tab === 'draft' ? 'Draft' : tab === 'published' ? 'Published' : 'Ditolak'}
              </button>
            ))}
          </div>

          {/* Renungan Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perayaan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tema</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Kurasi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {renunganList.map((renungan) => (
                  <tr key={renungan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(renungan.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getModeBadge(renungan.mode_persona)}`}>
                        {renungan.mode_persona === 'ignas' ? 'Bruder Ignas' : 'Pater Anton'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{renungan.perayaan}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {renungan.tema_renungan}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-medium ${renungan.skor_total >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                        {renungan.skor_total || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(renungan.status_kurasi)}`}>
                        {renungan.status_kurasi}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(renungan.status)}`}>
                        {renungan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => router.push(`/admin/kurasi/${renungan.batch_id || 'list'}`)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
                {renunganList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Tidak ada renungan ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
