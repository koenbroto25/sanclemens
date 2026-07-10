'use client';

import React from 'react';
import Link from 'next/link';
import type { Components } from 'react-markdown';
import { detectCitationCategory, CITATION_STYLE } from '@/lib/learn-catholic/citations';

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return extractText(props.children);
  }
  return '';
}

/** Blockquote dengan badge warna sesuai jenis sumber (KGK/Kitab Suci/Dokumen
 *  Gereja/Tokoh & Tradisi) — mendeteksi dari teks atribusi baris terakhir
 *  ("— **KGK No. 253**"), memakai ulang 4 warna jewel-tone yang sama dengan
 *  Empat Tahap di peta kurikulum. */
function CitedBlockquote({ children }: { children?: React.ReactNode }) {
  const text = extractText(children);
  const category = detectCitationCategory(text);
  const style = CITATION_STYLE[category];
  return (
    <blockquote
      className="my-5 pl-4 pr-3 py-3 rounded-r-[6px] not-italic"
      style={{ borderLeft: `3px solid ${style.border}`, background: style.bg }}
    >
      <span
        className="block text-[0.6rem] font-semibold uppercase tracking-[0.14em] mb-1.5"
        style={{ color: style.color }}
      >
        {style.label}
      </span>
      <div className="italic text-[var(--color-text-dark)] leading-relaxed [&>p]:my-1">{children}</div>
    </blockquote>
  );
}

/** Rujukan internal ("Modul 1.2") pakai next/link biar navigasi client-side;
 *  link eksternal (jarang muncul di konten ini) tetap <a> biasa target blank. */
function SmartLink({ href, children }: { href?: string; children?: React.ReactNode }) {
  if (href && href.startsWith('/')) {
    return (
      <Link
        href={href}
        className="text-[var(--color-gold-deep)] font-medium underline decoration-[rgba(200,169,110,0.4)] underline-offset-2 hover:decoration-[var(--color-gold-deep)] transition"
      >
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--color-gold-deep)] underline decoration-[rgba(200,169,110,0.4)] underline-offset-2"
    >
      {children}
    </a>
  );
}

export const moduleMarkdownComponents: Components = {
  blockquote: CitedBlockquote,
  a: SmartLink,
  p: ({ children }) => <p className="mb-4 leading-[1.85] text-[var(--color-text-dark)]">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-[var(--color-text-dark)]">{children}</strong>,
  ul: ({ children }) => <ul className="mb-4 ml-5 list-disc space-y-1.5 text-[var(--color-text-dark)]">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 ml-5 list-decimal space-y-1.5 text-[var(--color-text-dark)]">{children}</ol>,
  table: ({ children }) => (
    <div className="overflow-x-auto rounded-[8px] border border-[rgba(200,169,110,0.22)] my-4">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[rgba(200,169,110,0.1)]">{children}</thead>,
  th: ({ children }) => (
    <th className="text-left px-3 py-2 font-semibold text-[var(--color-gold-deep)] text-[0.68rem] uppercase tracking-wide whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2.5 border-t border-[rgba(200,169,110,0.14)] text-[var(--color-text-dark)] align-top text-[0.85rem]">
      {children}
    </td>
  ),
};
