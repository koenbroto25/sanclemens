'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type AnggotaKeluarga = {
  id: string;
  nama: string;
  nama_baptis: string | null;
  jenis_kelamin: string | null;
  hubungan_keluarga: string;
  umur: number | null;
  status: string;
  registered_profile_id: string | null;
};

type Keluarga = {
  id: string;
  no_kk: string;
  kepala_keluarga_nama: string;
  alamat_lengkap: string | null;
  lingkungan: { nama: string; slug: string } | null;
};

export default function WaliDigitalPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [noKk, setNoKk] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [keluarga, setKeluarga] = useState<Keluarga | null>(null);
  const [anggota, setAnggota] = useState<AnggotaKeluarga[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setUser(user);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*, is_wali_digital, wali_digital_id')
      .eq('id', user.id)
      .single();

    if (!profileData) {
      router.push('/auth/login');
      return;
    }

    setProfile(profileData);

    if (profileData.is_wali_digital) {
      loadWaliFamily(profileData.id);
    }

    setLoading(false);
  };

  const loadWaliFamily = async (waliId: string) => {
    const { data: wakilans } = await supabase
      .from('profiles')
      .select('*')
      .eq('wali_digital_id', waliId)
      .eq('role', 'umat')
      .eq('status', 'active');

    if (wakilans && wakilans.length > 0) {
      setShowForm(true);
      setMessage({ type: 'success', text: `Anda adalah Wali Digital untuk ${wakilans.length} anggota keluarga` });
    }
  };

  const handleCheckKk = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/check-kk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomor_kk: noKk })
      });

      const result = await response.json();

      if (result.found) {
        setKeluarga(result.keluarga);
        setAnggota(result.anggota);
        setShowForm(true);
        setMessage({ type: 'success', text: result.message });
      } else {
        setKeluarga(null);
        setAnggota([]);
        setShowForm(false);
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat memeriksa No KK' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const [registrationResults, setRegistrationResults] = useState<any[] | null>(null);

  const handleRegisterFamily = async () => {
    if (selectedIds.size === 0) {
      setMessage({ type: 'error', text: 'Pilih minimal satu anggota keluarga' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setRegistrationResults(null);

    try {
      const selectedAnggota = anggota.filter(a => selectedIds.has(a.id));

      const response = await fetch('/api/auth/register-family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wali_id: user.id,
          keluarga_id: keluarga?.id,
          selected_anggota: selectedAnggota.map(a => ({
            staging_id: a.id,
            nama: a.nama,
            nama_baptis: a.nama_baptis,
            no_kk: keluarga?.no_kk,
            hubungan: a.hubungan_keluarga
          }))
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: result.message || 'Pendaftaran berhasil!' });
        setRegistrationResults(result.results || []);
        // Refresh data
        await checkUser();
      } else {
        setMessage({ type: 'error', text: result.error || 'Pendaftaran gagal' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan server' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  const getHubunganLabel = (hubungan: string) => {
    const labels: Record<string, string> = {
      'kepala': 'Kepala Keluarga',
      'istri': 'Istri',
      'anak': 'Anak',
      'ortu': 'Orang Tua',
      'famili_lain': 'Famili Lain'
    };
    return labels[hubungan] || hubungan;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Ã¢â€ Â Kembali ke Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Wali Digital - Manajemen Keluarga
          </h1>
          <p className="text-gray-600 mb-4">
            Selamat datang, <span className="font-semibold">{profile?.full_name}</span>
          </p>

          {profile?.is_wali_digital ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800">
                Ã¢Å“â€¦ Anda terdaftar sebagai Wali Digital
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Anda dapat mengelola akun anggota keluarga yang Anda wali
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                Ã¢â€žÂ¹Ã¯Â¸Â Anda belum terdaftar sebagai Wali Digital
              </p>
              <p className="text-sm text-yellow-600 mt-1">
                Masukkan Nomor KK untuk mendaftarkan keluarga Anda
              </p>
            </div>
          )}

          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {!showForm ? (
            <form onSubmit={handleCheckKk} className="space-y-4">
              <div>
                <label htmlFor="noKk" className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Kartu Keluarga (KK)
                </label>
                <input
                  type="text"
                  id="noKk"
                  value={noKk}
                  onChange={(e) => setNoKk(e.target.value)}
                  placeholder="Contoh: 647101xxxx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Mencari...' : 'Cari Data Keluarga'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {keluarga && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Data Keluarga
                  </h2>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">No. KK:</span>
                      <p className="font-medium">{keluarga.no_kk}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Kepala Keluarga:</span>
                      <p className="font-medium">{keluarga.kepala_keluarga_nama}</p>
                    </div>
                    {keluarga.alamat_lengkap && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Alamat:</span>
                        <p className="font-medium">{keluarga.alamat_lengkap}</p>
                      </div>
                    )}
                    {keluarga.lingkungan && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Lingkungan:</span>
                        <p className="font-medium">{keluarga.lingkungan.nama}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {anggota.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Anggota Keluarga ({anggota.length} orang)
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Pilih anggota keluarga yang akan didaftarkan untuk di-wali
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {anggota.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedIds.has(item.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleSelect(item.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selectedIds.has(item.id)
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedIds.has(item.id) && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.nama_baptis || item.nama}
                            </p>
                            {item.nama_baptis && item.nama_baptis !== item.nama && (
                              <p className="text-xs text-gray-500">{item.nama}</p>
                            )}
                            <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
                              <span className="bg-gray-100 px-2 py-1 rounded">
                                {getHubunganLabel(item.hubungan_keluarga)}
                              </span>
                              {item.jenis_kelamin && (
                                <span className="bg-gray-100 px-2 py-1 rounded">
                                  {item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                </span>
                              )}
                              {item.umur && (
                                <span className="bg-gray-100 px-2 py-1 rounded">
                                  {item.umur} tahun
                                </span>
                              )}
                              {item.registered_profile_id && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Sudah terdaftar
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedIds.size > 0 && (
                    <div className="mt-4 flex space-x-3">
                      <button
                        onClick={() => setSelectedIds(new Set())}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Batal Pilih
                      </button>
                      <button
                        onClick={() => {
                          const allIds = new Set(anggota.filter(a => !a.registered_profile_id).map(a => a.id));
                          setSelectedIds(allIds);
                        }}
                        className="px-4 py-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50"
                      >
                        Pilih Semua yang Belum Terdaftar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selectedIds.size > 0 && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={handleRegisterFamily}
                    disabled={submitting}
                    className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Mendaftarkan...' : `Daftarkan ${selectedIds.size} Anggota`}
                  </button>
                </div>
              )}

              {/* Registration Results */}
              {registrationResults && registrationResults.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">
                    Detail Akun yang Dibuat
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {registrationResults.map((result, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-green-200">
                        <p className="font-medium text-gray-900">{result.nama}</p>
                        {result.status === 'created' && (
                          <div className="mt-2 text-sm space-y-1">
                            <p className="text-gray-700">
                              <span className="font-medium">Username:</span>{' '}
                              <code className="bg-gray-100 px-2 py-1 rounded">{result.username}</code>
                            </p>
                            <p className="text-gray-700">
                              <span className="font-medium">Password:</span>{' '}
                              <code className="bg-gray-100 px-2 py-1 rounded">{result.password}</code>
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Simpan kredensial ini dan berikan kepada anggota keluarga
                            </p>
                          </div>
                        )}
                        {result.status === 'linked' && (
                          <p className="text-sm text-green-700 mt-1">
                            Ã¢Å“â€¦ Akun existing berhasil dihubungkan
                          </p>
                        )}
                        {result.status === 'error' && (
                          <p className="text-sm text-red-600 mt-1">
                            Ã¢ÂÅ’ Error: {result.error}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}