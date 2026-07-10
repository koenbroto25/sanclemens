import fs from 'node:fs/promises';
import path from 'node:path';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import {
  MODULES,
  getModuleBySlug,
  getTahapBySlug,
  getModuleFilename,
  getAdjacentModules,
  estimateReadingMinutes,
} from '@/lib/learn-catholic/curriculum';
import { parseModuleMarkdown } from '@/lib/learn-catholic/parseModuleMarkdown';
import { QuatrefoilMedallion } from '@/components/learn-catholic/QuatrefoilMedallion';
import { ReadingProgressBar } from '@/components/learn-catholic/ReadingProgressBar';
import { ModuleFooterNav } from '@/components/learn-catholic/ModuleFooterNav';
import { OpeningQuotes, ModuleBody } from '@/components/learn-catholic/ModuleSections';

/* ============================================================
   Lokasi file markdown sumber. Path relatif ke root proyek
   (process.cwd()), BUKAN path absolut D:\... — supaya jalan juga
   saat di-deploy, bukan cuma di mesin dev ini.
   Kalau nanti file .md dipindah ke dalam repo (disarankan — lihat
   catatan di bawah), cukup ganti MARKDOWN_DIR ini.
   ============================================================ */
const MARKDOWN_DIR = path.join(process.cwd(), 'catholic source', 'modul katolisitas', 'final');

const MODUL_BASE = '/public/learn-catholic/modul';

async function loadModuleMarkdown(numberField: string): Promise<string | null> {
  const filename = getModuleFilename(numberField);
  try {
    return await fs.readFile(path.join(MARKDOWN_DIR, filename), 'utf8');
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  return MODULES.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const moduleItem = getModuleBySlug(params.slug);
  if (!moduleItem) return {};
  return {
    title: `${moduleItem.title} — Belajar Iman Katolik`,
    description: moduleItem.subtitle,
  };
}

export default async function ModulPage({ params }: { params: { slug: string } }) {
  const moduleItem = getModuleBySlug(params.slug);
  if (!moduleItem) notFound();

  const raw = await loadModuleMarkdown(moduleItem.number);
  if (!raw) notFound();

  const tahap = getTahapBySlug(moduleItem.tahapSlug);
  const adjacent = getAdjacentModules(params.slug);
  const readingMinutes = estimateReadingMinutes(raw);
  const parsed = parseModuleMarkdown(raw, MODULES, MODUL_BASE);

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <ReadingProgressBar />

      {/* ============ HEADER ============ */}
      <header className="pt-14 pb-10 px-4 text-center" style={{ background: 'linear-gradient(180deg, var(--color-parchment), var(--color-cream))' }}>
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <span className="text-[0.7rem] font-semibold tracking-[0.28em] uppercase mb-5" style={{ color: 'var(--color-gold-deep)' }}>
            {tahap?.title ?? 'Belajar Iman Katolik'}
          </span>

          {tahap && (
            <QuatrefoilMedallion size={64} base={tahap.jewelBase} light={tahap.jewelLight} icon={moduleItem.icon} status="current" animateSheen />
          )}

          <h1
            className="text-2xl md:text-4xl font-bold text-[var(--color-text-dark)] mt-5 mb-3 leading-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {moduleItem.title}
          </h1>
          <p className="text-[var(--color-stone-dark)] mb-4">{moduleItem.subtitle}</p>

          <span
            className="text-[0.7rem] font-medium px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(200,169,110,0.12)', color: 'var(--color-stone-dark)' }}
          >
            ⏱ Waktu baca ± {readingMinutes} menit
          </span>
        </div>
      </header>

      {/* ============ KUTIPAN PEMBUKA ============ */}
      {parsed.quotes.length > 0 && (
        <section className="px-4 -mt-2 mb-14 md:mb-16">
          <OpeningQuotes quotes={parsed.quotes} />
        </section>
      )}

      {/* ============ ISI MODUL ============ */}
      <main className="px-4 pb-16">
        <ModuleBody sections={parsed.sections} moduleSlug={moduleItem.slug} />
      </main>

      {/* ============ NAVIGASI SEBELUMNYA / SELANJUTNYA ============ */}
      <footer className="px-4 pb-16">
        <ModuleFooterNav prev={adjacent?.prev ?? null} next={adjacent?.next ?? null} isLast={adjacent?.isLast ?? false} />
      </footer>
    </div>
  );
}
