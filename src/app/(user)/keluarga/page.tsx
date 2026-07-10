'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Keluarga {
  id: string;
  no_kk: string;
  kepala_keluarga_nama: string;
  alamat_lengkap: string;
  rt: string;
  rw: string;
  kelurahan: string;
  anggota: any[];
}

export default function KeluargaPage() {
  const [keluarga, setKeluarga] = useState<Keluarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchKeluarga();
  }, [supabase]);

  const fetchKeluarga = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const { data: keluargaData } = await supabase
          .from('keluarga')
          .select('*, anggota_keluarga(* )')
          .or(`kepala_keluarga_id.eq.${profile.id},id.in.(SELECT keluarga_id FROM anggota_keluarga WHERE profile_id = ${profile.id})`);
        
        setKeluarga(keluargaData || []);
      }
    }
    setLoading(false);
  };

  const handleAddKeluarga = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return;

    const { data: newKeluarga, error } = await supabase
      .from('keluarga')
      .insert({
        no_kk: formData.get('no_kk') as string,
        kepala_keluarga_nama: formData.get('kepala_keluarga_nama') as string,
        kepala_keluarga_id: profile.id,
        alamat_lengkap: formData.get('alamat_lengkap') as string,
        rt: formData.get('rt') as string,
        rw: formData.get('rw') as string,
        kelurahan: formData.get('kelurahan') as string,
        kecamatan: formData.get('kecamatan') as string,
        kota: formData.get('kota') as string,
        provinsi: formData.get('provinsi') as string,
        jumlah_anggota: parseInt(formData.get('jumlah_anggota') as string) || 1,
      })
      .select()
      .single();

    if (newKeluarga && !error) {
      // Add kepala as anggota
      await supabase
        .from('anggota_keluarga')
        .insert({
          keluarga_id: newKeluarga.id,
          profile_id: profile.id,
          hubungan_keluarga: 'kepala'
        });
      
      await fetchKeluarga();
      setShowForm(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ã°Å¸â€˜Â¨Ã¢â‚¬ÂÃ°Å¸â€˜Â©Ã¢â‚¬ÂÃ°Å¸â€˜Â§Ã¢â‚¬ÂÃ°Å¸â€˜Â¦ Keluarga</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Ã¢ÂÅ’ Batal' : '+ Tambah Keluarga'}
        </button>
      </div>

      {/* Add Keluarga Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="card-title mb-4">Tambah Kartu Keluarga</h3>
          <form onSubmit={handleAddKeluarga}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">No KK *</label>
                <input name="no_kk" required className="form-input" placeholder="16 digit" />
              </div>
              <div className="form-group">
                <label className="form-label">Kepala Keluarga *</label>
                <input name="kepala_keluarga_nama" required className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Alamat</label>
                <textarea name="alamat_lengkap" className="form-textarea" />
              </div>
              <div className="form-group">
                <label className="form-label">RT / RW</label>
                <div className="flex gap-2">
                  <input name="rt" className="form-input" placeholder="RT" />
                  <input name="rw" className="form-input" placeholder="RW" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Kelurahan</label>
                <input name="kelurahan" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Kecamatan</label>
                <input name="kecamatan" className="form-input" defaultValue="BALIKPAPAN SELATAN" />
              </div>
              <div className="form-group">
                <label className="form-label">Kota</label>
                <input name="kota" className="form-input" defaultValue="BALIKPAPAN" />
              </div>
              <div className="form-group">
                <label className="form-label">Provinsi</label>
                <input name="provinsi" className="form-input" defaultValue="KALIMANTAN TIMUR" />
              </div>
              <div className="form-group">
                <label className="form-label">Jumlah Anggota</label>
                <input type="number" name="jumlah_anggota" className="form-input" defaultValue="1" min="1" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary mt-4">Ã°Å¸â€™Â¾ Simpan KK</button>
          </form>
        </div>
      )}

      {/* Keluarga List */}
      {keluarga.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">Ã°Å¸â€˜Â¨Ã¢â‚¬ÂÃ°Å¸â€˜Â©Ã¢â‚¬ÂÃ°Å¸â€˜Â§Ã¢â‚¬ÂÃ°Å¸â€˜Â¦</div>
            <p className="empty-state-title">Belum ada data keluarga</p>
            <p className="text-sm text-gray-400">Klik tombol + Tambah Keluarga untuk memulai</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {keluarga.map((kk) => (
            <div key={kk.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gold">{kk.kepala_keluarga_nama}</h3>
                  <p className="text-sm text-gray-400">KK: {kk.no_kk}</p>
                  <p className="text-sm text-gray-400">
                    {kk.alamat_lengkap}, RT {kk.rt}/RW {kk.rw}, {kk.kelurahan}
                  </p>
                </div>
                <span className="badge badge-info">{kk.anggota?.length || 0} anggota</span>
              </div>

              {/* Anggota List */}
              {kk.anggota && kk.anggota.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Anggota Keluarga:</h4>
                  <div className="space-y-2">
                    {kk.anggota.map((anggota: any) => (
                      <div key={anggota.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="avatar-sm">
                            {anggota.profiles?.full_name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-semibold">{anggota.profiles?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-gray-400 capitalize">{anggota.hubungan_keluarga}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}