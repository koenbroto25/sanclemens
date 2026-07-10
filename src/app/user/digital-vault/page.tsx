'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Tipe data dokumen
interface DigitalDocument {
  id: string;
  document_id: string;
  document_type_code: string;
  document_name: string;
  status: 'issued' | 'draft' | 'pending_user_verification' | 'pending_official_approval' | 'revoked';
  pdf_url?: string;
  issued_at?: string;
  issued_by_name?: string;
  icon: string;
}

export default function DigitalVaultPage() {
  const [documents, setDocuments] = useState<DigitalDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const res = await fetch('/api/documents');
      const json = await res.json();
      if (json.data) {
        setDocuments(json.data.map((doc: any) => ({
          ...doc,
          document_name: getDocumentTypeName(doc.document_type_code),
          icon: getDocumentIcon(doc.document_type_code)
        })));
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }

  function getDocumentTypeName(code: string): string {
    const names: Record<string, string> = {
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
      'KTPD': '🆔',
      'KK': '📋',
      'BAPTIS': '💧',
      'KOMUNI': '🍞',
      'KRISMA': '🔥',
      'NIKAH': '💍',
    };
    return icons[code] || '📄';
  }

  function getStatusLabel(status: string): { text: string; className: string } {
    const map: Record<string, { text: string; className: string }> = {
      'issued': { text: 'Diterbitkan', className: 'active' },
      'draft': { text: 'Draft', className: 'pending' },
      'pending_user_verification': { text: 'Menunggu Verifikasi', className: 'pending' },
      'pending_official_approval': { text: 'Menunggu Approval', className: 'pending' },
      'revoked': { text: 'Dicabut', className: 'inactive' },
    };
    return map[status] || { text: status, className: 'pending' };
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
    // document_id format: KTPD-2026-00001
    return doc.document_id;
  }

  // Dokumen default yang harus ada (akan muncul meski belum ada di DB)
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
              <div className="stat-value">{documents.filter(d => d.status === 'pending_user_verification' || d.status === 'pending_official_approval').length}</div>
              <div className="stat-label">Menunggu</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{documents.length}</div>
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
                ? getStatusLabel(existingDoc.status)
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
            <Link href="/user/digital-vault/verifikasi" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
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