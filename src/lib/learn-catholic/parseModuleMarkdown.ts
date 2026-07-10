import type { ModuleItem } from './curriculum';
import { linkifyModuleRefs } from './citations';

/* ============================================================
   PARSER MARKDOWN MODUL
   Mengubah satu file markdown mentah jadi struktur section yang
   sudah diklasifikasi tipenya, supaya tiap tipe bisa dapat
   komponen UI sendiri (lihat ModuleSections.tsx).

   PENTING: heading section TIDAK selalu sama persis di semua 21
   modul — modul pembuka (0) dan penutup (3.6) punya struktur
   berbeda. Karena itu classifyHeading() memakai keyword matching
   yang longgar, dan tipe yang tidak dikenali jatuh ke 'generic'
   (masih dirender, tidak pernah bikin halaman error).
   ============================================================ */

export type ModuleSectionType =
  | 'intro'
  | 'teaching'
  | 'analogy'
  | 'cross-tradition'
  | 'faq'
  | 'doubt'
  | 'reflection'
  | 'references'
  | 'closing'
  | 'generic';

export interface ParsedQuote {
  text: string;
  attribution: string;
}

export interface TeachingSubsection {
  heading: string;
  body: string;
}

export interface TitledItem {
  title: string;
  body: string;
}

export interface FaqItem {
  question: string;
  body: string;
  refLine: string | null;
}

export interface ModuleSection {
  type: ModuleSectionType;
  heading: string;
  raw: string;
  subsections?: TeachingSubsection[];
  items?: TitledItem[];
  faqs?: FaqItem[];
  prompts?: string[];
  introText?: string;
}

export interface ParsedModule {
  quotes: ParsedQuote[];
  sections: ModuleSection[];
}

function classifyHeading(heading: string): ModuleSectionType {
  const h = heading.toLowerCase();
  if (/pengantar/.test(h)) return 'intro';
  if (/inti ajaran/.test(h)) return 'teaching';
  if (/analogi/.test(h)) return 'analogy';
  if (/perspektif lintas tradisi/.test(h)) return 'cross-tradition';
  if (/sering diajukan/.test(h)) return 'faq';
  if (/meragukan/.test(h)) return 'doubt';
  if (/refleksi/.test(h)) return 'reflection';
  if (/referensi/.test(h)) return 'references';
  if (/penutup/.test(h)) return 'closing';
  return 'generic';
}

function parseQuotesBlock(preamble: string): ParsedQuote[] {
  const groups = preamble.match(/^> .+(?:\n> .+)*/gm) || [];
  return groups.map((g) => {
    const lines = g.split('\n').map((l) => l.replace(/^>\s?/, ''));
    const attrLineIdx = lines.findIndex((l) => l.trim().startsWith('—'));
    let quoteLines: string[];
    let attrLine: string;
    if (attrLineIdx === -1) {
      quoteLines = lines;
      attrLine = '';
    } else {
      quoteLines = lines.slice(0, attrLineIdx);
      attrLine = lines[attrLineIdx];
    }
    const text = quoteLines
      .join(' ')
      .trim()
      .replace(/^\*+|\*+$/g, '')
      .replace(/^"|"$/g, '')
      .trim();
    const attribution = attrLine.replace(/^—\s*/, '').trim();
    return { text, attribution };
  });
}

/** Untuk section "Analogi": pola "**Judul:**" diikuti baris baru lalu isi. */
function parseAnalogyLike(body: string): TitledItem[] {
  const parts = body.split(/\n(?=\*\*[^*]+\*\*:?\s*\n)/);
  const items: TitledItem[] = [];
  for (const part of parts) {
    const m = part.match(/^\*\*([^*]+?)\*\*:?\s*\n([\s\S]*)/);
    if (m) items.push({ title: m[1].trim(), body: m[2].trim() });
  }
  return items;
}

/** Untuk section "Perspektif Lintas Tradisi": pola "**Dalam X**, teks lanjut..." */
function parseCrossTradition(body: string): TitledItem[] {
  const paragraphs = body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const items: TitledItem[] = [];
  for (const p of paragraphs) {
    const m = p.match(/^\*\*([^*]+)\*\*,?\s*([\s\S]*)$/);
    if (m) items.push({ title: m[1].trim(), body: m[2].trim() });
  }
  return items;
}

function parseFaq(body: string): FaqItem[] {
  const chunks = body.split(/\n---\n/).map((c) => c.trim()).filter(Boolean);
  return chunks.map((chunk) => {
    const qMatch = chunk.match(/^\*\*"?(.+?)"?\*\*\s*\n([\s\S]*)/);
    let question = '';
    let rest = chunk;
    if (qMatch) {
      question = qMatch[1].trim();
      rest = qMatch[2].trim();
    }
    const refMatch = rest.match(/\n?\*\(Ref:([\s\S]*?)\)\*\s*$/);
    let refLine: string | null = null;
    let answerBody = rest;
    if (refMatch) {
      refLine = refMatch[1].trim();
      answerBody = rest.slice(0, refMatch.index).trim();
    }
    return { question, body: answerBody, refLine };
  });
}

/** Menangkap dua variasi format pertanyaan reflektif yang dipakai di 21 modul:
 *  baris list "- *teks*" (dipakai beberapa "Ruang untuk Meragukan"), atau
 *  paragraf polos "*teks*" (dipakai hampir semua "Refleksi"). Section yang
 *  tidak punya pola ini (prompt tertanam dalam kalimat) akan mengembalikan
 *  array kosong — komponennya tetap render prosa apa adanya, tidak rusak. */
function parsePrompts(body: string): { prompts: string[]; introText: string } {
  const re = /^(?:-\s*)?\*([^*\n]+)\*\s*$/gm;
  const prompts: string[] = [];
  let introText = body;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    prompts.push(match[1].trim());
    introText = introText.replace(match[0], '');
  }
  introText = introText.replace(/\n{2,}/g, '\n\n').trim();
  return { prompts, introText };
}

export function parseModuleMarkdown(
  raw: string,
  modules: ModuleItem[],
  crossLinkBasePath: string
): ParsedModule {
  const firstHeadingIdx = raw.search(/\n## \d/);
  const preamble = firstHeadingIdx === -1 ? '' : raw.slice(0, firstHeadingIdx);
  let mainContent = firstHeadingIdx === -1 ? raw : raw.slice(firstHeadingIdx + 1);

  const quotes = parseQuotesBlock(preamble);

  // hapus teaser "Modul selanjutnya: ..." di paling akhir file
  mainContent = mainContent.replace(/\n---\n+\*Modul selanjutnya:[\s\S]*$/, '').trim();

  // tautkan otomatis semua rujukan "Modul X.X" sebelum di-split per section
  mainContent = linkifyModuleRefs(mainContent, modules, crossLinkBasePath);

  const chunks = mainContent
    .split(/\n(?=## )/)
    .map((c) => c.trim())
    .filter(Boolean);

  const sections: ModuleSection[] = chunks.map((chunk) => {
    const lines = chunk.split('\n');
    const headingLine = lines[0].replace(/^##\s*/, '').trim();
    let body = lines.slice(1).join('\n').trim();
    body = body.replace(/^---\n+/, '').replace(/\n+---$/, '').trim();

    const type = classifyHeading(headingLine);
    const section: ModuleSection = { type, heading: headingLine, raw: body };

    if (type === 'teaching') {
      const subs = body.split(/\n(?=### )/).map((s) => s.trim()).filter(Boolean);
      section.subsections = subs.map((s) => {
        const sLines = s.split('\n');
        const subHeading = sLines[0].replace(/^###\s*/, '').trim();
        const subBody = sLines.slice(1).join('\n').trim();
        return { heading: subHeading, body: subBody };
      });
    } else if (type === 'analogy') {
      section.items = parseAnalogyLike(body);
    } else if (type === 'cross-tradition') {
      section.items = parseCrossTradition(body);
    } else if (type === 'faq') {
      section.faqs = parseFaq(body);
    } else if (type === 'doubt' || type === 'reflection') {
      const { prompts, introText } = parsePrompts(body);
      section.prompts = prompts;
      section.introText = introText;
    }
    return section;
  });

  return { quotes, sections };
}
