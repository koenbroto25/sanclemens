#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
dry_run.py — Audit chunking v2 TANPA menyentuh DB/R2 sama sekali.

Cara pakai di PowerShell (lokal, di komputer Deva):

    python dry_run.py "D:\\paroki_digital_stclemens\\data\\cleaned\\Tome of Leo (St. Leo Agung).md"
    python dry_run.py "D:\\paroki_digital_stclemens\\data\\cleaned" --all
    python dry_run.py "D:\\paroki_digital_stclemens\\data\\cleaned" --all --full C:\hasil_audit

Mode default: cetak ringkasan (pola terdeteksi, jumlah chunk, 3 contoh chunk
pertama dengan structural_ref-nya) ke terminal per dokumen.

--full <folder>: selain ringkasan, tulis SATU file .txt per dokumen ke
<folder> berisi SEMUA chunk + metadata-nya, untuk direview manual baris demi
baris sebelum dipercaya ke produksi.
"""
import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from chunk_engine import chunk_document, detect_pattern, _strip_frontmatter


def audit_file(path: Path, full_dir: Path | None = None):
    text = path.read_text(encoding='utf-8', errors='replace')
    doc_title = path.stem
    pattern = detect_pattern(_strip_frontmatter(text))
    chunks = chunk_document(text, doc_title)

    print(f"\n{'='*70}")
    print(f"FILE   : {path.name}")
    print(f"POLA   : {pattern}")
    print(f"CHUNKS : {len(chunks)}")
    if chunks:
        lens = [len(c.text) for c in chunks]
        print(f"PANJANG: min={min(lens)} max={max(lens)} avg={sum(lens)//len(lens)}")
        print(f"\n--- 3 contoh chunk pertama ---")
        for c in chunks[:3]:
            print(f"\n[ref: {c.structural_ref}] [prefix: {c.context_prefix}]")
            preview = c.text[:200].replace('\n', ' ')
            print(f"  {preview}{'...' if len(c.text) > 200 else ''}")
    else:
        print("  !! TIDAK ADA CHUNK DIHASILKAN — cek manual file ini.")

    if full_dir:
        full_dir.mkdir(parents=True, exist_ok=True)
        out_path = full_dir / f"{doc_title}__{pattern}.txt"
        with out_path.open('w', encoding='utf-8') as f:
            f.write(f"FILE: {path.name}\nPOLA TERDETEKSI: {pattern}\nJUMLAH CHUNK: {len(chunks)}\n")
            f.write("=" * 70 + "\n\n")
            for i, c in enumerate(chunks):
                f.write(f"--- CHUNK {i} [{c.pattern_used}] ---\n")
                f.write(f"structural_ref : {c.structural_ref}\n")
                f.write(f"context_prefix : {c.context_prefix}\n")
                f.write(f"panjang        : {len(c.text)} karakter\n")
                f.write(f"isi:\n{c.text}\n\n")
        print(f"  -> ditulis lengkap ke: {out_path}")

    return pattern, len(chunks)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path", help="File .md/.txt tunggal, atau folder kalau pakai --all")
    ap.add_argument("--all", action="store_true", help="Proses semua .md/.txt di folder")
    ap.add_argument("--full", metavar="OUTDIR", help="Tulis semua chunk lengkap ke folder ini")
    args = ap.parse_args()

    target = Path(args.path)
    full_dir = Path(args.full) if args.full else None

    if args.all:
        files = sorted(list(target.glob("*.md")) + list(target.glob("*.txt")))
        if not files:
            print(f"Tidak ada .md/.txt ditemukan di {target}")
            return
        summary = []
        for f in files:
            pattern, n = audit_file(f, full_dir)
            summary.append((f.name, pattern, n))
        print(f"\n\n{'='*70}")
        print("RINGKASAN SEMUA DOKUMEN")
        print(f"{'='*70}")
        for name, pattern, n in summary:
            print(f"  {pattern:28s} | {n:4d} chunks | {name}")
    else:
        audit_file(target, full_dir)


if __name__ == "__main__":
    main()
