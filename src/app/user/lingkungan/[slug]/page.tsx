'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface LingkunganData {
  id: string;
  nama_lingkungan: string;
  slug: string;
  ketua_id: string;
  sekretaris_id: string;
  bendahara_id: string;
  jumlah_keluarga: number;
  jumlah_umat: number;
  deskripsi: string | null;
  ketua?: {
    full_name: string;
    phone: string;
  };
}

interface KegiatanLingkungan {
  id: string;
  nama_kegiatan: string;
  tanggal_mulai: string;
  waktu_mulai: string | null;
  lokasi: string | null;
  jenis_kegiatan: string;
}

export default function LingkunganPage({ params }: { params: { slug: string } }) {
  const [lingkungan, setLingkungan] = useState<LingkunganData | null>(null);
  const [kegiatan, setKegiatan] = useState<KegiatanLingkungan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLingkunganData();
  }, [params.slug]);

  async function loadLingkunganData() {
    try {
      const supabase = createClient();
      
      // Load lingkungan info
      const { data: lingkunganData, error: lingkunganError } = await supabase
        .from('lingkungan')
        .select('*')
        .eq('slug', params.slug)
        .single();

      if (lingkunganError || !lingkunganData) {
        setError('Lingkungan tidak ditemukan');
        setLoading(false);
        return;
      }

      setLingkungan(lingkunganData);

      // Load ketua info
      if (lingkunganData.ketua_id) {
        const { data: ketua } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', lingkunganData.ketua_id)
          .single();

        if (ketua) {
          setLingkungan(prev => prev ? { ...prev, ketua } : null);
        }
      }

      // Load upcoming kegiatan for this lingkungan
      const { data: kegiatanData } = await supabase
        .from('kegiatan')
        .select('id, nama_kegiatan, tanggal_mulai, waktu_mulai, lokasi, jenis_kegiatan')
        .eq('lingkungan_slug', params.slug)
        .eq('is_published', true)
        .gte('tanggal_mulai', new Date().toISOString().split('T')[0])
        .order('tanggal_mulai', { ascending: true })
        .limit(10);

      setKegiatan(kegiatanData || []);
    } catch (error) {
      console.error('Error loading lingkungan data:', error);
      setError('Gagal memuat data lingkungan');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-section">
          <p>Memuat data lingkungan...</p>
        </div>
      </div>
    );
  }

  if (error || !lingkungan) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-section">
          <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: '#d4758a', fontSize: '1.1rem', marginBottom: '1rem' }}>{error || 'Lingkungan tidak ditemukan'}</p>
            <Link href="/dashboard" className="btn-primary" style={{ padding: '0.75rem 2rem', textDecoration: 'none' }}>
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Lingkungan {lingkungan.nama_lingkungan}</h2>
          <Link href="/dashboard">Kembali ke Dashboard</Link>
        </div>

        {/* Info Card */}
        <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
          <h3>Informasi Lingkungan</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <span style={{ color: 'var(--color-stone)', fontSize: '0.85rem' }}>Ketua Lingkungan</span>
              <p style={{ fontWeight: 600, margin: '0.25rem 0 0' }}>
                {lingkungan.ketua?.full_name || 'Belum ditentukan'}
              </p>
            </div>
            <div>
              <span style={{ color: 'var(--color-stone)', fontSize: '0.85rem' }}>Jumlah Keluarga</span>
              <p style={{ fontWeight: 600, margin: '0.25rem 0 0' }}>
                {lingkungan.jumlah_keluarga || 0} keluarga
              </p>
            </div>
            <div>
              <span style={{ color: 'var(--color-stone)', fontSize: '0.85rem' }}>Jumlah Umat</span>
              <p style={{ fontWeight: 600, margin: '0.25rem 0 0' }}>
                {lingkungan.jumlah_umat || 0} orang
              </p>
            </div>
          </div>
          {lingkungan.deskripsi && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(200,169,110,0.2)' }}>
              <span style={{ color: 'var(--color-stone)', fontSize: '0.85rem' }}>Deskripsi</span>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{lingkungan.deskripsi}</p>
            </div>
          )}
        </div>

        {/* Upcoming Kegiatan */}
        <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
          <h3>Kegiatan Mendatang</h3>
          {kegiatan.length > 0 ? (
            <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
              {kegiatan.map((k) => (
                <div key={k.id} style={{
                  padding: '1rem',
                  background: 'rgba(248, 241, 226, 0.5)',
                  borderRadius: '8px',
                  border: '1px solid rgba(200,169,110,0.15)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: '0', fontSize: '0.95rem', fontWeight: 600 }}>{k.nama_kegiatan}</h4>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'var(--color-gold)',
                      color: 'var(--color-primary)',
                      whiteSpace: 'nowrap'
                    }}>
                      {k.jenis_kegiatan}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-stone)' }}>
                    <p style={{ margin: '0.25rem 0' }}>
                      📅 {new Date(k.tanggal_mulai).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                      {k.waktu_mulai && ` • 🕐 ${k.waktu_mulai}`}
                    </p>
                    {k.lokasi && <p style={{ margin: '0.25rem 0' }}>📍 {k.lokasi}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--color-stone)', fontSize: '0.9rem', marginTop: '1rem' }}>
              Belum ada kegiatan mendatang untuk lingkungan ini.
            </p>
          )}
        </div>

        {/* Contact Info */}
        {lingkungan.ketua && (
          <div className="dashboard-card">
            <h3>Kontak Ketua Lingkungan</h3>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #dfc493, #c8a96e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
                fontWeight: 700,
                fontSize: '1.2rem'
              }}>
                {lingkungan.ketua.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 600, margin: '0' }}>{lingkungan.ketua.full_name}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-stone)', margin: '0.25rem 0 0' }}>
                  {lingkungan.ketua.phone}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}