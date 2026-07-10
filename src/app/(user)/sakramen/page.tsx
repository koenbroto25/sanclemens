'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Sakramen {
  id: string;
  jenis_sakramen: string;
  tanggal_sakramen: string;
  tempat_sakramen: string;
  nama_orang_tua_baptis?: string;
  nama_prelat?: string;
}

export default function SakramenPage() {
  const [sakramenList, setSakramenList] = useState<Sakramen[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchSakramen();
  }, [supabase]);

  const fetchSakramen = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const { data: sakramenData } = await supabase
          .from('sakramen_user')
          .select('*')
          .eq('user_id', profile.id)
          .order('tanggal_sakramen', { ascending: false });
        
        setSakramenList(sakramenData || []);
      }
    }
    setLoading(false);
  };

  const handleAddSakramen = async (e: React.FormEvent<HTMLFormElement>) => {
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

    const { error } = await supabase
      .from('sakramen_user')
      .insert({
        user_id: profile.id,
        jenis_sakramen: formData.get('jenis_sakramen') as string,
        tanggal_sakramen: formData.get('tanggal_sakramen') as string,
        tempat_sakramen: formData.get('tempat_sakramen') as string,
        nama_orang_tua_baptis: formData.get('nama_orang_tua_baptis') as string,
        nama_prelat: formData.get('nama_prelat') as string,
        created_by: profile.id,
      });

    if (!error) {
      await fetchSakramen();
      setShowForm(false);
    }
  };

  const getSakramenIcon = (jenis: string) => {
    const icons: any = {
      baptis: 'Ã°Å¸â€™Â§',
      eftar: 'Ã°Å¸â„¢Â',
      koma: 'Ã¢Å“ÂÃ¯Â¸Â',
      penguatan: 'Ã°Å¸â€Â¥',
      matrimonium: 'Ã°Å¸â€™Â',
      ordo: 'Ã¢â€ºÂª',
      batu_kepala: 'Ã°Å¸ÂªÂ¦'
    };
    return icons[jenis] || 'Ã¢Å“Â¨';
  };

  const getSakramenLabel = (jenis: string) => {
    const labels: any = {
      baptis: 'Baptis',
      eftar: 'Efata (Pembukaan Telinga)',
      koma: 'Komuni Pertama',
      penguatan: 'Penguatan (Krisma)',
      matrimonium: 'Matrimonium (Perkawinan)',
      ordo: 'Ordo (Imamat)',
      batu_kepala: 'Minyak Urap (Batu Kepala)'
    };
    return labels[jenis] || jenis;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ã¢Å“ÂÃ¯Â¸Â Riwayat Sakramen</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Ã¢ÂÅ’ Batal' : '+ Tambah Sakramen'}
        </button>
      </div>

      {/* Add Sakramen Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="card-title mb-4">Tambah Sakramen</h3>
          <form onSubmit={handleAddSakramen}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Jenis Sakramen *</label>
                <select name="jenis_sakramen" required className="form-select">
                  <option value="baptis">Baptis</option>
                  <option value="eftar">Efata</option>
                  <option value="koma">Komuni Pertama</option>
                  <option value="penguatan">Penguatan (Krisma)</option>
                  <option value="matrimonium">Matrimonium</option>
                  <option value="ordo">Ordo</option>
                  <option value="batu_kepala">Minyak Urap</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Sakramen *</label>
                <input type="date" name="tanggal_sakramen" required className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Tempat Sakramen *</label>
                <input name="tempat_sakramen" required className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Nama Orang Tua Baptis</label>
                <input name="nama_orang_tua_baptis" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Nama Prelat/Pendamping</label>
                <input name="nama_prelat" className="form-input" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary mt-4">Ã°Å¸â€™Â¾ Simpan Sakramen</button>
          </form>
        </div>
      )}

      {/* Sakramen Timeline */}
      {sakramenList.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">Ã¢Å“ÂÃ¯Â¸Â</div>
            <p className="empty-state-title">Belum ada riwayat sakramen</p>
            <p className="text-sm text-gray-400">Klik tombol + Tambah Sakramen untuk memulai</p>
          </div>
        </div>
      ) : (
        <div className="timeline">
          {sakramenList.map((sakramen) => (
            <div key={sakramen.id} className="timeline-item">
              <div className="card">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{getSakramenIcon(sakramen.jenis_sakramen)}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gold">
                      {getSakramenLabel(sakramen.jenis_sakramen)}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">
                      {new Date(sakramen.tanggal_sakramen).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-sm">Ã°Å¸â€œÂ {sakramen.tempat_sakramen}</p>
                    {sakramen.nama_orang_tua_baptis && (
                      <p className="text-sm text-gray-400">
                        Orang Tua Baptis: {sakramen.nama_orang_tua_baptis}
                      </p>
                    )}
                    {sakramen.nama_prelat && (
                      <p className="text-sm text-gray-400">
                        Prelat: {sakramen.nama_prelat}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}