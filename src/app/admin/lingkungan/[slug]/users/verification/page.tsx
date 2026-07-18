'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface PendingUser {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  created_at: string;
  umat_staging?: {
    nama_lengkap: string;
    nik: string | null;
    jenis_kelamin: string | null;
    tempat_lahir: string | null;
    tanggal_lahir: string | null;
    alamat: string | null;
  } | null;
}

export default function LingkunganUserVerificationPage() {
  const params = useParams();
  const slug = params?.slug || 'ar';
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    nik: '',
    gender: '',
    place_of_birth: '',
    date_of_birth: '',
    address: '',
  });

  const getLingkunganName = (s: string | string[]) => {
    switch (s) {
      case 'ar': return 'St. Andreas Rasul';
      case 'fa': return 'St. Fransiskus Asisi';
      case 'mrr': return 'St. Maria Ratu Rosari';
      case 'al': return 'St. Albertus';
      case 'msr': return 'St. Maria Salve Regina';
      case 'an': return 'St. Anna';
      case 'cl': return 'St. Clara';
      case 'mn': return 'St. Monica';
      case 'tdl': return 'St. Theresia dari Lisieux';
      case 'tda': return 'St. Theresia dari Avila';
      case 'gb': return 'St. Gabriel';
      case 'mls': return 'St. Maria La Salette';
      case 'mi': return 'St. Maria Immaculata';
      case 'lp': return 'St. Lukas Penginjil';
      case 'yp': return 'St. Yosef Pekerja';
      case 'sy': return 'Stasi St. Yosef';
      case 'rr': return 'Stasi Ratu Rosari';
      default: return 'Lingkungan/Stasi';
    }
  };

  useEffect(() => {
    loadPendingUsers();
  }, [slug]);

  async function loadPendingUsers() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email, address, created_at')
        .eq('lingkungan_slug', slug)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading pending users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleOCRUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;

    setOcrProcessing(true);
    try {
      const supabase = createClient();
      
      // Upload image to R2
      const fileExt = file.name.split('.').pop();
      const fileName = `ocr-${selectedUser.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Call OCR API
      const formData = new FormData();
      formData.append('image', file);

      const ocrResponse = await fetch('/api/admin/ocr-extract', {
        method: 'POST',
        body: formData,
      });

      if (!ocrResponse.ok) {
        throw new Error('OCR processing failed');
      }

      const ocrData = await ocrResponse.json();
      
      // Auto-fill form with extracted data
      setFormData({
        full_name: ocrData.nama || selectedUser.full_name || '',
        nik: ocrData.nik || '',
        gender: ocrData.jenis_kelamin || '',
        place_of_birth: ocrData.tempat_lahir || '',
        date_of_birth: ocrData.tanggal_lahir || '',
        address: ocrData.alamat || selectedUser.address || '',
      });

      alert('Data berhasil diekstrak! Silakan periksa dan perbaiki jika diperlukan.');
    } catch (error) {
      console.error('OCR error:', error);
      alert('Gagal memproses OCR. Silakan isi form manually.');
    } finally {
      setOcrProcessing(false);
    }
  }

  async function handleVerify(userId: string) {
    setProcessing(userId);
    try {
      const supabase = createClient();
      
      // Update profile with verified data
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          nik: formData.nik || null,
          gender: formData.gender || null,
          place_of_birth: formData.place_of_birth || null,
          date_of_birth: formData.date_of_birth || null,
          address: formData.address || null,
          status: 'active',
          verified_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      alert('Umat berhasil diverifikasi dan diaktifkan');
      setSelectedUser(null);
      loadPendingUsers();
    } catch (error) {
      console.error('Error verifying user:', error);
      alert('Gagal memverifikasi user');
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(userId: string) {
    if (!confirm('Yakin ingin menolak pendaftaran ini?')) return;
    
    setProcessing(userId);
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      alert('Pendaftaran ditolak');
      loadPendingUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Gagal menolak pendaftaran');
    } finally {
      setProcessing(null);
    }
  }

  const openVerificationModal = (user: PendingUser) => {
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name || '',
      nik: user.umat_staging?.nik || '',
      gender: user.umat_staging?.jenis_kelamin || '',
      place_of_birth: user.umat_staging?.tempat_lahir || '',
      date_of_birth: user.umat_staging?.tanggal_lahir || '',
      address: user.address || user.umat_staging?.alamat || '',
    });
  };

  if (loading) {
    return <div className="admin-container"><div className="admin-section"><p>Memuat data...</p></div></div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header">
          <h2>Verifikasi Umat Lingkungan {getLingkunganName(slug)}</h2>
          <a href={`/admin/lingkungan/${slug}/dashboard`}>Kembali</a>
        </div>

        <div className="admin-card">
          <h3>Daftar Umat Menunggu Verifikasi ({users.length})</h3>
          <p>Tinjau dan verifikasi pendaftaran umat baru. Upload KTP/KK untuk auto-fill data menggunakan OCR.</p>
        </div>

        {users.length === 0 ? (
          <div className="admin-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--color-stone)' }}>Tidak ada umat yang menunggu verifikasi</p>
          </div>
        ) : (
          <div className="admin-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>No. WhatsApp</th>
                  <th>Tanggal Daftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.full_name}</td>
                    <td>{user.phone}</td>
                    <td>{new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                    <td>
                      <button
                        onClick={() => openVerificationModal(user)}
                        className="btn-admin-primary"
                        style={{ marginRight: '0.5rem' }}
                      >
                        Verifikasi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Verification Modal */}
        {selectedUser && (
          <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h3>Verifikasi Pendaftaran Umat</h3>
                <button onClick={() => setSelectedUser(null)} className="modal-close">&times;</button>
              </div>
              <div className="modal-body">
                {/* OCR Upload */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(74, 107, 138, 0.1)', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>Auto-fill dengan OCR</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-stone)', marginBottom: '0.5rem' }}>
                    Upload KTP atau KK untuk mengisi form otomatis
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleOCRUpload}
                    disabled={ocrProcessing}
                    style={{ marginBottom: '0.5rem' }}
                  />
                  {ocrProcessing && <p style={{ fontSize: '0.85rem', color: 'var(--color-gold)' }}>Memproses OCR...</p>}
                </div>

                {/* Form */}
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Nama Lengkap <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      NIK
                    </label>
                    <input
                      type="text"
                      value={formData.nik}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      maxLength={16}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                        Jenis Kelamin
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)' }}
                      >
                        <option value="">Pilih</option>
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                        Tempat Lahir
                      </label>
                      <input
                        type="text"
                        value={formData.place_of_birth}
                        onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Alamat <span style={{ color: 'red' }}>*</span>
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      required
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(200, 169, 110, 0.3)', resize: 'vertical' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="btn-secondary"
                    style={{ padding: '0.75rem 1.5rem' }}
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleReject(selectedUser.id)}
                    disabled={processing === selectedUser.id}
                    className="btn-admin-danger"
                    style={{ padding: '0.75rem 1.5rem' }}
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() => handleVerify(selectedUser.id)}
                    disabled={processing === selectedUser.id}
                    className="btn-admin-primary"
                    style={{ padding: '0.75rem 1.5rem' }}
                  >
                    {processing === selectedUser.id ? 'Menyimpan...' : 'Verifikasi & Aktifkan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}