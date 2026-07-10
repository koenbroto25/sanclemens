'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, PartyPopper, Award } from 'lucide-react';
import { moduleMarkdownComponents } from './MarkdownRenderers';
import type { ModuleSection, ParsedQuote } from '@/lib/learn-catholic/parseModuleMarkdown';

/* ============================================================
   Markdown ringkas — pembungkus ReactMarkdown dengan styling
   modul yang konsisten, dipakai di hampir semua section di bawah.
   ============================================================ */
function Md({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={moduleMarkdownComponents}>
      {children}
    </ReactMarkdown>
  );
}

/* ============================================================
   1. KUTIPAN PEMBUKA — kartu manuskrip, gilir otomatis kalau >1 kutipan
   ============================================================ */
export function OpeningQuotes({ quotes }: { quotes: ParsedQuote[] }) {
  const [active, setActive] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (quotes.length < 2 || reducedMotion) return;
    const id = setInterval(() => setActive((a) => (a + 1) % quotes.length), 9000);
    return () => clearInterval(id);
  }, [quotes.length, reducedMotion]);

  if (quotes.length === 0) return null;
  const quote = quotes[active];

  return (
    <div
      className="relative max-w-2xl mx-auto text-center px-6 py-8 md:px-10 md:py-10 rounded-[6px_28px_6px_28px]"
      style={{
        background: 'var(--color-parchment)',
        boxShadow: 'var(--shadow-card), 0 0 0 1px rgba(200,169,110,0.1)',
      }}
    >
      <span className="absolute top-3 left-4 w-6 h-6 border-t-2 border-l-2 opacity-50" style={{ borderColor: 'var(--color-gold)' }} />
      <span className="absolute bottom-3 right-4 w-6 h-6 border-b-2 border-r-2 opacity-50" style={{ borderColor: 'var(--color-gold)' }} />
      <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <blockquote
          className="text-lg md:text-xl italic leading-relaxed text-[var(--color-text-dark)]"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          &ldquo;{quote.text}&rdquo;
        </blockquote>
        {quote.attribution && (
          <p className="text-[var(--color-stone)] mt-4 text-sm">
            — <Md>{quote.attribution}</Md>
          </p>
        )}
      </motion.div>
      {quotes.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-5">
          {quotes.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Kutipan ${i + 1}`}
              className="rounded-full transition-all"
              style={{
                width: i === active ? 16 : 6,
                height: 6,
                background: i === active ? 'var(--color-gold)' : 'rgba(200,169,110,0.3)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   2. PENGANTAR — prosa dengan drop-cap huruf pertama
   ============================================================ */
export function IntroSection({ body }: { body: string }) {
  const firstCharMatch = body.match(/^[*_]*([^\s*_])/);
  const firstChar = firstCharMatch ? firstCharMatch[1] : '';
  const rest = firstChar ? body.replace(firstChar, '').replace(/^[*_]+/, '') : body;

  return (
    <div className="max-w-2xl mx-auto">
      {firstChar ? (
        <p className="text-[var(--color-text-dark)] leading-[1.9]">
          <span
            className="float-left leading-[0.8] pr-2 pt-1"
            style={{ fontFamily: 'var(--font-heading)', fontSize: '3.6rem', color: 'var(--color-gold-deep)' }}
          >
            {firstChar}
          </span>
          <Md>{rest}</Md>
        </p>
      ) : (
        <Md>{body}</Md>
      )}
    </div>
  );
}

/* ============================================================
   3. INTI AJARAN — mini-TOC lompat-ke-subbagian + isi bersubjudul
   ============================================================ */
export function TeachingSection({
  subsections,
  slugPrefix,
}: {
  subsections: { heading: string; body: string }[];
  slugPrefix: string;
}) {
  const idFor = (i: number) => `${slugPrefix}-inti-${i}`;

  return (
    <div className="max-w-2xl mx-auto">
      {subsections.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center mb-8 pb-6 border-b border-[rgba(200,169,110,0.15)]">
          {subsections.map((s, i) => (
            <a
              key={i}
              href={`#${idFor(i)}`}
              className="text-[0.68rem] font-medium px-3 py-1.5 rounded-full transition"
              style={{ background: 'rgba(200,169,110,0.1)', color: 'var(--color-gold-deep)' }}
            >
              {s.heading.split(' ')[0]}
            </a>
          ))}
        </div>
      )}
      <div className="space-y-10">
        {subsections.map((s, i) => (
          <div key={i} id={idFor(i)} className="scroll-mt-24">
            <h3
              className="text-lg md:text-xl font-bold text-[var(--color-text-dark)] mb-3"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {s.heading}
            </h3>
            <Md>{s.body}</Md>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   4. ANALOGI — kartu geser, satu analogi difokuskan sekaligus
   ============================================================ */
export function AnalogyCarousel({ items }: { items: { title: string; body: string }[] }) {
  const [active, setActive] = useState(0);
  if (items.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-2 justify-center mb-6 flex-wrap">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="text-sm font-medium px-4 py-2 rounded-full transition"
            style={
              i === active
                ? { background: 'var(--color-gold)', color: 'var(--color-primary)' }
                : { background: 'rgba(200,169,110,0.1)', color: 'var(--color-stone-dark)' }
            }
          >
            {item.title.replace(/:$/, '')}
          </button>
        ))}
      </div>
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="p-6 md:p-8 rounded-[4px_24px_4px_24px]"
        style={{ background: 'var(--color-parchment)', boxShadow: 'var(--shadow-card)' }}
      >
        <h4
          className="font-bold text-lg mb-3 text-[var(--color-gold-deep)]"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {items[active].title.replace(/:$/, '')}
        </h4>
        <Md>{items[active].body}</Md>
      </motion.div>
    </div>
  );
}

/* ============================================================
   5. PERSPEKTIF LINTAS TRADISI — grid kartu per tradisi
   ============================================================ */
export function CrossTraditionGrid({ items }: { items: { title: string; body: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item, i) => (
        <div
          key={i}
          className="p-5 rounded-[4px_20px_4px_20px] bg-white border border-[rgba(200,169,110,0.16)]"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <h4 className="font-bold text-[var(--color-gold-deep)] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            {item.title}
          </h4>
          <div className="text-sm">
            <Md>{item.body}</Md>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   6. PERTANYAAN YANG SERING DIAJUKAN — accordion
   ============================================================ */
export function FAQAccordion({ faqs }: { faqs: { question: string; body: string; refLine: string | null }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="rounded-[4px_20px_4px_20px] border border-[rgba(200,169,110,0.16)] bg-white overflow-hidden"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-3 text-left px-5 py-4"
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-[var(--color-text-dark)]">{faq.question}</span>
              <ChevronDown
                className="shrink-0 transition-transform duration-300"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--color-gold-deep)' }}
                size={18}
              />
            </button>
            {isOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-5 text-sm">
                <Md>{faq.body}</Md>
                {faq.refLine && (
                  <p className="mt-3 text-[0.7rem] uppercase tracking-wide font-semibold" style={{ color: 'var(--color-stone)' }}>
                    Ref: {faq.refLine.replace(/\*\*/g, '')}
                  </p>
                )}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   7. RUANG UNTUK MERAGUKAN / REFLEKSI — jurnal pribadi
   Catatan: disimpan di localStorage browser (per perangkat, belum
   sinkron lintas device). Cocok untuk MVP; upgrade ke tabel Supabase
   kalau nanti perlu sinkron/backup di seluruh perangkat pengguna.
   ============================================================ */
function useJournalEntry(key: string) {
  const [value, setValue] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) setValue(stored);
    } catch {
      /* localStorage tidak tersedia (mis. mode privat) — jurnal tetap berfungsi, hanya tidak persist */
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* abaikan kalau storage penuh/tidak tersedia */
      }
    }, 400);
    return () => clearTimeout(id);
  }, [key, value, loaded]);

  return [value, setValue] as const;
}

function JournalBox({ storageKey, placeholder }: { storageKey: string; placeholder: string }) {
  const [value, setValue] = useJournalEntry(storageKey);
  return (
    <div className="mt-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-[4px_14px_4px_14px] px-4 py-3 text-sm resize-y border transition focus:outline-none"
        style={{
          background: 'rgba(255,255,255,0.6)',
          borderColor: 'rgba(200,169,110,0.3)',
          color: 'var(--color-text-dark)',
        }}
      />
      <p className="text-[0.65rem] mt-1" style={{ color: 'var(--color-stone)' }}>
        Catatan pribadi — tersimpan di perangkat ini saja, tidak dibagikan.
      </p>
    </div>
  );
}

export function ReflectionJournal({
  introText,
  prompts,
  moduleSlug,
  sectionType,
}: {
  introText: string;
  prompts: string[];
  moduleSlug: string;
  sectionType: 'doubt' | 'reflection';
}) {
  return (
    <div
      className="max-w-2xl mx-auto rounded-[6px_28px_6px_28px] p-6 md:p-8"
      style={{ background: 'rgba(200,169,110,0.06)', border: '1px solid rgba(200,169,110,0.18)' }}
    >
      {introText && (
        <div className="mb-2">
          <Md>{introText}</Md>
        </div>
      )}
      {prompts.length > 0 ? (
        <div className="space-y-5 mt-4">
          {prompts.map((prompt, i) => (
            <div key={i}>
              <p className="italic text-[var(--color-text-dark)] leading-relaxed">{prompt}</p>
              <JournalBox
                storageKey={`learn-catholic:${moduleSlug}:${sectionType}:${i}`}
                placeholder="Tulis renunganmu di sini — hanya untukmu sendiri..."
              />
            </div>
          ))}
        </div>
      ) : (
        <JournalBox
          storageKey={`learn-catholic:${moduleSlug}:${sectionType}:0`}
          placeholder="Tulis renunganmu di sini — hanya untukmu sendiri..."
        />
      )}
    </div>
  );
}

/* ============================================================
   8. REFERENSI UNTUK PENDALAMAN — disembunyikan di balik toggle
   ============================================================ */
export function ReferenceTable({ raw }: { raw: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-[4px_20px_4px_20px] border border-[rgba(200,169,110,0.2)]"
        style={{ background: 'rgba(200,169,110,0.06)' }}
      >
        <span className="font-semibold text-[var(--color-text-dark)]">
          {open ? 'Sembunyikan Referensi' : 'Lihat Semua Referensi untuk Pendalaman'}
        </span>
        <ChevronDown
          size={18}
          className="transition-transform duration-300"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--color-gold-deep)' }}
        />
      </button>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
          <Md>{raw}</Md>
        </motion.div>
      )}
    </div>
  );
}

/* ============================================================
   9. PENUTUP SELURUH PROGRAM — perayaan khusus modul terakhir
   ============================================================ */
export function ClosingCelebration({ raw }: { raw: string }) {
  return (
    <div
      className="max-w-2xl mx-auto text-center p-8 md:p-12 rounded-[6px_32px_6px_32px] relative overflow-hidden"
      style={{
        background: 'linear-gradient(155deg, var(--color-parchment), var(--color-gold-light) 150%)',
        border: '1px solid rgba(200,169,110,0.4)',
        boxShadow: 'var(--shadow-warm-lg)',
      }}
    >
      <PartyPopper className="mx-auto mb-4" size={36} style={{ color: 'var(--color-gold-deep)' }} />
      <h3
        className="text-xl md:text-2xl font-bold mb-4 text-[var(--color-text-dark)]"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Kamu Sudah Sampai di Ujung Perjalanan
      </h3>
      <div className="text-left [&_p]:text-center">
        <Md>{raw}</Md>
      </div>
      <Link
        href="/user/dashboard/learn-catholic/sertifikat"
        className="inline-flex items-center gap-2 mt-6 px-8 py-3.5 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-deep)] text-[var(--color-cream)] rounded-[2px_24px_2px_24px] font-semibold shadow-[var(--shadow-gold-lg)] hover:-translate-y-0.5 transition-all"
      >
        <Award size={18} /> Ambil Sertifikatmu
      </Link>
    </div>
  );
}

/* ============================================================
   10. FALLBACK GENERIK — untuk section yang tidak dikenali polanya
   (Modul 0 memakai ini untuk hampir semua bagiannya)
   ============================================================ */
export function GenericSection({ heading, raw, showHeading }: { heading: string; raw: string; showHeading: boolean }) {
  return (
    <div className="max-w-2xl mx-auto">
      {showHeading && (
        <h3
          className="text-lg md:text-xl font-bold text-[var(--color-text-dark)] mb-3"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {heading}
        </h3>
      )}
      <Md>{raw}</Md>
    </div>
  );
}

/* ============================================================
   DISPATCHER — satu section markdown, satu komponen yang tepat
   ============================================================ */
export function ModuleBody({ sections, moduleSlug }: { sections: ModuleSection[]; moduleSlug: string }) {
  return (
    <div className="space-y-14 md:space-y-16">
      {sections.map((section, i) => {
        const slugPrefix = `s${i}`;
        switch (section.type) {
          case 'intro':
            return <IntroSection key={i} body={section.raw} />;
          case 'teaching':
            return <TeachingSection key={i} subsections={section.subsections || []} slugPrefix={slugPrefix} />;
          case 'analogy':
            return (
              <SectionShell key={i} icon="💭" title="Analogi">
                <AnalogyCarousel items={section.items || []} />
              </SectionShell>
            );
          case 'cross-tradition':
            return (
              <SectionShell key={i} icon="🌐" title={section.heading.replace(/^\d+\.\s*/, '')}>
                <CrossTraditionGrid items={section.items || []} />
              </SectionShell>
            );
          case 'faq':
            return (
              <SectionShell key={i} icon="❓" title="Pertanyaan yang Sering Diajukan">
                <FAQAccordion faqs={section.faqs || []} />
              </SectionShell>
            );
          case 'doubt':
            return (
              <SectionShell key={i} icon="🕯️" title="Ruang untuk Meragukan">
                <ReflectionJournal
                  introText={section.introText || ''}
                  prompts={section.prompts || []}
                  moduleSlug={moduleSlug}
                  sectionType="doubt"
                />
              </SectionShell>
            );
          case 'reflection':
            return (
              <SectionShell key={i} icon="✍️" title="Refleksi">
                <ReflectionJournal
                  introText={section.introText || ''}
                  prompts={section.prompts || []}
                  moduleSlug={moduleSlug}
                  sectionType="reflection"
                />
              </SectionShell>
            );
          case 'references':
            return <ReferenceTable key={i} raw={section.raw} />;
          case 'closing':
            return <ClosingCelebration key={i} raw={section.raw} />;
          default:
            return (
              <GenericSection
                key={i}
                heading={section.heading}
                raw={section.raw}
                showHeading={!/^\d+\.\s*(pengantar)?$/i.test(section.heading)}
              />
            );
        }
      })}
    </div>
  );
}

function SectionShell({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="text-xl" aria-hidden="true">{icon}</span>
        <h2
          className="text-xl md:text-2xl font-bold text-center text-[var(--color-text-dark)]"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
