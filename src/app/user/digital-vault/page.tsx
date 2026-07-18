'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Tipe data dokumen
interface DigitalDocument {
  id: string;
  document_id: string;
  document_type_code: string;
  document_name: string;
  file_name?: string;
  document_type?: string;
  file_size?: number;
  extracted_data?: Record<string, string>;
  ocr_confidence?: number;
  file_url?: string;
  status: 'issued' | 'draft' | 'pending_user_verification' | 'pending_official_approval' | 'revoked';
  pdf_url?: string;
  issued_at?: string;
  issued_by_name?: string;
  icon: string;
}

export default function DigitalVaultPage() {
  const [documents, setDocuments] = useState<DigitalDocument[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<DigitalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [ocrUploadStatus, setOcrUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch issued documents
      const { data: issuedDocs } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'issued')
        .order('created_at', { ascending: false });

      // Fetch pending user verification documents
      const { data: pendingDocs } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending_user_verification')
        .order('created_at', { ascending: false });

      const issuedWithMeta = (issuedDocs || []).map((doc: Record<string, unknown>) => ({
        ...doc,
        document_name: getDocumentTypeName((doc.document_type_code as string) || ''),
        icon: getDocumentIcon((doc.document_type_code as string) || '')
      }));

      const pendingWithMeta = (pendingDocs || []).map((doc: Record<string, unknown>) => ({
        ...doc,
        document_name: getDocumentTypeName((doc.document_type as string) || ''),
        icon: getDocumentIcon((doc.document_type as string) || '')
      }));

      setDocuments(issuedWithMeta);
      setPendingDocuments(pendingWithMeta);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }

  function getDocumentTypeName(code: string): string {
    const names: Record<string, string> = {
      'ktp': 'KTP Digital',
      'kk': 'KK Katolik',
      'sim': 'SIM',
      'KTPD': 'KTP Digital',
      'KK': 'KK Katolik',
      'BAPTIS': 'Sertifikat Baptis',
      'KOMUNI': 'Sertifikat Komuni',
      'KRISMA': 'Sertifikat Krisma',
      'NIKAH': 'Sertifikat Perkawinan',
    };
    return names[code] || code;
  }

  function getDocumentIcon(code: string): string {
    const icons: Record<string, string> = {
      'ktp': '🆔',
      'kk': '📋',
      'sim': '🚗',
      'KTPD': '🆔',
      'KK': '📋',
      'BAPTIS': '💧',
      'KOMUNI': '🍞',
      'KRISMA': '🔥',
      'NIKAH': '💍',
    };
    return icons[code] || '📄';
  }

  async function handleOCRUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrUploadStatus(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', file.name.toLowerCase().includes('ktp') ? 'ktp' : 
                              file.name.toLowerCase().includes('kk') ? 'kk' : 
                              file.name.toLowerCase().includes('sim') ? 'sim' : 'ktp');

    try {
      const res = await fetch('/api/ocr/process-document', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setOcrUploadStatus({
          type: 'success',
          message: `Dokumen berhasil diunggah. Data berhasil diekstrak dengan confidence: ${(data.confidence * 100).toFixed(1)}%. Silakan konfirmasi data di bawah.`
        });
        fetchDocuments(); // Refresh pending documents
      } else {
        setOcrUploadStatus({
          type: 'error',
          message: data.error || 'Gagal memproses dokumen'
        });
      }
    } catch (err) {
      console.error('OCR upload error:', err);
      setOcrUploadStatus({
        type: 'error',
        message: 'Terjadi kesalahan saat mengunggah dokumen'
      });
    }

    // Reset input
    e.target.value = '';
  }

  async function confirmOCRData(docId: string) {
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update document status to pending_official_approval
      const { error } = await supabase
        .from('documents')
        .update({ status: 'pending_official_approval' })
        .eq('id', docId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error confirming OCR data:', error);
        alert('Gagal mengonfirmasi data');
        return;
      }

      alert('Data berhasil dikonfirmasi dan sedang menunggu approval dari pihak paroki');
      fetchDocuments();
    } catch (err) {
      console.error('Confirm OCR error:', err);
      alert('Terjadi kesalahan');
    }
  }

  async function handleDownload(docId: string) {
    try {
      const res = await fetch(`/api/documents/${docId}/download`);
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Gagal mengunduh dokumen');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dokumen-${docId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Gagal mengunduh dokumen');
    }
  }

  function getDocumentIdFromDoc(doc: DigitalDocument): string {
    return doc.document_id || doc.id;
  }

  const defaultDocTypes = [
    { code: 'KTPD', name: 'KTP Digital', icon: '🆔', desc: 'Kartu Tanda Penduduk Digital Paroki' },
    { code: 'KK', name: 'KK Katolik', icon: '📋', desc: 'Kartu Keluarga Katolik' },
    { code: 'BAPTIS', name: 'Sertifikat Baptis', icon: '💧', desc: 'Sertifikat Sakramen Baptis' },
    { code: 'KOMUNI', name: 'Sertifikat Komuni', icon: '🍞', desc: 'Sertifikat Komuni Pertama' },
    { code: 'KRISMA', name: 'Sertifikat Krisma', icon: '🔥', desc: 'Sertifikat Sakramen Krisma' },
    { code: 'NIKAH', name: 'Sertifikat Perkawinan', icon: '💍', desc: 'Sertifikat Sakramen Perkawinan' },
  ];

  return (
    <div className="dashboard-container">
      {/* Hero */}
      <div className="dashboard-hero">
        <div className="hero-card">
          <h1>Digital Vault</h1>
          <p>Repositori dokumen digital resmi Paroki Santo Klemens. Semua dokumen pribadi Anda disimpan dengan aman dan dapat diverifikasi keasliannya.</p>
          <div className="hero-actions">
            <Link href="/user/digital-vault/verifikasi" className="btn-primary">
              Verifikasi Dokumen
            </Link>
            <Link href="/dashboard" className="btn-secondary">
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
        <div className="stats-card">
          <h2>Ringkasan Dokumen</h2>
          <div className="stat-grid">
            <div className="stat-item">
              <div className="stat-value">{documents.filter(d => d.status === 'issued').length}</div>
              <div className="stat-label">Diterbitkan</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{pendingDocuments.length}</div>
              <div className="stat-label">Menunggu</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{documents.length + pendingDocuments.length}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dokumen Digital Grid */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Dokumen Digital Saya</h2>
          <Link href="/user/digital-vault/riwayat">Riwayat</Link>
        </div>

        {loading ? (
          <div className="cards-grid">
            {[1,2,3].map(i => (
              <div key={i} className="dashboard-card" style={{ opacity: 0.5 }}>
                <h3>Memuat...</h3>
                <p>Mengambil data dokumen...</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="cards-grid">
            {defaultDocTypes.map(docType => {
              const existingDoc = documents.find(d => d.document_type_code === docType.code);
              const status = existingDoc 
                ? { text: 'Diterbitkan', className: 'active' }
                : { text: 'Belum Tersedia', className: 'pending' };

              return (
                <div key={docType.code} className="dashboard-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '2rem' }}>{docType.icon}</span>
                    <div>
                      <h3 style={{ margin: 0 }}>{docType.name}</h3>
                      <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0 0 0' }}>{docType.desc}</p>
                    </div>
                  </div>

                  {existingDoc ? (
                    <>
                      <p style={{ fontSize: '0.85rem', color: '#374151', margin: '8px 0' }}>
                        <strong>No:</strong> {getDocumentIdFromDoc(existingDoc)}
                      </p>
                      {existingDoc.issued_at && (
                        <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0' }}>
                          Diterbitkan: {new Date(existingDoc.issued_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      )}
                    </>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: '8px 0', fontStyle: 'italic' }}>
                      Dokumen ini akan tersedia setelah diterbitkan oleh pihak paroki.
                    </p>
                  )}

                  <div className="card-footer">
                    <span>{docType.code}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className={`status-pill ${status.className}`}>{status.text}</span>
                      {existingDoc?.status === 'issued' && existingDoc.id && (
                        <button 
                          onClick={() => handleDownload(existingDoc.id)}
                          className="btn-primary"
                          style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unggah Dokumen via OCR */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Unggah Dokumen Baru</h2>
        </div>
        <div className="dashboard-card">
          <h3>Scan Dokumen dengan OCR</h3>
          <p>Unggah foto dokumen identitas Anda (KTP, KK, SIM) untuk diekstrak secara otomatis menggunakan Google Cloud Vision API. Data yang diekstrak akan diverifikasi oleh Anda sebelum disimpan.</p>
          <div style={{ marginTop: '16px', padding: '16px', border: '2px dashed #d1d5db', borderRadius: '12px', textAlign: 'center' }}>
            <input
              type="file"
              id="ocr-upload"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleOCRUpload}
            />
            <label htmlFor="ocr-upload" style={{ cursor: 'pointer', display: 'block' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📸</div>
              <p style={{ fontWeight: 600, color: '#374151', margin: '0 0 4px 0' }}>Klik untuk mengunggah foto dokumen</p>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Format: JPG, PNG, WebP (Maks 5MB)</p>
            </label>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '8px', marginBottom: 0 }}>Dokumen akan diproses dengan OCR dan disimpan di Cloudflare R2</p>
          </div>
          {ocrUploadStatus && (
            <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', background: ocrUploadStatus.type === 'success' ? '#d1fae5' : '#fee2e2', color: ocrUploadStatus.type === 'success' ? '#065f46' : '#991b1b', fontSize: '0.85rem' }}>
              {ocrUploadStatus.message}
            </div>
          )}
        </div>
      </div>

      {/* Dokumen Menunggu Verifikasi */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Dokumen Menunggu Verifikasi</h2>
        </div>
        <div className="cards-grid">
          {pendingDocuments.length === 0 ? (
            <div className="dashboard-card" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Tidak ada dokumen yang menunggu verifikasi</p>
            </div>
          ) : (
            pendingDocuments.map(doc => (
              <div key={doc.id} className="dashboard-card" style={{ border: '1px solid #fbbf24', background: '#fffbeb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '2rem' }}>📄</span>
                  <div>
                    <h3 style={{ margin: 0 }}>{doc.file_name}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0 0 0' }}>
                      Tipe: {doc.document_type} &middot; Ukuran: {((doc.file_size || 0) / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                {doc.extracted_data && (
                  <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: '0 0 8px 0', color: '#1f2937' }}>Data yang Diekstrak:</p>
                    {Object.entries(doc.extracted_data).map(([key, value]) => (
                      <div key={key} style={{ fontSize: '0.8rem', marginBottom: '4px', display: 'flex', gap: '8px' }}>
                        <span style={{ fontWeight: 500, color: '#4b5563', textTransform: 'capitalize' }}>{key}:</span>
                        <span style={{ color: '#1f2937' }}>{String(value)}</span>
                      </div>
                    ))}
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '8px', marginBottom: 0 }}>
                      Tingkat kepercayaan OCR: {((doc.ocr_confidence || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', textDecoration: 'none', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                      Lihat Foto
                    </a>
                  )}
                  <button onClick={() => confirmOCRData(doc.id)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    Konfirmasi Data
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info Verifikasi */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Verifikasi Dokumen</h2>
        </div>
        <div className="dashboard-card">
          <h3>Cek Keaslian Dokumen</h3>
          <p>Setiap dokumen digital memiliki nomor unik dan tanda tangan digital yang dapat diverifikasi. Masukkan nomor dokumen untuk memverifikasi keasliannya.</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <input
              type="text"
              placeholder="Masukkan nomor dokumen (contoh: KTPD-2026-00001)"
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}
            />
            <Link href="/user/digital-vault/verifikasi" className="btn-primary" style={{ whiteSpace: 'nowrap', textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
              Verifikasi
            </Link>
          </div>
        </div>
      </div>

      {/* Keamanan */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Keamanan & Privasi</h2>
        </div>
        <div className="cards-grid">
          <div className="dashboard-card">
            <h3>🔒 Penyimpanan Aman</h3>
            <p>Semua dokumen disimpan di Cloudflare R2 dengan enkripsi dan akses terbatas.</p>
          </div>
          <div className="dashboard-card">
            <h3>✅ Tanda Tangan Digital</h3>
            <p>Setiap dokumen memiliki jejak digital yang tidak bisa dipalsukan.</p>
          </div>
          <div className="dashboard-card">
            <h3>📱 Akses Kapan Saja</h3>
            <p>Dokumen dapat diakses 24/7 melalui akun Anda yang terverifikasi.</p>
          </div>
        </div>
      </div>
    </div>
  );
}