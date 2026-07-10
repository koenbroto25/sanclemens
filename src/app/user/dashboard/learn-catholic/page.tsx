'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Module {
  id: string;
  slug: string;
  code: string;
  title: string;
  order_index: number;
  content_preview: string;
  opening_quote_text: string;
  opening_quote_source: string;
  estimated_minutes: number;
  user_status: string | null;
}

interface Stage {
  id: string;
  slug: string;
  order_index: number;
  title: string;
  subtitle: string;
  description: string;
  icon_slug: string;
  color_theme: string;
  saint_patron: string;
  saint_patron_medal: string;
  catechism_modules: Module[];
}

const ICONS: Record<string, string> = {
  door: 'ðŸšª', foundation: 'ðŸª¨', sprout: 'ðŸŒ±', flame: 'ðŸ”¥',
};

const COLORS: Record<string, { bg: string; light: string; text: string; border: string }> = {
  slate: { bg: 'bg-slate-500', light: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  amber: { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
  rose: { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' },
};

function StatusIcon({ status }: { status: string | null }) {
  switch (status) {
    case 'completed': return <span className="text-green-500 text-lg">âœ…</span>;
    case 'in_progress': return <span className="text-amber-500 text-lg">ðŸ“–</span>;
    case 'unlocked': return <span className="text-blue-500 text-lg">ðŸ”“</span>;
    case 'locked': return <span className="text-slate-300 text-lg">ðŸ”’</span>;
    default: return <span className="text-slate-300 text-lg">ðŸ”’</span>;
  }
}

function FlameProgress({ completed, total, color }: { completed: number; total: number; color: string }) {
  const pct = total > 0 ? completed / total : 0;
  const flames = [];
  for (let i = 0; i < total; i++) {
    const lit = i < completed;
    flames.push(
      <span key={i} className={`text-xl transition-all duration-500 ${lit ? 'opacity-100 scale-110' : 'opacity-30 scale-75'}`}>
        ðŸ”¥
      </span>
    );
  }
  return (
    <div className="flex gap-0.5 items-center">
      {flames}
      <span className="text-sm ml-2 text-slate-500">{completed}/{total}</span>
    </div>
  );
}

function ModuleCard({ mod, onClick }: { mod: Module; onClick: () => void }) {
  const isLocked = mod.user_status === 'locked';
  const isCompleted = mod.user_status === 'completed';
  const isUnlocked = mod.user_status === 'unlocked' || mod.user_status === 'in_progress';

  return (
    <button
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      className={`
        relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 min-w-[140px]
        ${isLocked ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed' : ''}
        ${isUnlocked ? 'bg-white border-amber-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : ''}
        ${isCompleted ? 'bg-green-50 border-green-300 shadow-sm cursor-pointer hover:shadow-md' : ''}
      `}
    >
      <div className="absolute top-2 right-2">
        <StatusIcon status={mod.user_status} />
      </div>
      <div className="text-slate-800 font-bold text-lg mb-1">{mod.code}</div>
      <div className={`text-xs text-center leading-tight ${isLocked ? 'text-slate-400' : 'text-slate-600'}`}>
        {mod.title.length > 30 ? mod.title.slice(0, 28) + '...' : mod.title}
      </div>
      {mod.estimated_minutes && isUnlocked && (
        <div className="text-[10px] text-slate-400 mt-2">â± {mod.estimated_minutes} menit</div>
      )}
      {mod.user_status === 'in_progress' && (
        <div className="absolute bottom-1 left-2 right-2 h-1 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full" style={{ width: '40%' }} />
        </div>
      )}
    </button>
  );
}

export default function LearnCatholicDashboard() {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [showUnlockToast, setShowUnlockToast] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      // Seed progress if needed
      await fetch('/api/catechism/seed', { method: 'POST' });

      const [stagesRes, progressRes] = await Promise.all([
        fetch('/api/catechism/stages'),
        fetch('/api/catechism/progress'),
      ]);

      const stagesJson = await stagesRes.json();
      if (stagesJson.success) setStages(stagesJson.data || []);
    } catch (e) {
      console.error('Error loading catechism data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openModule = (slug: string) => {
    router.push(`/user/dashboard/learn-catholic/modul/${slug}`);
  };

  // Calculate stats
  const allModules = stages.flatMap(s => s.catechism_modules || []);
  const completedCount = allModules.filter(m => m.user_status === 'completed').length;
  const totalCount = allModules.length;
  const overallPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-500">Memuat perjalanan imanmu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      {/* Unlock Toast */}
      {showUnlockToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-600 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce">
          ðŸ”“ Modul baru terbuka: {showUnlockToast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/user/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
                â† Dashboard
              </Link>
              <h1 className="text-xl font-bold text-slate-800 mt-1">ðŸ”¥ Perjalanan Iman</h1>
            </div>
            <div className="flex items-center gap-3">
              {streak > 0 && <div className="text-amber-600 text-sm font-semibold">ðŸ”¥ Streak {streak} hr</div>}
              <Link
                href="/user/dashboard/learn-catholic/sertifikat"
                className="px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
              >
                ðŸ… Sertifikat
              </Link>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-slate-600 mb-1">
              <span>Progress Keseluruhan</span>
              <span>{completedCount}/{totalCount} modul ({overallPct}%)</span>
            </div>
            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-700"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Journey Map */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
        {stages.map((stage) => {
          const color = COLORS[stage.color_theme] || COLORS.slate;
          const modules = stage.catechism_modules || [];
          const completed = modules.filter(m => m.user_status === 'completed').length;
          const isStageLocked = stage.order_index > 0 &&
            modules.every(m => m.user_status === 'locked');

          return (
            <section key={stage.id} className={`relative ${isStageLocked ? 'opacity-60' : ''}`}>
              {/* Stage Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center text-2xl
                  ${color.bg} text-white shadow-lg
                `}>
                  {ICONS[stage.icon_slug] || 'ðŸ“–'}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-800">
                    {stage.title.replace('TAHAP', 'Tahap')}
                  </h2>
                  <p className="text-sm text-slate-500">{stage.subtitle}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <FlameProgress completed={completed} total={modules.length} color={stage.color_theme} />
                    {completed === modules.length && modules.length > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                        âœ… Selesai
                      </span>
                    )}
                    <span className="text-xs text-slate-400">Pelindung: {stage.saint_patron}</span>
                  </div>
                </div>
              </div>

              {/* Module Cards */}
              <div className="flex flex-wrap gap-3 ml-0 md:ml-16">
                {modules.map((mod) => (
                  <ModuleCard
                    key={mod.id}
                    mod={mod}
                    onClick={() => openModule(mod.slug)}
                  />
                ))}
                {modules.length === 0 && (
                  <p className="text-sm text-slate-400 italic">Belum ada modul</p>
                )}
              </div>

              {/* Stage Connector (for non-last stages) */}
              {stage.order_index < stages.length - 1 && (
                <div className="hidden md:block absolute -bottom-8 left-7 w-0.5 h-8 bg-slate-300" />
              )}
            </section>
          );
        })}
      </div>

      {/* Empty State */}
      {stages.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">ðŸ“š</div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Belum Ada Modul</h2>
          <p className="text-slate-500">Modul-modul sedang dipersiapkan. Silakan kembali lagi nanti.</p>
        </div>
      )}
    </div>
  );
}