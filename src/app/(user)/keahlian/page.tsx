'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Usaha {
  id: string;
  nama_usaha: string;
  kategori_usaha: string;
  deskripsi: string;
  no_wa: string;
  is_charity_friendly: boolean;
  charity_discount_percentage: number;
}

interface CharityService {
  id: string;
  kategori_jasa: string;
  deskripsi_jasa: string;
  is_active: boolean;
  is_verified: boolean;
}

export default function KeahlianPage() {
  const [usahaList, setUsahaList] = useState<Usaha[]>([]);
  const [charityList, setCharityList] = useState<CharityService[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'usaha' | 'charity' | 'browse'>('usaha');
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const { data: usahaData } = await supabase
          .from('usaha_umat')
          .select('*')
          .eq('user_id', profile.id);
        setUsahaList(usahaData || []);

        const { data: charityData } = await supabase
          .from('charity_services')
          .select('*')
          .eq('user_id', profile.id);
        setCharityList(charityData || []);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Ã°Å¸Â¤Â Keahlian & Charity</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('usaha')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'usaha' ? 'bg-[#e2b04a] text-black' : 'bg-white/5 text-gray-300'}`}
        >
          Ã°Å¸â€™Â¼ Usaha Saya ({usahaList.length})
        </button>
        <button
          onClick={() => setActiveTab('charity')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'charity' ? 'bg-[#e2b04a] text-black' : 'bg-white/5 text-gray-300'}`}
        >
          Ã°Å¸Å½Â Jasa Volunteer ({charityList.length})
        </button>
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'browse' ? 'bg-[#e2b04a] text-black' : 'bg-white/5 text-gray-300'}`}
        >
          Ã°Å¸â€Â Jelajahi
        </button>
      </div>

      {/* Usaha Tab */}
      {activeTab === 'usaha' && (
        <div>
          {usahaList.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">Ã°Å¸â€™Â¼</div>
                <p className="empty-state-title">Belum ada usaha</p>
                <Link href="/dashboard/usaha" className="btn btn-primary mt-4">Tambah Usaha</Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {usahaList.map((usaha) => (
                <div key={usaha.id} className="card">
                  <h3 className="text-lg font-bold text-gold">{usaha.nama_usaha}</h3>
                  <span className="badge badge-info">{usaha.kategori_usaha}</span>
                  <p className="text-sm text-gray-400 mt-2">{usaha.deskripsi}</p>
                  {usaha.is_charity_friendly && (
                    <span className="badge badge-success mt-2 inline-block">Ã°Å¸Â¤Â Charity Friendly</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Charity Tab */}
      {activeTab === 'charity' && (
        <div>
          {charityList.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">Ã°Å¸Å½Â</div>
                <p className="empty-state-title">Belum ada jasa volunteer</p>
                <p className="text-sm text-gray-400">Tawarkan keahlian Anda untuk membantu umat lain</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {charityList.map((charity) => (
                <div key={charity.id} className="card">
                  <h3 className="text-lg font-bold text-gold">{charity.kategori_jasa}</h3>
                  <p className="text-sm text-gray-400 mt-2">{charity.deskripsi_jasa}</p>
                  <div className="flex gap-2 mt-3">
                    <span className={`badge ${charity.is_verified ? 'badge-success' : 'badge-warning'}`}>
                      {charity.is_verified ? 'Ã¢Å“â€¦ Terverifikasi' : 'Ã¢ÂÂ³ Menunggu Verifikasi'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <div className="card">
          <h3 className="card-title mb-4">Ã°Å¸â€Â Jelajahi Usaha & Charity</h3>
          <p className="text-gray-400 mb-4">Fitur ini akan menampilkan rekomendasi AI berdasarkan profil Anda.</p>
          <div className="alert alert-info">
            <p>Ã°Å¸Â¤â€“ AI Matching Engine akan aktif setelah Anda melengkapi data usaha dan keahlian Anda.</p>
          </div>
        </div>
      )}
    </div>
  );
}