'use client';

import { useState, useEffect } from 'react';
import { AIChatWidget } from '@/components/ai/AIChatWidget';
import TogglePersona from '@/components/renungan/TogglePersona';

interface BacaanLiturgi {
  reference: string;
  text: string | null;
}

interface MetadataLiturgi {
  tanggal: string;
  perayaan: string;
  tingkat_perayaan: string;
  warna_liturgi: string;
  is_minggu: boolean;
  musim_lurgi: string;
}

interface RenunganData {
  id: string;
  tanggal: string;
  mode_persona: string;
  perayaan: string;
  tingkat_perayaan: string;
  warna_liturgi: string;
  musim_liturgi: string;
  tema_renungan: string;
  bacaan_utama: string;
  pengantar: string | null;
  pintu_sabda: string | null;
  suara_tradisi: string | null;
  cermin_kehidupan: string | null;
  doa_penutup: string | null;
  cerita_pendek: string | null;
  ayat_sabda: string | null;
  pertanyaan_refleksi: string | null;
  undangan_hening: string | null;
  resonansi_minggu: string | null;
  teks_lengkap: string;
  ringkasan_150_kata: string;
  kutipan_unggulan: string;
  resonansi_untuk_notifikasi: string | null;
  skor_total: number;
  lulus_validasi: boolean;
}

interface LiturgiResponse {
  success: boolean;
  message?: string;
  data: {
    renungan: RenunganData;
    liturgi: MetadataLiturgi;
    cached: boolean;
  };
}

export default function RenunganHarianPage() {
  const [data, setData] = useState<LiturgiResponse['data'] | null>(null);
  const [persona, setPersona] = useState<'ignas' | 'anton'>('ignas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRenungan = async (selectedPersona: 'ignas' | 'anton') => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/renungan/harian?persona=${selectedPersona}`);
      const json: LiturgiResponse = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.message || 'Gagal memuat renungan');
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat renungan harian');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenungan(persona);
  }, [persona]);

  const handlePersonaChange = (newPersona: 'ignas' | 'anton') => {
    setPersona(newPersona);
  };

  const colorMap: Record<string, string> = {
    Hijau: '#4a8c5c',
    Putih: '#f0ebe0',
    Merah: '#8b2635',
    Ungu: '#6b4c8a',
    Rosa: '#e8a0b0',
    Emas: '#c8a96e',
  };

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[var(--color-text-dark)] mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
            Renungan Harian
          </h1>
          <p className="text-lg text-[var(--color-stone-dark)] max-w-2xl mx-auto">
            Bacaan Sabda Allah dan renungan iman Katolik setiap hari
          </p>
          <div className="mt-4">
            <TogglePersona value={persona} onChange={handlePersonaChange} />
          </div>
        </div>

        {/* Loading & Error states */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full mx-auto"></div>
            <p className="text-[var(--color-stone)] mt-3">Memuat renungan harian...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-[var(--color-glass-red)] mb-3">{error}</p>
            <button
              onClick={() => fetchRenungan(persona)}
              className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-primary)] rounded-[2px_24px_2px_24px] hover:bg-[var(--color-gold-light)] transition"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Renungan Content */}
        {!loading && !error && data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
              <RenunganContent renungan={data.renungan} liturgi={data.liturgi} />
            </div>

            {/* Chat Bot 8 */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <AIChatWidget
                  botId="bot_8"
                  botName="Learn Catholic"
                  accessLevel={0}
                  showSources={true}
                  placeholder="Tanya tentang renungan hari ini..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RenunganContent({ renungan, liturgi }: { renungan: RenunganData; liturgi: MetadataLiturgi }) {
  const colorMap: Record<string, string> = {
    Hijau: '#4a8c5c',
    Putih: '#f0ebe0',
    Merah: '#8b2635',
    Ungu: '#6b4c8a',
    Rosa: '#e8a0b0',
    Emas: '#c8a96e',
  };

  const liturgicalColor = colorMap[liturgi.warna_liturgi] || colorMap['Hijau'];

  return (
    <div className="bg-white rounded-[4px_20px_4px_20px] shadow-[var(--shadow-card)] border border-[rgba(200,169,110,0.14)] p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-4 h-4 rounded-full" style={{ background: liturgicalColor }}></span>
        <span className="text-sm text-[var(--color-stone)]">
          {liturgi.musim_lurgi || 'Masa Biasa'} &middot; Warna {liturgi.warna_liturgi || 'Hijau'}
        </span>
      </div>

      <h2 className="text-2xl font-bold text-[var(--color-text-dark)] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{renungan.perayaan}</h2>
      <p className="text-sm text-[var(--color-stone)] mb-4">{renungan.tingkat_perayaan}</p>

      <div className="mb-6">
        <p className="whitespace-pre-line text-[var(--color-text-dark)] leading-relaxed">{renungan.teks_lengkap}</p>
      </div>

      {renungan.kutipan_unggulan && (
        <div className="border-l-4 border-[var(--color-gold)] pl-4 italic text-[var(--color-text-dark)] mb-6">
          {renungan.kutipan_unggulan}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renungan.pengantar && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-gold-deep)] uppercase tracking-wider mb-2">Pengantar</h3>
            <p className="text-[var(--color-text-dark)] whitespace-pre-line">{renungan.pengantar}</p>
          </div>
        )}
        {renungan.pintu_sabda && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-gold-deep)] uppercase tracking-wider mb-2">Pintu Sabda</h3>
            <p className="text-[var(--color-text-dark)] whitespace-pre-line">{renungan.pintu_sabda}</p>
          </div>
        )}
        {renungan.suara_tradisi && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-gold-deep)] uppercase tracking-wider mb-2">Suara Tradisi</h3>
            <p className="text-[var(--color-text-dark)] whitespace-pre-line">{renungan.suara_tradisi}</p>
          </div>
        )}
        {renungan.cermin_kehidupan && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-gold-deep)] uppercase tracking-wider mb-2">Cermin Kehidupan</h3>
            <p className="text-[var(--color-text-dark)] whitespace-pre-line">{renungan.cermin_kehidupan}</p>
          </div>
        )}
        {renungan.doa_penutup && (
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold text-[var(--color-gold-deep)] uppercase tracking-wider mb-2">Doa Penutup</h3>
            <p className="text-[var(--color-text-dark)] whitespace-pre-line">{renungan.doa_penutup}</p>
          </div>
        )}
      </div>

      {renungan.lulus_validasi && (
        <p className="text-xs text-[var(--color-success)] mt-4">Skor teologis valid: {renungan.skor_total}</p>
      )}
    </div>
  );
}
