'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  UploadIcon,
  SearchIcon,
  Loader2Icon,
  CheckCircle2Icon,
  AlertCircleIcon,
  FileTextIcon,
  UserPlusIcon,
  ArrowLeftIcon,
} from 'lucide-react';

const FONTS = {
  heading: "'Cormorant Garamond', Georgia, serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
};

type TabType = 'lookup' | 'ocr' | 'manual';

export default function LingkunganPendaftaranUmatPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('lookup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [matchedFamilies, setMatchedFamilies] = useState<any[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<any>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    noKk: '',
    nik: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: '',
    alamat: '',
    pekerjaan: '',
    pendidikan: '',
    documentType: 'MANUAL',
    extractedData: null as any,
  });

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/check-kk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nomor_kk: formData.noKk,
          nama_lengkap: formData.fullName 
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal cek database');
      if (json.found && json.families?.length > 0) {
        // Filter: hanya keluarga di lingkungan ini
        const filtered = json.families.filter((f: any) => 
          f.lingkungan?.slug?.toLowerCase() === slug.toLowerCase()
        );
        if (filtered.length > 0) {
          setMatchedFamilies(filtered);
        } else {
          setError('Data keluarga ditemukan, tetapi bukan di lingkungan ini');
        }
      } else {
        setError('Data tidak ditemukan di database');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFamily = (family: any) => {
    setSelectedFamily(family);
    if (family.profiles?.[0]) {
      const profile = family.profiles[0];
      setFormData(prev => ({
        ...prev,
        fullName: profile.full_name || '',
        phone: profile.phone || '',
      }));
    }
  };

  const handleOCRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setError('');
    try {
      const formDataOCR = new FormData();
      formDataOCR.append('document', file);
      formDataOCR.append('documentType', 'AUTO');

      const res = await fetch('/api/admin/ocr-extract', {
        method: 'POST',
        body: formDataOCR,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal ekstrak OCR');
      
      setOcrResult(json);
      
      const extracted = json.extractedData;
      setFormData(prev => ({
        ...prev,
        fullName: extracted.nama || extracted.nama_baptis || prev.fullName,
        nik: extracted.nik || prev.nik,
        noKk: extracted.no_kk || prev.noKk,
        tempatLahir: extracted.tempat_lahir || prev.tempatLahir,
        tanggalLahir: extracted.tanggal_lahir || prev.tanggalLahir,
        jenisKelamin: extracted.jenis_kelamin || prev.jenisKelamin,
        alamat: extracted.alamat || prev.alamat,
        documentType: json.documentType,
        extractedData: extracted,
      }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/register-umat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          password: formData.password,
          familyId: selectedFamily?.id,
          noKkGereja: selectedFamily?.nomor_kk_gereja,
          documentType: formData.documentType,
          extractedData: formData.extractedData,
          lingkungan_slug: slug, // Force to current lingkungan
          access_layer: 2,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mendaftar umat');
      
      setSuccess(`Berhasil mendaftarkan ${formData.fullName}. OTP telah dikirim ke WhatsApp.`);
      setFormData({
        fullName: '',
        phone: '',
        password: '',
        confirmPassword: '',
        noKk: '',
        nik: '',
        tempatLahir: '',
        tanggalLahir: '',
        jenisKelamin: '',
        alamat: '',
        pekerjaan: '',
        pendidikan: '',
        documentType: 'MANUAL',
        extractedData: null,
      });
      setSelectedFamily(null);
      setOcrResult(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(to bottom, var(--color-parchment, #f8f1e2), var(--color-cream, #f5f0e8))' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href={`/admin/lingkungan/${slug}/dashboard`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/60 hover:bg-white border border-[rgba(200,169,110,0.2)] text-sm font-medium transition-all">
            <ArrowLeftIcon className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
          <div className="text-right">
            <h1 className="text-2xl font-semibold" style={{ fontFamily: FONTS.heading, color: 'var(--color-text-dark, #1a0e05)' }}>
              Pendaftaran Umat
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-stone, #8b7355)' }}>
              Lingkungan: <span className="font-semibold">{slug.toUpperCase()}</span>
            </p>
          </div>
        </div>

        {/* Error/Success Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-lg flex items-start gap-3 border" style={{ background: 'rgba(139,38,53,0.08)', borderColor: 'rgba(139,38,53,0.2)', color: 'var(--color-error, #8b2635)' }}>
            <AlertCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg flex items-start gap-3 border" style={{ background: 'rgba(74,140,92,0.08)', borderColor: 'rgba(74,140,92,0.2)', color: 'var(--color-success, #4a8c5c)' }}>
            <CheckCircle2Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Main Card */}
        <div className="rounded-2xl border border-[rgba(200,169,110,0.15)] p-6 md:p-8" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)' }}>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-[rgba(200,169,110,0.2)]">
            <button
              onClick={() => setActiveTab('lookup')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                activeTab === 'lookup' 
                  ? 'border-[var(--color-gold, #c8a96e)] text-[var(--color-text-dark)]' 
                  : 'border-transparent text-[var(--color-stone)] hover:text-[var(--color-text-dark)]'
              }`}
            >
              <SearchIcon className="inline h-4 w-4 mr-2" />
              Cari di Database
            </button>
            <button
              onClick={() => setActiveTab('ocr')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                activeTab === 'ocr' 
                  ? 'border-[var(--color-gold, #c8a96e)] text-[var(--color-text-dark)]' 
                  : 'border-transparent text-[var(--color-stone)] hover:text-[var(--color-text-dark)]'
              }`}
            >
              <UploadIcon className="inline h-4 w-4 mr-2" />
              Scan Dokumen
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                activeTab === 'manual' 
                  ? 'border-[var(--color-gold, #c8a96e)] text-[var(--color-text-dark)]' 
                  : 'border-transparent text-[var(--color-stone)] hover:text-[var(--color-text-dark)]'
              }`}
            >
              <FileTextIcon className="inline h-4 w-4 mr-2" />
              Input Manual
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tab 1: Lookup */}
            {activeTab === 'lookup' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nomor KK Gereja</label>
                  <input
                    type="text"
                    value={formData.noKk}
                    onChange={(e) => setFormData(prev => ({ ...prev, noKk: e.target.value }))}
                    placeholder="Contoh: 64.12.01.xxxxx"
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{ borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Nama sesuai KK"
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{ borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #dfc493, var(--color-gold, #c8a96e))', color: 'var(--color-primary, #1a0e05)' }}
                >
                  {loading ? <Loader2Icon className="animate-spin h-4 w-4" /> : <SearchIcon className="h-4 w-4" />}
                  Cari Data
                </button>

                {matchedFamilies.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Data keluarga ditemukan di lingkungan ini:</p>
                    {matchedFamilies.map((family, idx) => (
                      <div 
                        key={family.id || idx}
                        onClick={() => handleSelectFamily(family)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedFamily?.id === family.id ? 'border-[var(--color-gold)] bg-[rgba(200,169,110,0.1)]' : 'border-[rgba(200,169,110,0.2)] hover:bg-white/50'
                        }`}
                      >
                        <p className="font-semibold">{family.kepala_keluarga_nama}</p>
                        <p className="text-xs text-[var(--color-stone)]">KK: {family.no_kk}</p>
                        <p className="text-xs text-[var(--color-stone)]">{family.alamat_lengkap}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: OCR */}
            {activeTab === 'ocr' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-[rgba(200,169,110,0.3)] rounded-lg p-8 text-center">
                  <UploadIcon className="mx-auto h-12 w-12 text-[var(--color-stone)] mb-3" />
                  <label className="cursor-pointer">
                    <span className="text-sm font-medium text-[var(--color-gold-deep)]">Upload dokumen (KTP/KK/Surat Baptis)</span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleOCRUpload} />
                  </label>
                  <p className="text-xs text-[var(--color-stone)] mt-2">Format: JPG, PNG, PDF. Maks 5MB</p>
                </div>

                {ocrLoading && (
                  <div className="text-center py-4">
                    <Loader2Icon className="animate-spin h-8 w-8 mx-auto text-[var(--color-gold)]" />
                    <p className="text-sm text-[var(--color-stone)] mt-2">Memproses OCR...</p>
                  </div>
                )}

                {ocrResult && (
                  <div className="p-4 rounded-lg border" style={{ background: 'rgba(74,140,92,0.08)', borderColor: 'rgba(74,140,92,0.2)' }}>
                    <div className="flex items-start gap-3">
                      <CheckCircle2Icon className="h-5 w-5 mt-0.5 text-[var(--color-success)]" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Tipe Dokumen: <span className="text-[var(--color-success)]">{ocrResult.documentType}</span></p>
                        <p className="text-xs text-[var(--color-stone)] mt-1">Confidence: {Math.round(ocrResult.confidence * 100)}%</p>
                        <div className="mt-3 space-y-2 text-sm">
                          {ocrResult.extractedData.nik && <p>NIK: {ocrResult.extractedData.nik}</p>}
                          {ocrResult.extractedData.nama && <p>Nama: {ocrResult.extractedData.nama}</p>}
                          {ocrResult.extractedData.nama_baptis && <p>Nama Baptis: {ocrResult.extractedData.nama_baptis}</p>}
                          {ocrResult.extractedData.no_kk && <p>No KK: {ocrResult.extractedData.no_kk}</p>}
                          {ocrResult.extractedData.alamat && <p>Alamat: {ocrResult.extractedData.alamat}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Manual */}
            {activeTab === 'manual' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Nama Lengkap *</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                      className="w-full px-4 py-3 rounded-lg border"
                      style={{ borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Nomor WhatsApp *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      required
                      placeholder="08xxxxxxxxxx"
                      className="w-full px-4 py-3 rounded-lg border"
                      style={{ borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Password *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      className="w-full px-4 py-3 rounded-lg border"
                      style={{ borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Konfirmasi Password *</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      className="w-full px-4 py-3 rounded-lg border"
                      style={{ borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">NIK</label>
                    <input
                      type="text"
                      value={formData.nik}
                      onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value }))}
                      placeholder="16 digit"
                      className="w-full px-4 py-3 rounded-lg border"
                      style={{ borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Tempat Lahir</label>
                    <input
                      type="text"
                      value={formData.tempatLahir}
                      onChange={(e) => setFormData(prev => ({ ...prev, tempatLahir: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border"
                      style={{ borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={formData.tanggalLahir}
                      onChange={(e) => setFormData(prev => ({ ...prev, tanggalLahir: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border"
                      style={{ borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Jenis Kelamin</label>
                    <select
                      value={formData.jenisKelamin}
                      onChange={(e) => setFormData(prev => ({ ...prev, jenisKelamin: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border"
                      style={{ borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)' }}
                    >
                      <option value="">Pilih</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Alamat</label>
                    <textarea
                      value={formData.alamat}
                      onChange={(e) => setFormData(prev => ({ ...prev, alamat: e.target.value }))}
                      rows={2}
                      className="w-full px-4 py-3 rounded-lg border"
                      style={{ borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Pekerjaan</label>
                    <input
                      type="text"
                      value={formData.pekerjaan}
                      onChange={(e) => setFormData(prev => ({ ...prev, pekerjaan: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border"
                      style={{ borderColor: 'rgba(200,169,110,0.2)', background: 'var(--color-parchment, #f8f1e2)' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg font-semibold text-sm uppercase tracking-wide transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ 
                background: 'linear-gradient(135deg, #dfc493, var(--color-gold, #c8a96e))',
                color: 'var(--color-primary, #1a0e05)',
                boxShadow: '0 4px 18px rgba(200,169,110,0.28)'
              }}
            >
              {loading ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <UserPlusIcon className="h-4 w-4" />
                  Daftarkan & Kirim OTP
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}