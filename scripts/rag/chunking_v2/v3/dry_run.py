#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
dry_run.py — Audit chunking v2 TANPA menyentuh DB/R2 sama sekali.

VERSI "BERSIH": ditulis ulang supaya tidak ada risiko modul chunk_engine.py
lama ter-cache (mis. .pyc basi, atau instalasi ganda di PYTHONPATH lain).
Setiap run mencetak path absolut dan hash file chunk_engine.py yang benar-
benar dipakai, di baris paling atas output, SEBELUM memproses dokumen apa
pun. Kalau hasil audit terasa tidak berubah padahal chunk_engine.py sudah
diedit, cek dulu baris itu — kalau hash-nya tidak berubah, filenya memang
belum tertimpa (mis. disimpan di folder lain, atau py_compile cache lama
masih dipakai import system).

Cara pakai di PowerShell (lokal, di komputer Deva):

    python dry_run.py "D:\\paroki_digital_stclemens\\data\\cleaned\\Tome of Leo (St. Leo Agung).md"
    python dry_run.py "D:\\paroki_digital_stclemens\\data\\cleaned" --all
    python dry_run.py "D:\\paroki_digital_stclemens\\data\\cleaned" --all --full C:\hasil_audit

WAJIB dijalankan dari folder yang SAMA dengan chunk_engine.py (skrip ini
memaksa import dari folder tempat dry_run.py sendiri berada, bukan dari
PYTHONPATH atau cache manapun -- lihat blok import di bawah).

Mode default: cetak ringkasan (pola terdeteksi, jumlah chunk, 3 contoh chunk
pertama dengan structural_ref-nya) ke terminal per dokumen.

--full <folder>: selain ringkasan, tulis SATU file .txt per dokumen ke
<folder> berisi SEMUA chunk + metadata-nya, untuk direview manual baris demi
baris sebelum dipercaya ke produksi. Folder ini DIBERSIHKAN (file .txt lama
dihapus) di awal setiap run --all supaya tidak ada file --full basi dari
run sebelumnya yang tercampur dengan hasil run ini.
"""
import sys
import argparse
import hashlib
import importlib
import shutil
from pathlib import Path

# --- Import chunk_engine SECARA PAKSA dari folder skrip ini, bukan dari
# cache/PYTHONPATH lain. Kalau modul ini sudah pernah ter-import (mis. lewat
# python -i atau notebook), buang dulu dari sys.modules supaya versi lama
# tidak nyangkut.
_THIS_DIR = Path(__file__).resolve().parent
if str(_THIS_DIR) not in sys.path:
    sys.path.insert(0, str(_THIS_DIR))
else:
    sys.path.remove(str(_THIS_DIR))
    sys.path.insert(0, str(_THIS_DIR))

if 'chunk_engine' in sys.modules:
    del sys.modules['chunk_engine']

import chunk_engine as ce
importlib.reload(ce)  # jaga-jaga kalau modul ini sudah pernah dimuat sebelumnya

from chunk_engine import chunk_document, detect_pattern, _strip_frontmatter, has_encoding_issue

_ENGINE_PATH = Path(ce.__file__).resolve()


def _print_engine_banner():
    """Cetak path absolut + hash chunk_engine.py yang BENAR-BENAR dipakai,
    supaya tidak ada keraguan lagi versi mana yang sedang diuji."""
    try:
        content = _ENGINE_PATH.read_bytes()
        digest = hashlib.sha256(content).hexdigest()[:12]
        size = len(content)
        mtime = _ENGINE_PATH.stat().st_mtime
        import datetime
        mtime_str = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
    except Exception as e:
        digest = f"(gagal baca: {e})"
        size = "?"
        mtime_str = "?"
    print("=" * 70)
    print("chunk_engine.py yang dipakai run ini:")
    print(f"  path       : {_ENGINE_PATH}")
    print(f"  sha256[:12]: {digest}")
    print(f"  ukuran     : {size} bytes")
    print(f"  terakhir diubah: {mtime_str}")
    print("=" * 70)


def audit_file(path: Path, full_dir: Path | None = None):
    text = path.read_text(encoding='utf-8', errors='replace')
    doc_title = path.stem
    body = _strip_frontmatter(text)
    pattern = detect_pattern(body)
    chunks = chunk_document(text, doc_title)
    mojibake = has_encoding_issue(text)

    print(f"\n{'='*70}")
    print(f"FILE   : {path.name}")
    print(f"POLA   : {pattern}")
    print(f"CHUNKS : {len(chunks)}")
    if mojibake:
        print(f"!! PERINGATAN: terdeteksi mojibake (encoding rusak) di file sumber ini.")
        print(f"   Perbaiki encoding di sumber SEBELUM ingest — chunking tidak memperbaikinya.")
    if chunks:
        lens = [len(c.text) for c in chunks]
        print(f"PANJANG: min={min(lens)} max={max(lens)} avg={sum(lens)//len(lens)}")
        print(f"\n--- 3 contoh chunk pertama ---")
        for c in chunks[:3]:
            preview = c.text[:200].replace('\n', ' ')
            print(f"\n[ref: {c.structural_ref}] [prefix: {c.context_prefix}]")
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

    return pattern, len(chunks), mojibake


def debug_headings(path: Path):
    """Tampilkan semua match _CHAPTER_HEAD_RE dan _NUMBERED_PARA_RE di file
    ini beserta posisi dan konteksnya. Dipakai untuk mendiagnosis kasus di
    mana sebuah dokumen terdeteksi CHAPTER_NUMBERED_PARAGRAPH padahal
    seharusnya NUMBERED_PARAGRAPH biasa (atau sebaliknya) -- supaya bisa
    dipastikan langsung dari teks sumber, bukan tebak-tebakan dari hasil
    akhir chunking."""
    text = path.read_text(encoding='utf-8', errors='replace')
    body = _strip_frontmatter(text)

    chap_matches = list(ce._CHAPTER_HEAD_RE.finditer(body))
    num_matches = list(ce._NUMBERED_PARA_RE.finditer(body))

    print(f"\n{'='*70}")
    print(f"DEBUG HEADINGS: {path.name}")
    print(f"{'='*70}")
    print(f"Total match _CHAPTER_HEAD_RE (BAB/CHAPTER/BUKU) : {len(chap_matches)}")
    print(f"Total match _NUMBERED_PARA_RE (paragraf bernomor): {len(num_matches)}")

    if chap_matches:
        print(f"\n--- Semua heading BAB/CHAPTER/BUKU yang match ---")
        for i, m in enumerate(chap_matches):
            ctx_start = max(0, m.start() - 40)
            ctx = body[ctx_start:m.start()].replace('\n', ' \\n ')
            line_text = m.group(0)[:100]
            print(f"  [{i}] posisi={m.start():>8d}  konteks_sebelum='...{ctx}'  heading='{line_text}'")
    else:
        print("\n  (tidak ada heading BAB/CHAPTER/BUKU yang match sama sekali)")

    if num_matches:
        first_chap_pos = chap_matches[0].start() if chap_matches else None
        before = sum(1 for m in num_matches if first_chap_pos is not None and m.start() < first_chap_pos)
        after = len(num_matches) - before if first_chap_pos is not None else len(num_matches)
        print(f"\n--- Ringkasan posisi paragraf bernomor relatif thd heading pertama ---")
        if first_chap_pos is not None:
            print(f"  paragraf SEBELUM heading Bab pertama : {before}")
            print(f"  paragraf SESUDAH heading Bab pertama : {after}")
            print(f"  proporsi sesudah: {after/len(num_matches):.1%}  (ambang deteksi CHAPTER_NUMBERED_PARAGRAPH: >=50%)")
        print(f"\n--- 10 match pertama _NUMBERED_PARA_RE ---")
        for m in num_matches[:10]:
            print(f"  nomor={m.group(1):>4s}  posisi={m.start():>8d}")

    pattern = detect_pattern(body)
    print(f"\n--- Kesimpulan ---")
    print(f"  Pola yang dipilih dispatcher: {pattern}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path", help="File .md/.txt tunggal, atau folder kalau pakai --all")
    ap.add_argument("--all", action="store_true", help="Proses semua .md/.txt di folder")
    ap.add_argument("--full", metavar="OUTDIR", help="Tulis semua chunk lengkap ke folder ini")
    ap.add_argument("--no-clean", action="store_true",
                     help="JANGAN bersihkan folder --full sebelum run (default: dibersihkan dulu supaya tidak ada file basi dari run sebelumnya)")
    ap.add_argument("--debug-headings", action="store_true",
                     help="Untuk file TUNGGAL (bukan --all): tampilkan semua heading yang match "
                          "_CHAPTER_HEAD_RE (BAB/CHAPTER/BUKU) beserta posisi karakternya, dan semua "
                          "match _NUMBERED_PARA_RE beserta posisinya. Berguna untuk memastikan apakah "
                          "sebuah dokumen benar-benar punya heading Bab struktural, atau heading itu "
                          "cuma kecocokan tak disengaja (mis. dari catatan kaki/sitasi).")
    args = ap.parse_args()

    _print_engine_banner()

    target = Path(args.path)

    if args.debug_headings:
        if args.all:
            print("--debug-headings hanya untuk file tunggal, bukan --all. Jalankan tanpa --all.")
            return
        debug_headings(target)
        return

    full_dir = Path(args.full) if args.full else None

    if full_dir and not args.no_clean:
        if full_dir.exists():
            old_txts = list(full_dir.glob("*.txt"))
            if old_txts:
                print(f"Membersihkan {len(old_txts)} file .txt lama di {full_dir} sebelum run ini...")
                for f in old_txts:
                    f.unlink()
        else:
            full_dir.mkdir(parents=True, exist_ok=True)

    if args.all:
        files = sorted(list(target.glob("*.md")) + list(target.glob("*.txt")))
        if not files:
            print(f"Tidak ada .md/.txt ditemukan di {target}")
            return
        summary = []
        for f in files:
            pattern, n, mojibake = audit_file(f, full_dir)
            summary.append((f.name, pattern, n, mojibake))
        print(f"\n\n{'='*70}")
        print("RINGKASAN SEMUA DOKUMEN")
        print(f"{'='*70}")
        for name, pattern, n, mojibake in summary:
            flag = "  [ENCODING RUSAK]" if mojibake else ""
            print(f"  {pattern:28s} | {n:4d} chunks | {name}{flag}")
        print(f"\nTOTAL CHUNK: {sum(n for _, _, n, _ in summary)}")
        print(f"chunk_engine.py dipakai: {_ENGINE_PATH} (sha256[:12]={hashlib.sha256(_ENGINE_PATH.read_bytes()).hexdigest()[:12]})")
    else:
        audit_file(target, full_dir)
        print(f"\nchunk_engine.py dipakai: {_ENGINE_PATH} (sha256[:12]={hashlib.sha256(_ENGINE_PATH.read_bytes()).hexdigest()[:12]})")


if __name__ == "__main__":
    main()
