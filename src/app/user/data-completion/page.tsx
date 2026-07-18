'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface StagingData {
  id: string;
  nama_lengkap: string;
  nik: string | null;
  jenis_kelamin: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  alamat: string | null;
  rt: string | null;
  rw: string | null;
  phone: string | null;
  verified: boolean;
  created_at: string;
}

interface ProfileData {
  id: string;
  full_name: string | null;
  nik: string | null;
  gender: string | null;
  place_of_birth: string | null;
  date_of_birth: string | null;
  address: string | null;
  phone: string | null;
}

export default function DataCompletionPage() {
  const [stagingData, setStagingData] = useState<StagingData | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasStagingData, setHasStagingData] = useState(false);

  // Form data for verification
  const [formData, setFormData] = useState({
    full_name: '',
    nik: '',
    gender: '',
    place_of_birth: '',
    date_of_birth: '',
    address: '',
    phone: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Load profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, nik, gender, place_of_birth, date_of_birth, address, phone')
        .eq('id', user.id)
        .single();

      setProfileData(profile || null);

      // Load staging data (umat_staging)
      const { data: staging } = await supabase
        .from('umat_staging')
        .select('*')
        .eq('phone', user.phone)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (staging) {
        setStagingData(staging);
        setHasStagingData(true);
        // Pre-fill form with staging data
        setFormData({
          full_name: staging.nama_lengkap || profile?.full_name || '',
          nik: staging.nik || profile?.nik || '',
          gender: staging.jenis_kelamin || profile?.gender || '',
          place_of_birth: staging.tempat_lahir || profile?.place_of_birth || '',
          date_of_birth: staging.tanggal_lahir || profile?.date_of_birth || '',
          address: staging.alamat || profile?.address || '',
          phone: staging.phone || profile?.phone || '',
        });
      } else {
        setHasStagingData(false);
        // Use profile data if no staging
        if (profile) {
          setFormData({
            full_name: profile.full_name || '',
            nik: profile.nik || '',
            gender: profile.gender || '',
            place_of_birth: profile.place_of_birth || '',
            date_of_birth: profile.date_of_birth || '',
            address: profile.address || '',
            phone: profile.phone || '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMessage({ type: 'error', text: 'Unauthorized' });
        return;
      }

      // Update profile with verified data
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.full_name,
          nik: formData.nik || null,
          gender: formData.gender || null,
          place_of_birth: formData.place_of_birth || null,
          date_of_birth: formData.date_of_birth || null,
          address: formData.address || null,
          phone: formData.phone || user.phone,
          profile_completed: true,
        });

      if (updateError) {
        throw updateError;
      }

      // Mark staging data as verified if exists
      if (stagingData) {
        const { error: stagingError } = await supabase
          .from('umat_staging')
          .update({ verified: true, verified_at: new Date().toISOString() })
          .eq('id', stagingData.id);

        if (stagingError) {
          console.error('Error marking staging as verified:', stagingError);
        }
      }

      setMessage({ type: 'success', text: 'Data berhasil diverifikasi dan disimpan' });
      setHasStagingData(false);
      setStagingData(null);
      await loadData();
    } catch (error) {
      console.error('Error saving verified data:', error);
      setMessage({ type: 'error', text: 'Gagal menyimpan data' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-section">
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Verifikasi Data Profil</h2>
          <a href="/dashboard">Kembali ke Dashboard</a>
        </div>

        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            background: message.type === 'success' ? 'rgba(74, 107, 138, 0.1)' : 'rgba(139, 38, 53, 0.1)',
            color: message.type === 'success' ? 'var(--color-glass-blue)' : '#d4758a',
            fontWeight: 500,
            fontSize: '0.85rem',
          }}>
            {message.text}
          </div>
        )}

        {hasStagingData && stagingData ? (
          <div className="dashboard-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--color-gold)' }}>
            <h3 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Data dari Pencatatan Paroki</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-dark)' }}>
              Kami menemukan data Anda dari pencatatan sebelumnya. Mohon verifikasi dan perbarui data di bawah ini.
            </p>
          </div>
        ) : (
          <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
            <h3>Lengkapi Data Profil</h3>
            <p>Mohon lengkapi data profil Anda untuk mendapatkan akses penuh ke semua fitur.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
          <div className="dashboard-card">
            <h3>Data Pribadi</h3>
            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-dark)' }}>
                  Nama Lengkap <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-dark)' }}>
                  NIK (Nomor Induk Kependudukan)
                </label>
                <input
                  type="text"
                  name="nik"
                  value={formData.nik}
                  onChange={handleInputChange}
                  maxLength={16}
                  placeholder="16 digit NIK"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-dark)' }}>
                    Jenis Kelamin
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)', fontSize: '0.9rem' }}
                  >
                    <option value="">Pilih</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-dark)' }}>
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    name="place_of_birth"
                    value={formData.place_of_birth}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-dark)' }}>
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-dark)' }}>
                  Alamat <span style={{ color: 'red' }}>*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.75rem',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--color-primary)', background: 'var(--color-gold)',
              padding: '0.75rem 2rem', border: 'none', borderRadius: '2px 28px 2px 28px',
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              width: 'fit-content',
            }}
          >
            {saving ? 'Menyimpan...' : hasStagingData ? 'Verifikasi & Simpan Data' : 'Simpan Data'}
          </button>
        </form>
      </div>
    </div>
  );
}