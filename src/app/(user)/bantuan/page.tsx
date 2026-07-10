'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Bantuan {
  id: string;
  need_type: string;
  description: string;
  urgency_level: string;
  status: string;
  ai_recommended_match_score: number;
}

export default function BantuanPage() {
  const [bantuanList, setBantuanList] = useState<Bantuan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchBantuan();
  }, [supabase]);

  const fetchBantuan = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const { data: bantuanData } = await supabase
          .from('umat_needs')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });
        
        setBantuanList(bantuanData || []);
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

    await supabase
      .from('umat_needs')
      .insert({
        user_id: profile.id,
        need_type: formData.get('need_type') as string,
        description: formData.get('description') as string,
        urgency_level: formData.get('urgency_level') as string,
        status: 'open',
      });

    await fetchBantuan();
    setShowForm(false);
  };

  const getUrgencyBadge = (level: string) => {
    const badges: any = {
      rendah: 'badge-info',
      sedang: 'badge-warning',
      tinggi: 'badge-danger',
      darurat: 'badge-danger'
    };
    return badges[level] || 'badge-info';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ã°Å¸â€ Ëœ Bantuan & Kebutuhan</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Ã¢ÂÅ’ Batal' : '+ Minta Bantuan'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="card-title mb-4">Minta Bantuan</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Jenis Bantuan *</label>
                <select name="need_type" required className="form-select">
                  <option value="material">Bantuan Material</option>
                  <option value="pekerjaan">Pekerjaan</option>
                  <option value="pendidikan">Pendidikan</option>
                  <option value="kesehatan">Kesehatan</option>
                  <option value="psikologis">Konseling Psikologis</option>
                  <option value="spiritual">Pendampingan Spiritual</option>
                  <option value="barang">Barang</option>
                  <option value="jasa">Jasa</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tingkat Urgensi *</label>
                <select name="urgency_level" required className="form-select">
                  <option value="rendah">Rendah</option>
                  <option value="sedang">Sedang</option>
                  <option value="tinggi">Tinggi</option>
                  <option value="darurat">Darurat</option>
                </select>
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Deskripsi Kebutuhan *</label>
                <textarea name="description" required className="form-textarea" placeholder="Jelaskan bantuan yang Anda butuhkan..." />
              </div>
            </div>
            <button type="submit" className="btn btn-primary mt-4">Ã°Å¸â€œÂ® Kirim Permintaan</button>
          </form>
        </div>
      )}

      {/* List */}
      {bantuanList.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">Ã°Å¸â€ Ëœ</div>
            <p className="empty-state-title">Belum ada permintaan bantuan</p>
            <p className="text-sm text-gray-400">Klik tombol + Minta Bantuan jika membutuhkan</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {bantuanList.map((bantuan) => (
            <div key={bantuan.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gold">{bantuan.need_type}</h3>
                  <p className="text-sm text-gray-400 mt-1">{bantuan.description}</p>
                </div>
                <span className={`badge ${getUrgencyBadge(bantuan.urgency_level)}`}>
                  {bantuan.urgency_level}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`badge ${bantuan.status === 'open' ? 'badge-warning' : 'badge-success'}`}>
                  {bantuan.status === 'open' ? 'Ã°Å¸Å¸Â¡ Menunggu' : 'Ã°Å¸Å¸Â¢ Terpenuhi'}
                </span>
                {bantuan.ai_recommended_match_score && (
                  <span className="text-sm text-gold">
                    Ã°Å¸Â¤â€“ AI Match: {(bantuan.ai_recommended_match_score * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}