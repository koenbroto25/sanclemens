'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ModuleData {
  id: string;
  slug: string;
  code: string;
  title: string;
  subtitle: string;
  opening_quote_text: string;
  opening_quote_source: string;
  content_markdown: string;
  content_preview: string;
  estimated_minutes: number;
  order_index: number;
  user_status: string;
  user_progress: number;
  user_quiz_passed: boolean;
  prev_module: { slug: string; code: string; title: string } | null;
  next_module: { slug: string; code: string; title: string } | null;
  catechism_stages: {
    title: string;
    slug: string;
    color_theme: string;
    icon_slug: string;
  };
}

const ICONS: Record<string, string> = {
  door: '🚪', foundation: '🪨', sprout: '🌱', flame: '🔥',
};

const BORDER_COLORS: Record<string, string> = {
  slate: 'border-slate-400', amber: 'border-amber-400', emerald: 'border-emerald-400', rose: 'border-rose-400',
};
const BG_COLORS: Record<string, string> = {
  slate: 'bg-slate-50', amber: 'bg-amber-50', emerald: 'bg-emerald-50', rose: 'bg-rose-50',
};

export default function ModuleReaderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const contentRef = useRef<HTMLDivElement>(null);
  const [mod, setMod] = useState<ModuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollPct, setScrollPct] = useState(0);
  const [showQuizBtn, setShowQuizBtn] = useState(false);
  const isSaving = useRef(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/catechism/modules/${slug}`);
        if (!res.ok) {
          if (res.status === 403) {
            const json = await res.json();
            if (json.status === 'locked') {
              setError('Modul ini masih terkunci. Selesaikan modul sebelumnya terlebih dahulu.');
              return;
            }
          }
          setError('Modul tidak ditemukan.');
          return;
        }
        const json = await res.json();
        if (json.success) setMod(json.data);
        else setError(json.error || 'Gagal memuat modul.');
      } catch (e) {
        setError('Terjadi kesalahan.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Scroll tracking
  const handleScroll = useCallback(() => {
    if (!contentRef.current || !mod) return;
    const el = contentRef.current;
    const scrollTop = el.scrollTop;
    const scrollHeight = el.scrollHeight - el.clientHeight;
    const pct = scrollHeight > 0 ? Math.min(100, Math.round((scrollTop / scrollHeight) * 100)) : 0;
    setScrollPct(pct);
    setShowQuizBtn(pct >= 85);

    // Auto-save every 10% (throttled)
    if (pct % 10 < 3 && !isSaving.current) {
      isSaving.current = true;
      fetch('/api/catechism/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_slug: slug, scroll_pct: pct }),
      }).finally(() => {
        setTimeout(() => { isSaving.current = false; }, 2000);
      });
    }
  }, [mod, slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-500">Memuat modul...</p>
        </div>
      </div>
    );
  }

  if (error || !mod) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Modul Terkunci</h2>
          <p className="text-slate-500 mb-6">{error || 'Akses ditolak.'}</p>
          <Link
            href="/user/dashboard/learn-catholic"
            className="px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            ← Kembali ke Peta Perjalanan
          </Link>
        </div>
      </div>
    );
  }

  const stage = mod.catechism_stages;
  const borderColor = BORDER_COLORS[stage?.color_theme] || 'border-amber-400';
  const bgColor = BG_COLORS[stage?.color_theme] || 'bg-amber-50';
  const iconChar = ICONS[stage?.icon_slug] || '📖';

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/user/dashboard/learn-catholic"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← Peta
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-400">
            {iconChar} {stage?.title?.replace('TAHAP', 'Tahap') || ''} | Modul {mod.code}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Prev/Next navigation */}
          {mod.prev_module && (
            <Link
              href={`/user/dashboard/learn-catholic/modul/${mod.prev_module.slug}`}
              className="text-sm text-slate-500 hover:text-amber-600"
            >
              ← {mod.prev_module.code}
            </Link>
          )}
          <span className="text-xs text-slate-400">⏱ {mod.estimated_minutes} menit</span>
          {mod.next_module && (
            <Link
              href={`/user/dashboard/learn-catholic/modul/${mod.next_module.slug}`}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              {mod.next_module.code} →
            </Link>
          )}
          {/* Quiz button */}
          {showQuizBtn && mod.user_status !== 'completed' && (
            <Link
              href={`/user/dashboard/learn-catholic/kuis/${slug}`}
              className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
            >
              ✍️ Ambil Kuis
            </Link>
          )}
          {mod.user_status === 'completed' && (
            <Link
              href={`/user/dashboard/learn-catholic/kuis/${slug}`}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              ✅ Review
            </Link>
          )}
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-200 shrink-0">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-300"
          style={{ width: `${scrollPct}%` }}
        />
      </div>

      {/* Content Area */}
      <div
        ref={contentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <article className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12 prose prose-slate prose-lg max-w-none">
          {/* Header */}
          <div className={`${bgColor} -mx-4 md:-mx-8 px-4 md:px-8 py-8 rounded-none md:rounded-2xl mb-8 ${borderColor} border-l-4`}>
            <div className="text-sm text-slate-500 mb-2">
              {iconChar} {stage?.title?.replace('TAHAP', 'Tahap') || ''} | Modul {mod.code}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-3">
              {mod.title}
            </h1>
            {mod.subtitle && (
              <p className="text-lg text-slate-600">{mod.subtitle}</p>
            )}
            {mod.opening_quote_text && (
              <blockquote className="mt-6 border-l-4 border-amber-400 pl-4 italic text-slate-600">
                {mod.opening_quote_text}
                {mod.opening_quote_source && (
                  <footer className="text-sm text-slate-400 mt-1">— {mod.opening_quote_source}</footer>
                )}
              </blockquote>
            )}
          </div>

          {/* Markdown Content */}
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {mod.content_markdown || mod.content_preview}
            </ReactMarkdown>
          </div>

          {/* Bottom Navigation */}
          <div className="mt-12 pt-8 border-t border-slate-200 flex justify-between items-center">
            <div>
              {mod.prev_module ? (
                <Link
                  href={`/user/dashboard/learn-catholic/modul/${mod.prev_module.slug}`}
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  ← {mod.prev_module.code}: {mod.prev_module.title?.slice(0, 40)}
                </Link>
              ) : <span />}
            </div>
            <div className="text-right">
              {mod.next_module ? (
                <Link
                  href={`/user/dashboard/learn-catholic/modul/${mod.next_module.slug}`}
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  {mod.next_module.code}: {mod.next_module.title?.slice(0, 40)} →
                </Link>
              ) : (
                <span className="text-green-600 font-medium">🎉 Modul Terakhir — Selesaikan Kuis!</span>
              )}
            </div>
          </div>

          {/* Quiz CTA at bottom */}
          {scrollPct >= 85 && mod.user_status !== 'completed' && (
            <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-200 text-center">
              <p className="text-lg font-semibold text-amber-800 mb-3">
                ✍️ Uji Pemahamanmu
              </p>
              <p className="text-sm text-amber-600 mb-4">
                Jawab 5 pertanyaan untuk menyelesaikan modul ini dan membuka modul selanjutnya.
              </p>
              <Link
                href={`/user/dashboard/learn-catholic/kuis/${slug}`}
                className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 inline-block"
              >
                Ambil Kuis Sekarang →
              </Link>
            </div>
          )}

          {/* Spacer for bottom bar */}
          <div className="h-20" />
        </article>
      </div>

      {/* Floating Progress Indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur rounded-full px-4 py-2 shadow-lg border border-slate-200 text-sm text-slate-600">
        🔥 {scrollPct}%
      </div>
    </div>
  );
}