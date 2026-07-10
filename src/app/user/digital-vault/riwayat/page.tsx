'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface DocumentHistoryItem {
  id: string;
  document_id: string;
  document_type_code: string;
  status: string;
  issued_at?: string;
  created_at: string;
}

export default function RiwayatDokumenPage() {
  const [documents, setDocuments] = useState<DocumentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/documents')
      .then(res => res.json())
      .then(json => {
        if (json.data) setDocuments(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function getDocTypeInfo(code: string): { name: string; icon: string } {
    const map: Record<string, { name: string; icon: string }> = {
      'KTPD': { name: 'KTP Digital', icon: '🆔' },
      'KK': { name: 'KK Katolik', icon: '📋' },
      'BAPTIS': { name: 'Sertifikat Baptis', icon: '💧' },
      'KOMUNI': { name: 'Sertifikat Komuni', icon: '🍞' },
      'KRISMA': { name: 'Sertifikat Krisma', icon: '🔥' },
      'NIKAH': { name: 'Sertifikat Perkawinan', icon: '💍' },
    };
    return map[code] || { name: code, icon: '📄' };
  }

  function getStatusBadge(status: string): { text: string; className: string } {
    const map: Record<string, { text: string; className: string }> = {
      'issued': { text: 'Diterbitkan', className: 'active' },
      'draft': { text: 'Draft', className: 'pending' },
      'pending_user_verification': { text: 'Menunggu Verifikasi', className: 'pending' },
      'pending_official_approval': { text: 'Menunggu Approval', className: 'pending' },
      'revoked': { text: 'Dicabut', className: 'inactive' },
    };
    return map[status] || { text: status, className: 'pending' };
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Riwayat Dokumen Digital</h2>
          <Link href="/user/digital-vault">Kembali ke Digital Vault</Link>
        </div>

        {loading ? (
          <div className="dashboard-card">
            <p style={{ color: '#6b7280' }}>Memuat riwayat dokumen...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="dashboard-card">
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <span style={{ fontSize: '3rem' }}>📂</span>
              <h3 style={{ margin: '16px 0 8px' }}>Belum Ada Dokumen</h3>
              <p style={{ color: '#6b7280' }}>
                Belum ada dokumen digital yang diterbitkan untuk akun Anda.
              </p>
            </div>
          </div>
        ) : (
          <div className="dashboard-card">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#374151', fontWeight: 600 }}>Dokumen</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#374151', fontWeight: 600 }}>Nomor</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#374151', fontWeight: 600 }}>Tanggal</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#374151', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, idx) => {
                  const info = getDocTypeInfo(doc.document_type_code);
                  const badge = getStatusBadge(doc.status);
                  return (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{info.icon}</span>
                          <span style={{ fontWeight: 500 }}>{info.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {doc.document_id}
                      </td>
                      <td style={{ padding: '12px', color: '#6b7280', fontSize: '0.85rem' }}>
                        {new Date(doc.issued_at || doc.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className={`status-pill ${badge.className}`}>{badge.text}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}