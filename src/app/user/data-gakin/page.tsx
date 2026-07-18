'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface GakinRequest {
  id: string;
  family_id: string;
  penghasilan_per_bulan: number | null;
  jumlah_tanggungan: number | null;
  kondisi_rumah: string | null;
  catatan_seksos: string | null;
  foto_kondisi: string | null;
  status: string;
  proposed_by: string;
  created_at: string;
  families?: {
    id: string;
    nama_kepala_keluarga: string;
    alamat: string;
  };
  gakin_approvals?: Array<{
    id: string;
    action: string;
    notes: string;
    approved_by: string;
    created_at: string;
  }>;
}

export default function DataGakinPage() {
  const [requests, setRequests] = useState<GakinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGakinData();
  }, []);

  async function fetchGakinData() {
    try {
      const res = await fetch('/api/user/data-gakin');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengambil data GAKIN');
      }

      setRequests(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { text: string; className: string }> = {
      proposed: { text: 'Menunggu Persetujuan', className: 'pending' },
      approved: { text: 'Disetujui', className: 'active' },
      rejected: { text: 'Ditolak', className: 'rejected' },
      completed: { text: 'Selesai', className: 'active' },
    };
    return labels[status] || { text: status, className: 'pending' };
  };

  const getApprovalProgress = (request: GakinRequest) => {
    const approvals = request.gakin_approvals || [];
    const total = 4; // Pastor, Wakil DPP, Komsos, KL
    const approved = approvals.filter(a => a.action === 'approve').length;
    return { approved, total };
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Data GAKIN</h2>
          <Link href="/dashboard">Kembali ke Dashboard</Link>
        </div>

        <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
          <h3>Informasi GAKIN</h3>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            GAjin Keluarga (GAKIN) adalah program bantuan untuk keluarga yang membutuhkan. 
            Data Anda akan ditinjau oleh tim paroki untuk menentukan kelayakan bantuan.
          </p>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            background: '#fee2e2',
            color: '#991b1b',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="cards-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="dashboard-card" style={{ opacity: 0.5 }}>
                <h3>Memuat...</h3>
                <p>Mengambil data GAKIN...</p>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: '#6b7280', fontSize: '1.1rem', marginBottom: '1rem' }}>
              Belum ada pengajuan GAKIN
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
              Hubungi Ketua Lingkungan untuk mengajukan permohonan bantuan GAKIN.
            </p>
          </div>
        ) : (
          <div className="cards-grid">
            {requests.map(request => {
              const status = getStatusLabel(request.status);
              const progress = getApprovalProgress(request);

              return (
                <div key={request.id} className="dashboard-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>
                        {request.families?.nama_kepala_keluarga || 'Keluarga'}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0' }}>
                        {request.families?.alamat || 'Alamat tidak tersedia'}
                      </p>
                    </div>
                    <span className={`status-pill ${status.className}`}>{status.text}</span>
                  </div>

                  <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                      {request.penghasilan_per_bulan !== null && (
                        <div>
                          <span style={{ color: '#6b7280' }}>Penghasilan:</span>
                          <p style={{ margin: '0.25rem 0 0', fontWeight: 500 }}>
                            Rp {request.penghasilan_per_bulan.toLocaleString('id-ID')}
                          </p>
                        </div>
                      )}
                      {request.jumlah_tanggungan !== null && (
                        <div>
                          <span style={{ color: '#6b7280' }}>Tanggungan:</span>
                          <p style={{ margin: '0.25rem 0 0', fontWeight: 500 }}>
                            {request.jumlah_tanggungan} orang
                          </p>
                        </div>
                      )}
                      {request.kondisi_rumah && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={{ color: '#6b7280' }}>Kondisi Rumah:</span>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                            {request.kondisi_rumah}
                          </p>
                        </div>
                      )}
                      {request.catatan_seksos && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={{ color: '#6b7280' }}>Catatan Seksos:</span>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                            {request.catatan_seksos}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Approval Progress */}
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1, height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${(progress.approved / progress.total) * 100}%`,
                          height: '100%',
                          background: '#10b981',
                          borderRadius: '4px'
                        }} />
                      </div>
                      <span>{progress.approved}/{progress.total} approved</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', margin: '0' }}>
                      Diajukan: {new Date(request.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>

                  {request.foto_kondisi && (
                    <div style={{ marginTop: '1rem' }}>
                      <a href={request.foto_kondisi} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', textDecoration: 'none', borderRadius: '6px', border: '1px solid #d1d5db', display: 'inline-block' }}>
                        Lihat Foto
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}