'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Certificate {
  id: string;
  certificate_number: string;
  verification_code: string;
  pdf_r2_key: string;
  issued_at: string;
  stage_id: string | null;
  catechism_stages: {
    slug: string;
    title: string;
    icon_slug: string;
    color_theme: string;
  } | null;
}

interface ProgressSummary {
  total_per_stage: Record<string, number>;
  completed_per_stage: Record<string, number>;
  total_modules: number;
  completed_modules: number;
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/catechism/certificates');
        const json = await res.json();
        if (json.success) {
          setCertificates(json.data.certificates);
          setProgressSummary(json.data.progress_summary);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Stage display info
  const stageInfo: Record<string, { icon: string; color: string; label: string }> = {
    'pintu-masuk': { icon: '🚪', color: 'from-slate-500 to-slate-700', label: 'Tahap 0: Pintu Masuk' },
    'pondasi': { icon: '🪨', color: 'from-amber-500 to-amber-700', label: 'Tahap 1: Pondasi' },
    'pertumbuhan': { icon: '🌱', color: 'from-emerald-500 to-emerald-700', label: 'Tahap 2: Pertumbuhan' },
    'pendalaman': { icon: '🔥', color: 'from-rose-500 to-rose-700', label: 'Tahap 3: Pendalaman' },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/user/dashboard/learn-catholic"
          className="text-sm text-slate-500 hover:text-slate-700">
          ← Peta Perjalanan
        </Link>

        <h1 className="text-2xl font-bold text-slate-800 mt-4 mb-2">🏅 Sertifikat</h1>
        <p className="text-slate-500 mb-8">Kumpulan sertifikat pencapaian perjalanan imanmu.</p>

        {/* Progress Overview */}
        {progressSummary && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
            <h2 className="font-semibold text-slate-700 mb-4">Progress Program</h2>
            <div className="space-y-4">
              {Object.entries(stageInfo).map(([slug, info]) => {
                const total = progressSummary.total_per_stage[slug] || 0;
                const completed = progressSummary.completed_per_stage[slug] || 0;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                const isComplete = total > 0 && completed === total;
                const certExists = certificates.some(c => c.stage_id && c.catechism_stages?.slug === slug);

                return (
                  <div key={slug} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${info.color} text-white`}>
                      {info.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-700">{info.label}</span>
                        <span className="text-slate-500">{completed}/{total}</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-amber-500'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div>
                      {isComplete && certExists ? (
                        <span className="text-green-500 text-lg">✅</span>
                      ) : isComplete ? (
                        <span className="text-xs text-slate-400">Siap</span>
                      ) : (
                        <span className="text-slate-300">🔒</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Overall progress */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-700">Program Penuh (21 modul)</span>
                  <span className="text-slate-500">{progressSummary.completed_modules}/{progressSummary.total_modules}</span>
                </div>
                <div className="h-2.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all"
                    style={{ width: `${progressSummary.total_modules > 0 ? Math.round((progressSummary.completed_modules / progressSummary.total_modules) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Certificates List */}
        {certificates.length > 0 ? (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-700">Sertifikat yang Diperoleh</h2>
            {certificates.map(cert => {
              const stage = cert.catechism_stages;
              const info = stage ? stageInfo[stage.slug] : null;
              return (
                <div key={cert.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br ${info?.color || 'from-slate-500 to-slate-700'} text-white`}>
                    {info?.icon || '🏅'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">
                      Sertifikat {stage?.title?.replace('TAHAP', 'Tahap') || 'Program'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      No: {cert.certificate_number}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(cert.issued_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <button
                    className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-200"
                    onClick={() => window.open(`/api/download-certificate?key=${cert.pdf_r2_key}`, '_blank')}
                  >
                    📥 Download
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏅</div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Belum Ada Sertifikat</h2>
            <p className="text-slate-500 mb-6">
              Selesaikan satu tahap penuh untuk mendapatkan sertifikat pertamamu.
            </p>
            <Link href="/user/dashboard/learn-catholic"
              className="px-6 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700">
              Mulai Belajar →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}