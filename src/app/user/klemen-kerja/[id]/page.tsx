'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface JobDetail {
  id: string;
  title: string;
  description: string;
  budget: string;
  location: string;
  duration: string;
  requirements: string[];
  company_name?: string;
  contact_phone?: string;
  contact_email?: string;
  created_at: string;
  expires_at?: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadJobDetail(params.id as string);
    }
  }, [params.id]);

  async function loadJobDetail(jobId: string) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('lowongan_kerja')
        .select('*')
        .eq('id', jobId)
        .eq('status', 'open')
        .single();

      if (error || !data) {
        setError('Lowongan kerja tidak ditemukan atau sudah ditutup');
      } else {
        setJob(data);
      }
    } catch (err) {
      console.error('Error loading job detail:', err);
      setError('Gagal memuat detail lowongan');
    } finally {
      setLoading(false);
    }
  }

  const handleApply = async () => {
    if (!job) return;
    
    setApplying(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Silakan login untuk melamar');
        return;
      }

      // Create application record
      const { error } = await supabase
        .from('job_applications')
        .insert({
          lowongan_id: job.id,
          applicant_id: user.id,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          alert('Anda sudah melamar untuk lowongan ini');
        } else {
          throw error;
        }
      } else {
        alert('Lamaran berhasil dikirim! Penanggung jawab akan menghubungi Anda.');
        setApplying(false);
      }
    } catch (err) {
      console.error('Error applying for job:', err);
      alert('Gagal mengirim lamaran. Silakan coba lagi.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-section">
          <p>Memuat detail lowongan...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-section">
          <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: '#d4758a', fontSize: '1.1rem', marginBottom: '1rem' }}>
              {error || 'Lowongan tidak ditemukan'}
            </p>
            <Link href="/user/klemen-kerja" className="btn-primary" style={{ padding: '0.75rem 2rem', textDecoration: 'none' }}>
              Kembali ke Klemen Kerja
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = job.expires_at && new Date(job.expires_at) < new Date();

  return (
    <div className="dashboard-container">
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Detail Lowongan Kerja</h2>
          <Link href="/user/klemen-kerja">Kembali</Link>
        </div>

        <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--color-primary)' }}>
                {job.title}
              </h1>
              {job.company_name && (
                <p style={{ fontSize: '1rem', color: 'var(--color-stone)', margin: '0' }}>
                  {job.company_name}
                </p>
              )}
            </div>
            {isExpired && (
              <span style={{
                padding: '4px 12px',
                borderRadius: '4px',
                background: '#fee2e2',
                color: '#991b1b',
                fontSize: '0.85rem',
                fontWeight: 600
              }}>
                Sudah Ditutup
              </span>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            padding: '1rem',
            background: 'rgba(248, 241, 226, 0.5)',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-stone)' }}>💰 Budget</span>
              <p style={{ fontWeight: 600, margin: '0.25rem 0 0' }}>{job.budget}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-stone)' }}>📍 Lokasi</span>
              <p style={{ fontWeight: 600, margin: '0.25rem 0 0' }}>{job.location}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-stone)' }}>⏱️ Durasi</span>
              <p style={{ fontWeight: 600, margin: '0.25rem 0 0' }}>{job.duration}</p>
            </div>
            {job.expires_at && (
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-stone)' }}>📅 Batas Apply</span>
                <p style={{ fontWeight: 600, margin: '0.25rem 0 0' }}>
                  {new Date(job.expires_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                </p>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Deskripsi Pekerjaan</h3>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--color-text-dark)' }}>
              {job.description}
            </div>
          </div>

          {job.requirements && job.requirements.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Persyaratan</h3>
              <ul style={{ margin: '0', paddingLeft: '1.5rem', lineHeight: 1.8 }}>
                {job.requirements.map((req, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {job.contact_phone || job.contact_email ? (
            <div style={{
              padding: '1rem',
              background: 'rgba(74, 107, 138, 0.1)',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Kontak Penanggung Jawab</h3>
              {job.contact_phone && (
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                  📞 {job.contact_phone}
                </p>
              )}
              {job.contact_email && (
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                  ✉️ {job.contact_email}
                </p>
              )}
            </div>
          ) : (
            <div style={{
              padding: '1rem',
              background: 'rgba(248, 241, 226, 0.5)',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid rgba(200, 169, 110, 0.3)'
            }}>
              <p style={{ margin: '0', fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--color-stone)' }}>
                Kontak penanggung jawab akan disediakan setelah Anda melamar.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            {!isExpired && (
              <button
                onClick={handleApply}
                disabled={applying}
                className="btn-primary"
                style={{
                  padding: '0.75rem 2rem',
                  opacity: applying ? 0.7 : 1,
                  cursor: applying ? 'not-allowed' : 'pointer'
                }}
              >
                {applying ? 'Mengirim...' : 'Kirim Lamaran'}
              </button>
            )}
            <Link href="/user/klemen-kerja" className="btn-secondary" style={{
              padding: '0.75rem 2rem',
              textDecoration: 'none',
              display: 'inline-block'
            }}>
              Kembali
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}