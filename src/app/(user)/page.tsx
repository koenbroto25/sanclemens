'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Profile {
  id: string;
  full_name: string;
  nama_baptis?: string;
  role: string;
  lingkungan_slug?: string;
}

interface Keluarga {
  id: string;
  no_kk: string;
  kepala_keluarga_nama: string;
  anggota: any[];
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [keluarga, setKeluarga] = useState<Keluarga[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setProfile(profileData);
        const { data: keluargaData } = await supabase
          .from('keluarga')
          .select('*, anggota_keluarga(*)')
          .or(`kepala_keluarga_id.eq.${profileData?.id},id.in.(SELECT keluarga_id FROM anggota_keluarga WHERE profile_id = ${profileData?.id})`);
        setKeluarga(keluargaData || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner"></div>
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          {greeting()},{' '}
          <span className="text-gold">{profile?.nama_baptis || profile?.full_name}</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Umat Aktif &bull; Lingkungan {profile?.lingkungan_slug || '-'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/public/jadwal-misa" className="card hover:border-[#e2b04a] cursor-pointer">
          <div className="text-4xl mb-2">&#x26EA;</div>
          <h3 className="card-title">Jadwal Misa</h3>
          <p className="text-sm text-gray-400 mt-2">Lihat jadwal misa minggu ini</p>
        </Link>
        <Link href="/public/renungan-harian" className="card hover:border-[#e2b04a] cursor-pointer">
          <div className="text-4xl mb-2">&#x1F64F;</div>
          <h3 className="card-title">Renungan Harian</h3>
          <p className="text-sm text-gray-400 mt-2">Refleksi dan doa hari ini</p>
        </Link>
        <Link href="/public/learn-catholic" className="card hover:border-[#e2b04a] cursor-pointer">
          <div className="text-4xl mb-2">&#x1F4D6;</div>
          <h3 className="card-title">Learn Catholic</h3>
          <p className="text-sm text-gray-400 mt-2">Modul pembelajaran iman</p>
        </Link>
        <Link href="/keahlian" className="card hover:border-[#e2b04a] cursor-pointer">
          <div className="text-4xl mb-2">&#x1F4BC;</div>
          <h3 className="card-title">Usaha &amp; Keahlian</h3>
          <p className="text-sm text-gray-400 mt-2">Daftar usaha dan keahlian Anda</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h3 className="card-title">Keluarga Saya</h3>
            <Link href="/keluarga" className="text-sm text-gold hover:underline">Lihat Semua</Link>
          </div>
          {keluarga.length > 0 ? (
            <div className="space-y-3">
              {keluarga.slice(0, 3).map((kk) => (
                <div key={kk.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="font-semibold">{kk.kepala_keluarga_nama}</p>
                    <p className="text-sm text-gray-400">KK: {kk.no_kk}</p>
                  </div>
                  <span className="badge badge-info">{kk.anggota?.length || 0} anggota</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-title">Belum ada data keluarga</p>
              <Link href="/keluarga" className="btn btn-primary mt-4">Tambah Keluarga</Link>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h3 className="card-title">Riwayat Sakramen</h3>
            <Link href="/sakramen" className="text-sm text-gold hover:underline">Lihat Semua</Link>
          </div>
          <div className="empty-state">
            <p className="empty-state-title">Belum ada data sakramen</p>
            <Link href="/sakramen" className="btn btn-primary mt-4">Tambah Sakramen</Link>
          </div>
        </div>
      </div>

      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">Rekomendasi AI</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 rounded-lg">
            <h4 className="font-semibold mb-2">Lowongan Kerja</h4>
            <p className="text-sm text-gray-400">Berdasarkan keahlian Anda, ada 3 lowongan yang cocok</p>
            <Link href="/keahlian" className="text-sm text-gold hover:underline mt-2 inline-block">Lihat Rekomendasi &rarr;</Link>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <h4 className="font-semibold mb-2">Bantuan Sosial</h4>
            <p className="text-sm text-gray-400">Program bantuan aktif yang mungkin sesuai kebutuhan Anda</p>
            <Link href="/bantuan" className="text-sm text-gold hover:underline mt-2 inline-block">Lihat Program &rarr;</Link>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <h4 className="font-semibold mb-2">Kegiatan Terdekat</h4>
            <p className="text-sm text-gray-400">Kegiatan lingkungan dan paroki minggu ini</p>
            <Link href="/public/kegiatan" className="text-sm text-gold hover:underline mt-2 inline-block">Lihat Kegiatan &rarr;</Link>
          </div>
        </div>
      </div>

      {profile?.role && profile.role !== 'umat' && (
        <div className="card mb-8">
          <div className="card-header">
            <h3 className="card-title">Panel Admin</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {profile.role === 'super_admin' && (
              <Link href="/super-admin/dashboard" className="btn btn-primary">Super Admin</Link>
            )}
            {['pastor', 'wakil_ketua_dpp', 'sekretaris_dpp', 'bendahara_dpp', 'koordinator_bidang'].includes(profile.role) && (
              <Link href="/admin/paroki/dashboard" className="btn btn-secondary">Admin Paroki</Link>
            )}
            {['ketua_lingkungan', 'sekretaris_lingkungan', 'bendahara_lingkungan', 'wali_digital_lingkungan'].includes(profile.role) && (
              <Link href={`/admin/lingkungan/${profile.lingkungan_slug?.toLowerCase()}/dashboard`} className="btn btn-secondary">Admin Lingkungan</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}