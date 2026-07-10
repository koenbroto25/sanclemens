'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Usaha {
  id: string;
  nama_usaha: string;
  kategori_usaha: string;
  deskripsi: string;
  alamat_usaha: string;
  no_wa: string;
  is_active: boolean;
  is_charity_friendly: boolean;
  jam_operasional?: string;
  radius_layanan?: number;
  service_radius_km?: number;
  can_deliver?: boolean;
  charity_discount_percentage?: number;
}

export default function UsahaPage() {
  const [usahaList, setUsahaList] = useState<Usaha[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchUsaha();
  }, [supabase]);

  const fetchUsaha = async () => {
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
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });
        
        setUsahaList(usahaData || []);
      }
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

    const usahaData = {
      user_id: profile.id,
      nama_usaha: formData.get('nama_usaha') as string,
      kategori_usaha: formData.get('kategori_usaha') as string,
      deskripsi: formData.get('deskripsi') as string,
      alamat_usaha: formData.get('alamat_usaha') as string,
      no_wa: formData.get('no_wa') as string,
      jam_operasional: formData.get('jam_operasional') as string,
      can_deliver: Boolean(formData.get('can_deliver')),
      service_radius_km: parseInt(formData.get('service_radius_km') as string) || 5,
      is_charity_friendly: Boolean(formData.get('is_charity_friendly')),
      charity_discount_percentage: parseInt(formData.get('charity_discount_percentage') as string) || 0,
    };

    if (editingId) {
      await supabase.from('usaha_umat').update(usahaData).eq('id', editingId);
    } else {
      await supabase.from('usaha_umat').insert(usahaData);
    }

    await fetchUsaha();
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (usaha: Usaha) => {
    setEditingId(usaha.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus usaha ini?')) return;
    await supabase.from('usaha_umat').delete().eq('id', id);
    await fetchUsaha();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ã°Å¸â€™Â¼ Usaha Saya</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="btn btn-primary">
          {showForm ? 'Ã¢ÂÅ’ Batal' : '+ Tambah Usaha'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="card-title mb-4">{editingId ? 'Edit Usaha' : 'Tambah Usaha Baru'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Nama Usaha *</label>
                <input name="nama_usaha" required defaultValue={editingId ? usahaList.find(u => u.id === editingId)?.nama_usaha : ''} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Kategori *</label>
                <select name="kategori_usaha" required defaultValue={editingId ? usahaList.find(u => u.id === editingId)?.kategori_usaha : ''} className="form-select">
                  <option value="">Pilih Kategori</option>
                  <option value="supplier_sembako">Supplier Sembako</option>
                  <option value="bengkel">Bengkel</option>
                  <option value="kuliner">Kuliner</option>
                  <option value="pertanian">Pertanian</option>
                  <option value="jasa_kurir">Jasa Kurir</option>
                  <option value="tukang">Tukang</option>
                  <option value="teknisi">Teknisi</option>
                  <option value="edukasi">Edukasi</option>
                  <option value="kesehatan">Kesehatan</option>
                  <option value="legal">Legal</option>
                  <option value="keuangan">Keuangan</option>
                  <option value="teknologi">Teknologi</option>
                  <option value="kreatif">Kreatif</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Deskripsi</label>
                <textarea name="deskripsi" defaultValue={editingId ? usahaList.find(u => u.id === editingId)?.deskripsi : ''} className="form-textarea" />
              </div>
              <div className="form-group">
                <label className="form-label">Alamat Usaha</label>
                <input name="alamat_usaha" defaultValue={editingId ? usahaList.find(u => u.id === editingId)?.alamat_usaha : ''} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">No WA</label>
                <input name="no_wa" type="tel" defaultValue={editingId ? usahaList.find(u => u.id === editingId)?.no_wa : ''} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Jam Operasional</label>
                <input name="jam_operasional" defaultValue={editingId ? usahaList.find(u => u.id === editingId)?.jam_operasional : ''} className="form-input" placeholder="08:00 - 17:00" />
              </div>
              <div className="form-group">
                <label className="form-label">Radius Layanan (km)</label>
                <input type="number" name="service_radius_km" defaultValue={editingId ? usahaList.find(u => u.id === editingId)?.service_radius_km || 5 : 5} className="form-input" min="1" />
              </div>
              <div className="form-group">
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="can_deliver" defaultChecked={editingId ? usahaList.find(u => u.id === editingId)?.can_deliver : false} />
                  <label className="form-label mb-0">Bisa Antar</label>
                </div>
              </div>
              <div className="form-group">
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="is_charity_friendly" defaultChecked={editingId ? usahaList.find(u => u.id === editingId)?.is_charity_friendly : false} />
                  <label className="form-label mb-0">Ramah Charity</label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Diskon Charity (%)</label>
                <input type="number" name="charity_discount_percentage" defaultValue={editingId ? usahaList.find(u => u.id === editingId)?.charity_discount_percentage || 0 : 0} className="form-input" min="0" max="100" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary mt-4">
              {editingId ? 'Ã°Å¸â€™Â¾ Update' : 'Ã°Å¸â€™Â¾ Simpan'}
            </button>
          </form>
        </div>
      )}

      {/* List */}
      {usahaList.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">Ã°Å¸â€™Â¼</div>
            <p className="empty-state-title">Belum ada usaha</p>
            <p className="text-sm text-gray-400">Klik tombol + Tambah Usaha untuk memulai</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {usahaList.map((usaha) => (
            <div key={usaha.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gold">{usaha.nama_usaha}</h3>
                  <span className="badge badge-info">{usaha.kategori_usaha}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(usaha)} className="text-sm text-gold hover:underline">Ã¢Å“ÂÃ¯Â¸Â</button>
                  <button onClick={() => handleDelete(usaha.id)} className="text-sm text-red-400 hover:underline">Ã°Å¸â€”â€˜Ã¯Â¸Â</button>
                </div>
              </div>
              
              <p className="text-sm text-gray-400 mb-3">{usaha.deskripsi || 'Tidak ada deskripsi'}</p>
              
              <div className="space-y-1 text-sm">
                {usaha.alamat_usaha && <p>Ã°Å¸â€œÂ {usaha.alamat_usaha}</p>}
                {usaha.no_wa && <p>Ã°Å¸â€œÅ¾ {usaha.no_wa}</p>}
                {usaha.jam_operasional && <p>Ã°Å¸â€¢â€™ {usaha.jam_operasional}</p>}
              </div>

              <div className="flex gap-2 mt-3">
                {usaha.is_charity_friendly && (
                  <span className="badge badge-success">Ã°Å¸Â¤Â Charity Friendly</span>
                )}
                {(usaha.charity_discount_percentage ?? 0) > 0 && (
                  <span className="badge badge-warning">Ã°Å¸â€™Â° -{usaha.charity_discount_percentage}%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}