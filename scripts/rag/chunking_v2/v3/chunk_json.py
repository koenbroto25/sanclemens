#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
chunk_json.py — Chunking untuk data JSON per-record (prayers.json,
saints_part1/2/3.json) yang STRUKTURNYA BEDA TOTAL dari korpus markdown/txt
yang ditangani chunk_engine.py.

chunk_engine.py mendeteksi pola teks bebas (numbered paragraph, chapter
heading, dst) lewat regex, karena sumbernya adalah dokumen panjang tanpa
struktur field yang jelas. Data di sini SUDAH terstruktur per-record dengan
field eksplisit (saint_name, biography, patronage, dst) -- deteksi pola
regex tidak relevan dan malah salah pendekatan. Setiap record dipetakan
langsung ke 1 atau lebih chunk berdasarkan field-nya.

SKEMA per record (saints maupun prayers):
  1. Chunk "Ringkasan" -- SELALU 1 per record. Menggabungkan field pendek
     (nama, tipe, hari raya/jenis, patronage/kategori, visual_attributes)
     jadi satu paragraf naratif. Field array digabung ke DALAM teks (bukan
     disimpan sebagai metadata terpisah) supaya ikut ter-embed dan bisa
     dicari secara semantik -- mis. "santo pelindung rumah sakit" harus
     bisa match kata "rumah sakit" yang berasal dari field patronage.
  2. Chunk isi utama (biography / indonesian_text) -- dipecah per
     ~CHUNK_SIZE karakter dengan overlap per-kalimat (pakai mekanisme yang
     SAMA seperti chunk_engine.py: _split_long_text) kalau melebihi batas.
     Kalau field ini pendek (<= CHUNK_SIZE), jadi 1 chunk saja.

Setiap chunk (baik Ringkasan maupun isi) diberi context_prefix yang SAMA:
nama + tipe + hari raya/jenis -- supaya potongan mana pun tetap membawa
konteks siapa/apa yang dibicarakan meski berdiri sendiri saat di-retrieve.

DETEKSI BUG DATA (dilaporkan, TIDAK diperbaiki otomatis -- lihat CATATAN
di bawah): field array (patronage, visual_attributes) kadang berisi SATU
KALIMAT yang terpecah jadi >1 elemen oleh koma di tengah kalimat, bukan
benar-benar beberapa item terpisah. Contoh nyata dari saints_part1.json
(entri yang sudah dihapus dari data, tapi pola bug-nya masih relevan utk
entri lain): ["Tidak berlaku (Tuhan Yesus Kristus adalah pusat iman
Kristiani", "bukan Orang Kudus dalam pengertian kanonisasi)"] -- ada
kurung buka di elemen pertama tanpa kurung tutup, dan kurung tutup di
elemen kedua tanpa kurung buka. Skrip ini mendeteksi pola seperti ini
(kurung tak seimbang antar-elemen array) dan MELAPORKANNYA sebagai
peringatan, bukan menggabungkannya secara otomatis, karena heuristik
penggabungan berisiko salah menebak batas kalimat yang benar.

Cara pakai di PowerShell:

    python chunk_json.py "D:\...\prayers.json" --kind prayers
    python chunk_json.py "D:\...\saints_part1.json" --kind saints
    python chunk_json.py "D:\...\saints_part1.json" --kind saints --full C:\hasil_audit_json

--full <folder>: tulis SATU file .txt per file JSON input ke <folder>,
berisi semua chunk + metadata, sama seperti dry_run.py --full untuk
korpus markdown/txt -- supaya format hasil audit konsisten dan bisa
dipakai bersama summarize_audit.py yang sudah ada.
"""
import sys
import json
import argparse
import hashlib
from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional

# --- pakai mekanisme split-panjang yang SAMA seperti chunk_engine.py, supaya
# perilaku pemotongan konsisten di seluruh korpus (JSON maupun markdown/txt).
_THIS_DIR = Path(__file__).resolve().parent
if str(_THIS_DIR) not in sys.path:
    sys.path.insert(0, str(_THIS_DIR))
import chunk_engine as ce


@dataclass
class JsonChunk:
    text: str
    context_prefix: str
    structural_ref: str
    pattern_used: str


def _has_unbalanced_parens_pattern(items: List[str]) -> bool:
    """Deteksi pola bug: satu kalimat terpecah jadi >1 elemen array oleh
    koma di tengah kalimat. Sinyal: ada elemen dengan '(' tanpa ')' yang
    berpasangan di elemen BERIKUTNYA yang punya ')' tanpa '('."""
    for i in range(len(items) - 1):
        a, b = items[i], items[i + 1]
        a_open = a.count('(') - a.count(')')
        b_close = b.count(')') - b.count('(')
        if a_open > 0 and b_close > 0:
            return True
    return False


def _join_array_field(items: Optional[List[str]]) -> str:
    if not items:
        return ""
    return ", ".join(str(x).strip() for x in items if str(x).strip())


def _make_context_prefix_saint(rec: dict) -> str:
    name = rec.get('saint_name', '').strip()
    typ = rec.get('type')
    feast = rec.get('feast_day', '').strip()
    parts = [name]
    detail = []
    if typ:
        detail.append(str(typ))
    if feast:
        detail.append(f"pesta {feast}")
    if detail:
        parts.append(f"({', '.join(detail)})")
    return " ".join(parts)


def _make_context_prefix_prayer(rec: dict) -> str:
    name = rec.get('prayer_name', '').strip()
    ptype = rec.get('prayer_type', '').strip()
    if ptype:
        return f"{name} ({ptype})"
    return name


def chunk_saint_record(rec: dict, warnings: List[str]) -> List[JsonChunk]:
    prefix = _make_context_prefix_saint(rec)
    ref_base = rec.get('saint_name', '').strip() or f"noID {rec.get('noID')}"
    chunks = []

    # --- Chunk Ringkasan (selalu 1) ---
    patronage = rec.get('patronage') or []
    visual = rec.get('visual_attributes') or []
    if _has_unbalanced_parens_pattern(patronage):
        warnings.append(
            f"[{ref_base}] field 'patronage' kemungkinan satu kalimat terpecah jadi "
            f"beberapa elemen array (kurung tak seimbang antar-elemen): {patronage}"
        )
    if _has_unbalanced_parens_pattern(visual):
        warnings.append(
            f"[{ref_base}] field 'visual_attributes' kemungkinan satu kalimat terpecah "
            f"jadi beberapa elemen array (kurung tak seimbang antar-elemen): {visual}"
        )

    meta_parts = [rec.get('saint_name', '').strip() + "."]
    if rec.get('type'):
        meta_parts.append(f"{rec['type']}.")
    if rec.get('feast_day'):
        meta_parts.append(f"Hari raya/pesta: {rec['feast_day']}.")
    if patronage:
        meta_parts.append(f"Pelindung: {_join_array_field(patronage)}.")
    if visual:
        meta_parts.append(f"Atribut visual: {_join_array_field(visual)}.")
    meta_text = " ".join(meta_parts).strip()
    if meta_text:
        chunks.append(JsonChunk(
            text=meta_text,
            context_prefix=prefix,
            structural_ref=f"{ref_base} — Ringkasan",
            pattern_used="JSON_SAINT_SUMMARY",
        ))
    else:
        warnings.append(f"[{ref_base}] tidak ada field ringkasan sama sekali (nama/tipe/pesta/patronage/visual semua kosong).")

    # --- Chunk biography (dipecah kalau panjang) ---
    bio = (rec.get('biography') or "").strip()
    if not bio:
        warnings.append(f"[{ref_base}] field 'biography' kosong.")
    else:
        pieces = ce._split_long_text(bio)
        for pi, piece in enumerate(pieces):
            if len(piece) < ce.MIN_CHUNK_LEN:
                continue
            ref = ce._ref_with_suffix(f"{ref_base} — Biografi", pi, len(pieces))
            chunks.append(JsonChunk(
                text=piece,
                context_prefix=prefix,
                structural_ref=ref,
                pattern_used="JSON_SAINT_BIOGRAPHY",
            ))
    return chunks


def chunk_prayer_record(rec: dict, warnings: List[str]) -> List[JsonChunk]:
    prefix = _make_context_prefix_prayer(rec)
    ref_base = rec.get('prayer_name', '').strip() or "(tanpa nama)"
    chunks = []

    meta_parts = [rec.get('prayer_name', '').strip() + "."]
    if rec.get('category'):
        meta_parts.append(f"Kategori: {rec['category']}.")
    if rec.get('meaning'):
        meaning = str(rec['meaning']).strip()
        if meaning and not meaning.endswith(('.', '!', '?')):
            meaning += "."
        meta_parts.append(meaning)
    if rec.get('source_reference'):
        meta_parts.append(f"Sumber/rujukan: {rec['source_reference']}.")
    meta_text = " ".join(p for p in meta_parts if p).strip()
    if meta_text:
        chunks.append(JsonChunk(
            text=meta_text,
            context_prefix=prefix,
            structural_ref=f"{ref_base} — Ringkasan",
            pattern_used="JSON_PRAYER_SUMMARY",
        ))
    else:
        warnings.append(f"[{ref_base}] tidak ada field ringkasan sama sekali.")

    text_id = (rec.get('indonesian_text') or "").strip()
    if not text_id:
        warnings.append(f"[{ref_base}] field 'indonesian_text' kosong.")
    else:
        pieces = ce._split_long_text(text_id)
        for pi, piece in enumerate(pieces):
            if len(piece) < ce.MIN_CHUNK_LEN:
                continue
            ref = ce._ref_with_suffix(f"{ref_base} — Teks Doa", pi, len(pieces))
            chunks.append(JsonChunk(
                text=piece,
                context_prefix=prefix,
                structural_ref=ref,
                pattern_used="JSON_PRAYER_TEXT",
            ))

    latin = (rec.get('latin_text') or "").strip()
    if latin:
        pieces = ce._split_long_text(latin)
        for pi, piece in enumerate(pieces):
            if len(piece) < ce.MIN_CHUNK_LEN:
                continue
            ref = ce._ref_with_suffix(f"{ref_base} — Teks Latin", pi, len(pieces))
            chunks.append(JsonChunk(
                text=piece,
                context_prefix=prefix,
                structural_ref=ref,
                pattern_used="JSON_PRAYER_TEXT_LATIN",
            ))
    return chunks


def load_records(path: Path, kind: str) -> List[dict]:
    with path.open(encoding='utf-8') as f:
        data = json.load(f)
    if kind == "prayers":
        if isinstance(data, dict) and "prayers" in data:
            return data["prayers"]
        if isinstance(data, list):
            return data
        raise ValueError("Struktur prayers.json tidak dikenali (butuh dict dengan key 'prayers', atau list langsung).")
    else:  # saints
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and "saints" in data:
            return data["saints"]
        raise ValueError("Struktur saints_*.json tidak dikenali (butuh list langsung, atau dict dengan key 'saints').")


def audit_json_file(path: Path, kind: str, full_dir: Optional[Path] = None):
    mojibake_records = []
    warnings: List[str] = []

    raw_text = path.read_text(encoding='utf-8', errors='replace')
    if ce.has_encoding_issue(raw_text):
        print(f"!! PERINGATAN GLOBAL: terdeteksi mojibake (encoding rusak) di file {path.name}.")
        print(f"   Perbaiki encoding di sumber SEBELUM ingest.")

    records = load_records(path, kind)
    all_chunks: List[JsonChunk] = []
    for rec in records:
        rec_warnings: List[str] = []
        if kind == "prayers":
            chunks = chunk_prayer_record(rec, rec_warnings)
        else:
            chunks = chunk_saint_record(rec, rec_warnings)
        all_chunks.extend(chunks)
        warnings.extend(rec_warnings)

        # cek mojibake per-record di field teks utama
        main_field = rec.get('biography') if kind == "saints" else rec.get('indonesian_text')
        if main_field and ce.has_encoding_issue(main_field):
            name = rec.get('saint_name') or rec.get('prayer_name') or '(tanpa nama)'
            mojibake_records.append(name)

    print(f"\n{'='*70}")
    print(f"FILE   : {path.name}")
    print(f"JENIS  : {kind}")
    print(f"RECORDS: {len(records)}")
    print(f"CHUNKS : {len(all_chunks)}")
    if mojibake_records:
        print(f"!! {len(mojibake_records)} record dengan mojibake di field teks utama (lihat detail di --full jika diaktifkan).")
    if warnings:
        print(f"!! {len(warnings)} peringatan kualitas data ditemukan:")
        for w in warnings[:15]:
            print(f"   - {w}")
        if len(warnings) > 15:
            print(f"   ... dan {len(warnings) - 15} peringatan lainnya (lihat --full untuk daftar lengkap).")

    if all_chunks:
        lens = [len(c.text) for c in all_chunks]
        print(f"PANJANG: min={min(lens)} max={max(lens)} avg={sum(lens)//len(lens)}")
        print(f"\n--- 3 contoh chunk pertama ---")
        for c in all_chunks[:3]:
            preview = c.text[:200].replace('\n', ' ')
            print(f"\n[ref: {c.structural_ref}] [prefix: {c.context_prefix}] [pola: {c.pattern_used}]")
            print(f"  {preview}{'...' if len(c.text) > 200 else ''}")

    if full_dir:
        full_dir.mkdir(parents=True, exist_ok=True)
        out_path = full_dir / f"{path.stem}__JSON_{kind.upper()}.txt"
        with out_path.open('w', encoding='utf-8') as f:
            f.write(f"FILE: {path.name}\nJENIS: {kind}\nRECORDS: {len(records)}\nJUMLAH CHUNK: {len(all_chunks)}\n")
            if mojibake_records:
                f.write(f"PERINGATAN MOJIBAKE: {len(mojibake_records)} record -> {mojibake_records}\n")
            if warnings:
                f.write(f"\nPERINGATAN KUALITAS DATA ({len(warnings)}):\n")
                for w in warnings:
                    f.write(f"  - {w}\n")
            f.write("=" * 70 + "\n\n")
            for i, c in enumerate(all_chunks):
                f.write(f"--- CHUNK {i} [{c.pattern_used}] ---\n")
                f.write(f"structural_ref : {c.structural_ref}\n")
                f.write(f"context_prefix : {c.context_prefix}\n")
                f.write(f"panjang        : {len(c.text)} karakter\n")
                f.write(f"isi:\n{c.text}\n\n")
        print(f"  -> ditulis lengkap ke: {out_path}")

    return len(records), len(all_chunks), len(warnings)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("path", help="File JSON tunggal (prayers.json ATAU salah satu saints_part*.json)")
    ap.add_argument("--kind", required=True, choices=["prayers", "saints"], help="Jenis data JSON")
    ap.add_argument("--full", metavar="OUTDIR", help="Tulis semua chunk lengkap ke folder ini")
    args = ap.parse_args()

    target = Path(args.path)
    full_dir = Path(args.full) if args.full else None

    try:
        content = Path(ce.__file__).read_bytes()
        digest = hashlib.sha256(content).hexdigest()[:12]
        print(f"chunk_engine.py dipakai (untuk _split_long_text): {Path(ce.__file__).resolve()} (sha256[:12]={digest})")
    except Exception:
        pass

    audit_json_file(target, args.kind, full_dir)


if __name__ == "__main__":
    main()
