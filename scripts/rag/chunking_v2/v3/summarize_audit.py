#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
summarize_audit.py — Ringkas hasil audit chunking dari folder --full tanpa
perlu scroll log terminal yang panjang/terpotong.

Skrip ini TIDAK menjalankan ulang chunking. Ia membaca file .txt yang sudah
dihasilkan dry_run.py --full (satu file per dokumen, isinya semua chunk +
metadata) dan menyusun satu laporan ringkas:

  - ringkasan semua dokumen (pola, jumlah chunk, panjang min/max/avg)
  - 3 contoh chunk pertama per dokumen (structural_ref + prefix + preview)
  - flag dokumen yang jumlah chunk-nya janggal (0 chunk, atau proporsi
    chunk sangat pendek/sangat panjang) supaya gampang dicek manual duluan

Cara pakai di PowerShell:

    python summarize_audit.py "C:\hasil_audit"
    python summarize_audit.py "C:\hasil_audit" --out ringkasan.txt
    python summarize_audit.py "C:\hasil_audit" --preview 400

Nama file di folder --full mengikuti format dry_run.py:
    <doc_title>__<POLA>.txt
isi tiap file:
    FILE: <nama asli>
    POLA TERDETEKSI: <pola>
    JUMLAH CHUNK: <n>
    ======================================================================

    --- CHUNK 0 [<pattern_used>] ---
    structural_ref : ...
    context_prefix : ...
    panjang        : <n> karakter
    isi:
    <teks chunk>

    --- CHUNK 1 [...] ---
    ...
"""
import re
import sys
import argparse
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class ChunkRecord:
    index: int
    pattern_used: str
    structural_ref: str
    context_prefix: str
    length: int
    text: str


@dataclass
class DocSummary:
    filename: str
    pattern: str
    n_chunks_header: int
    chunks: List[ChunkRecord] = field(default_factory=list)
    source_path: Optional[Path] = None
    parse_error: Optional[str] = None

    @property
    def n_chunks_actual(self) -> int:
        return len(self.chunks)

    @property
    def lengths(self) -> List[int]:
        return [c.length for c in self.chunks]


_HEADER_RE = re.compile(
    r'^FILE:\s*(?P<file>.+?)\s*\n'
    r'POLA TERDETEKSI:\s*(?P<pattern>.+?)\s*\n'
    r'JUMLAH CHUNK:\s*(?P<n>\d+)\s*\n',
    re.MULTILINE
)

_CHUNK_HEADER_RE = re.compile(
    r'^--- CHUNK (?P<idx>\d+) \[(?P<pat>[^\]]*)\] ---\s*\n'
    r'structural_ref\s*:\s*(?P<ref>.*?)\s*\n'
    r'context_prefix\s*:\s*(?P<prefix>.*?)\s*\n'
    r'panjang\s*:\s*(?P<len>\d+)\s*karakter\s*\n'
    r'isi:\s*\n',
    re.MULTILINE
)


def parse_audit_file(path: Path) -> DocSummary:
    """Parse satu file <doc>__<POLA>.txt hasil dry_run.py --full."""
    try:
        text = path.read_text(encoding='utf-8', errors='replace')
    except Exception as e:
        return DocSummary(filename=path.name, pattern="?", n_chunks_header=0,
                           source_path=path, parse_error=f"Gagal baca file: {e}")

    header = _HEADER_RE.match(text)
    if not header:
        return DocSummary(filename=path.name, pattern="?", n_chunks_header=0,
                           source_path=path,
                           parse_error="Header tidak cocok format dry_run.py (FILE/POLA/JUMLAH CHUNK) — cek apakah file ini memang hasil --full")

    doc = DocSummary(
        filename=header.group('file'),
        pattern=header.group('pattern'),
        n_chunks_header=int(header.group('n')),
        source_path=path,
    )

    matches = list(_CHUNK_HEADER_RE.finditer(text))
    for i, m in enumerate(matches):
        body_start = m.end()
        body_end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        chunk_text = text[body_start:body_end].strip()
        doc.chunks.append(ChunkRecord(
            index=int(m.group('idx')),
            pattern_used=m.group('pat'),
            structural_ref=m.group('ref'),
            context_prefix=m.group('prefix'),
            length=int(m.group('len')),
            text=chunk_text,
        ))
    return doc


def flag_issues(doc: DocSummary) -> List[str]:
    """Kembalikan daftar peringatan singkat untuk dokumen yang layak dicek
    manual lebih dulu."""
    issues = []
    if doc.parse_error:
        issues.append(doc.parse_error)
        return issues
    if doc.n_chunks_actual == 0:
        issues.append("TIDAK ADA CHUNK — cek file sumber, kemungkinan gagal total.")
    if doc.n_chunks_header != doc.n_chunks_actual:
        issues.append(
            f"Jumlah di header ({doc.n_chunks_header}) != jumlah chunk terparse "
            f"({doc.n_chunks_actual}) — file --full mungkin terpotong saat ditulis."
        )
    if doc.chunks:
        lens = doc.lengths
        very_short = sum(1 for l in lens if l < 60)
        if very_short / len(lens) > 0.3:
            issues.append(
                f"{very_short}/{len(lens)} chunk sangat pendek (<60 karakter) — "
                f"kemungkinan match struktural palsu (mis. heading kosong, baris metadata)."
            )
        # pola tunggal chapter/heading tanpa nomor -> banyak chunk raksasa
        if doc.pattern in ("CHAPTER_HEADING",) and len(lens) > 3000:
            issues.append(
                f"Pola {doc.pattern} tapi jumlah chunk sangat besar ({len(lens)}) — "
                f"cek apakah dokumen ini sebenarnya punya penomoran paragraf resmi "
                f"yang tidak terdeteksi (lihat CHANGELOG chunk_engine.py soal Homili)."
            )
    return issues


def format_doc_report(doc: DocSummary, preview_len: int, n_examples: int) -> str:
    lines = []
    lines.append("=" * 70)
    lines.append(f"FILE   : {doc.filename}")
    lines.append(f"POLA   : {doc.pattern}")
    lines.append(f"CHUNKS : {doc.n_chunks_actual}"
                 + (f" (header bilang {doc.n_chunks_header})" if doc.n_chunks_header != doc.n_chunks_actual else ""))

    if doc.parse_error:
        lines.append(f"!! {doc.parse_error}")
        return "\n".join(lines)

    if doc.chunks:
        lens = doc.lengths
        lines.append(f"PANJANG: min={min(lens)} max={max(lens)} avg={sum(lens)//len(lens)}")

    issues = flag_issues(doc)
    for issue in issues:
        lines.append(f"!! PERHATIAN: {issue}")

    if doc.chunks:
        lines.append(f"\n--- {min(n_examples, len(doc.chunks))} contoh chunk pertama ---")
        for c in doc.chunks[:n_examples]:
            preview = c.text[:preview_len].replace('\n', ' ')
            ellipsis = "..." if len(c.text) > preview_len else ""
            lines.append(f"\n[ref: {c.structural_ref}] [prefix: {c.context_prefix}] [pola_chunk: {c.pattern_used}]")
            lines.append(f"  {preview}{ellipsis}")
    else:
        lines.append("  !! TIDAK ADA CHUNK DITEMUKAN DI FILE INI.")

    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("folder", help=r'Folder hasil --full dry_run.py, mis. "C:\hasil_audit"')
    ap.add_argument("--out", metavar="FILE", help="Tulis laporan ke file ini (selain tampil di terminal)")
    ap.add_argument("--preview", type=int, default=250, help="Panjang preview per contoh chunk (default 250 karakter)")
    ap.add_argument("--examples", type=int, default=3, help="Jumlah contoh chunk per dokumen (default 3)")
    args = ap.parse_args()

    folder = Path(args.folder)
    if not folder.is_dir():
        print(f"Folder tidak ditemukan: {folder}")
        sys.exit(1)

    txt_files = sorted(folder.glob("*.txt"))
    if not txt_files:
        print(f"Tidak ada .txt ditemukan di {folder}. Pastikan ini folder hasil dry_run.py --full.")
        sys.exit(1)

    docs = [parse_audit_file(p) for p in txt_files]

    report_lines = []
    report_lines.append("=" * 70)
    report_lines.append(f"RINGKASAN AUDIT CHUNKING — {folder}")
    report_lines.append(f"Jumlah file diproses: {len(docs)}")
    report_lines.append("=" * 70)

    # --- bagian 1: tabel ringkas semua dokumen, diurutkan per nama file ---
    report_lines.append("\n" + "=" * 70)
    report_lines.append("TABEL RINGKAS SEMUA DOKUMEN")
    report_lines.append("=" * 70)
    total_chunks = 0
    flagged_docs = []
    for doc in docs:
        n = doc.n_chunks_actual
        total_chunks += n
        issues = flag_issues(doc)
        flag_str = "  [!!]" if issues else ""
        report_lines.append(f"  {doc.pattern:28s} | {n:6d} chunks | {doc.filename}{flag_str}")
        if issues:
            flagged_docs.append((doc, issues))
    report_lines.append(f"\nTOTAL CHUNK SELURUH KORPUS: {total_chunks}")

    # --- bagian 2: dokumen yang perlu dicek manual duluan ---
    if flagged_docs:
        report_lines.append("\n" + "=" * 70)
        report_lines.append(f"PERLU DICEK MANUAL DULUAN ({len(flagged_docs)} dokumen)")
        report_lines.append("=" * 70)
        for doc, issues in flagged_docs:
            report_lines.append(f"\n{doc.filename} [{doc.pattern}]:")
            for issue in issues:
                report_lines.append(f"  - {issue}")

    # --- bagian 3: detail + 3 contoh chunk per dokumen ---
    report_lines.append("\n" + "=" * 70)
    report_lines.append("DETAIL PER DOKUMEN + CONTOH CHUNK")
    report_lines.append("=" * 70)
    for doc in docs:
        report_lines.append("\n" + format_doc_report(doc, args.preview, args.examples))

    report = "\n".join(report_lines)
    print(report)

    if args.out:
        out_path = Path(args.out)
        out_path.write_text(report, encoding='utf-8')
        print(f"\n\n(Laporan lengkap juga ditulis ke: {out_path.resolve()})")


if __name__ == "__main__":
    main()
