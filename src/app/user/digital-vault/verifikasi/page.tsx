'use client';
import Link from 'next/link';
import { useState } from 'react';

interface VerificationResult {
  valid: boolean;
  document_id: string;
  document_type: string;
  issued_at: string;
  issued_by?: { name: string; role: string };
  verified_at?: string;
  verified_by?: { name: string; role: string };
  approved_at?: string;
  approved_by?: { name: string; role: string };
  digital_signature?: string;
  error?: string;
}

const docTypeNames: Record<string, string> = {
  'KTPD': 'KTP Digital',
  'KK': 'KK Katolik',
  'BAPTIS': 'Sertifikat Baptis',
  'KOMUNI': 'Sertifikat Komuni',
  'KRISMA': 'Sertifikat Krisma',
  'NIKAH': 'Sertifikat Perkawinan',
};

export default function VerifikasiDokumenPage() {
  const [documentId, setDocumentId] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleVerify() {
    if (!documentId.trim()) {
      setError('Masukkan nomor dokumen');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`/api/documents/verify/${encodeURIComponent(documentId.trim())}`);
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setResult(json);
      }
    } catch (err) {
      setError('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Verifikasi Dokumen Digital</h2>
          <Link href="/user/digital-vault">Kembali ke Digital Vault</Link>
        </div>

        <div className="dashboard-card">
          <h3>Masukkan Nomor Dokumen</h3>
          <p>Nomor dokumen dapat ditemukan di bagian atas setiap dokumen digital yang diterbitkan oleh Paroki Santo Klemens.</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <input
              type="text"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder="Contoh: KTPD-2026-00001"
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'monospace'
              }}
            />
            <button
              onClick={handleVerify}
              disabled={loading}
              className="btn-primary"
              style={{ padding: '10px 24px' }}
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi'}
            </button>
          </div>
          {error && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626' }}>
              {error}
            </div>
          )}
        </div>

        {result && (
          <div className="dashboard-card" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '2.5rem' }}>{result.valid ? '✅' : '❌'}</span>
              <div>
                <h3 style={{ margin: 0, color: result.valid ? '#059669' : '#dc2626' }}>
                  {result.valid ? 'Dokumen ASLI' : 'Dokumen TIDAK VALID'}
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>
                  {result.valid 
                    ? 'Dokumen ini adalah dokumen digital resmi yang diterbitkan oleh Paroki Santo Klemens.' 
                    : 'Dokumen tidak ditemukan atau tidak valid.'}
                </p>
              </div>
            </div>

            {result.valid && (
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#374151', width: '180px' }}>Nomor Dokumen</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{result.document_id}</td>
                    </tr>
                    <tr style={{ background: '#f9fafb' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#374151' }}>Jenis Dokumen</td>
                      <td style={{ padding: '8px 12px' }}>{docTypeNames[result.document_type] || result.document_type}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#374151' }}>Tanggal Diterbitkan</td>
                      <td style={{ padding: '8px 12px' }}>
                        {result.issued_at ? new Date(result.issued_at).toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                    </tr>
                    {result.issued_by && (
                      <tr style={{ background: '#f9fafb' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#374151' }}>Diterbitkan Oleh</td>
                        <td style={{ padding: '8px 12px' }}>
                          {result.issued_by.name} {result.issued_by.role ? `(${result.issued_by.role})` : ''}
                        </td>
                      </tr>
                    )}
                    {result.verified_by && (
                      <tr>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#374151' }}>Diverifikasi Oleh</td>
                        <td style={{ padding: '8px 12px' }}>
                          {result.verified_by.name} {result.verified_by.role ? `(${result.verified_by.role})` : ''}
                          {result.verified_at ? ` pada ${new Date(result.verified_at).toLocaleDateString('id-ID')}` : ''}
                        </td>
                      </tr>
                    )}
                    {result.approved_by && (
                      <tr style={{ background: '#f9fafb' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#374151' }}>Disetujui Oleh</td>
                        <td style={{ padding: '8px 12px' }}>
                          {result.approved_by.name} {result.approved_by.role ? `(${result.approved_by.role})` : ''}
                          {result.approved_at ? ` pada ${new Date(result.approved_at).toLocaleDateString('id-ID')}` : ''}
                        </td>
                      </tr>
                    )}
                    {result.digital_signature && (
                      <tr>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#374151' }}>Tanda Tangan Digital</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                          {result.digital_signature}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div style={{ marginTop: '16px', padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                  <p style={{ margin: 0, color: '#166534', fontWeight: 600 }}>✓ Dokumen ini telah terverifikasi sebagai dokumen asli</p>
                  <p style={{ margin: '4px 0 0 0', color: '#15803d', fontSize: '0.85rem' }}>
                    Tanda tangan digital dan jejak audit tidak bisa dipalsukan.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}