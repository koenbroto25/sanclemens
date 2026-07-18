#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
chunk_engine.py — Chunking v2 untuk pipeline RAG Paroki St. Klemens

Tujuan: mengganti chunk_text() lama (split heading generik #{1,3} + potong
per-karakter) dengan pendekatan berlapis yang MEMPERTAHANKAN referensi
struktural asli dokumen (nomor paragraf resmi, kanon, artikel Summa, bab, dst)
sebagai metadata per chunk — bukan cuma posisi index mentah.

STRATEGI DETEKSI (dicoba berurutan, dokumen dipetakan ke pola PALING SPESIFIK
yang cocok):

  1. NUMBERED_PARAGRAPH   -> paragraf bernomor resmi ("1.", "124.", dst di awal
                             baris) — dipakai dokumen Vatikan II & ensiklik.
  2. CANON                -> "Kan. 123" / "Can. 123" — Kitab Hukum Kanonik.
  3. BIBLE_VERSE           -> "Kitab Bab:Ayat" (mis. "Yoh 3:16") — Alkitab.
  4. SCHOLASTIC            -> struktur Pars/Quaestio/Articulus (Summa) atau
                             "Book N, Chapter M" berlapis (Adversus Haereses,
                             De Civitate Dei, De Trinitate).
  5. CHAPTER_HEADING       -> heading markdown "## Chapter N" / "## Buku N" /
                             "## Homili N" (Tome of Leo, homili Krisostomus,
                             dokumen Yesuit).
  6. FALLBACK_PARAGRAPH    -> tidak ada penomoran/heading terdeteksi -> split
                             per paragraf kosong ganda + potong per-karakter
                             dengan overlap, SAMA seperti perilaku lama.

Setiap chunk yang dihasilkan berbentuk dict:
    {
        "text": str,              # isi chunk (TANPA context prefix)
        "context_prefix": str,    # "Judul Dokumen > Bab X > ..." — untuk
                                   # di-prepend ke teks sebelum embedding
        "structural_ref": str,    # referensi sitasi presisi, mis. "KGK §1324",
                                   # "Kan. 220", "Yoh 3:16", "STh I, Q.2, Art.3",
                                   # "Tome of Leo, Chapter III"
        "pattern_used": str,      # nama pola yang mendeteksi ini
    }

PENTING: modul ini SENGAJA tidak upload apa pun ke DB/R2. Dipakai lewat
dry_run.py untuk audit hasil sebelum diintegrasikan ke pipeline upload_*.py.
"""
import re
from dataclasses import dataclass, field
from typing import List, Optional

CHUNK_SIZE = 800
CHUNK_OVERLAP = 100
MIN_CHUNK_LEN = 50


@dataclass
class Chunk:
    text: str
    context_prefix: str
    structural_ref: str
    pattern_used: str


_SENTENCE_BOUNDARY_RE = re.compile(r'[.!?]["\')\]]?\s+(?=[A-Z\u00c0-\u024f0-9"\u201c(])')


def _find_sentence_boundary(text: str, start: int, end: int) -> int:
    """Cari batas akhir kalimat TERAKHIR di dalam text[start:end], dengan
    syarat karakter setelah tanda baca adalah huruf kapital/kutip pembuka
    (menghindari salah berhenti di singkatan seperti 'St.' atau di tengah
    frasa ALL-CAPS yang diakhiri titik tapi bukan akhir kalimat sungguhan).
    Kembalikan -1 kalau tidak ada kandidat valid."""
    window = text[start:end]
    matches = list(_SENTENCE_BOUNDARY_RE.finditer(window))
    if not matches:
        return -1
    return start + matches[-1].end()


def _split_long_text(text: str, hard_limit: int = CHUNK_SIZE) -> List[str]:
    """Potong teks panjang per-kalimat dengan overlap. hard_limit menentukan
    target ukuran chunk (bukan ambang 'apakah perlu dipotong' -- teks di atas
    hard_limit SELALU dipotong, supaya tidak ada chunk raksasa yang lolos)."""
    text = text.strip()
    if len(text) <= hard_limit:
        return [text] if text else []
    pieces = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + CHUNK_SIZE, n)
        if end < n:
            boundary = _find_sentence_boundary(text, start, end)
            if boundary > start:
                end = boundary
        piece = text[start:end].strip()
        if piece:
            pieces.append(piece)
        if end >= n:
            break
        next_start = end - CHUNK_OVERLAP
        start = next_start if next_start > start else end
    return pieces


# ---------------------------------------------------------------------------
# STRATEGI 1: Paragraf bernomor resmi (Vatikan II, ensiklik kepausan)
# Contoh baris: "24. Manusia..."  atau  "**124.** Dalam terang..."
# ---------------------------------------------------------------------------
_NUMBERED_PARA_RE = re.compile(
    r'^\s*(?:\*\*)?(\d{1,4})(?:\*\*)?\.\s+(?=[A-Z\u00c0-\u024fĀ-ž"\u201c])',
    re.MULTILINE
)


def detect_numbered_paragraph(text: str) -> Optional[List[re.Match]]:
    matches = list(_NUMBERED_PARA_RE.finditer(text))
    # Butuh minimal beberapa match berurutan naik untuk dianggap valid
    # (bukan sekadar angka kebetulan di awal baris)
    if len(matches) < 5:
        return None
    nums = [int(m.group(1)) for m in matches]
    increasing = sum(1 for a, b in zip(nums, nums[1:]) if b == a + 1)
    if increasing / max(1, len(nums) - 1) < 0.6:
        return None
    return matches


def chunk_numbered_paragraph(text: str, doc_title: str) -> List[Chunk]:
    matches = detect_numbered_paragraph(text)
    chunks = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        para_num = m.group(1)
        body = text[start:end].strip()
        # buang angka+titik di depan biar tidak dobel dengan structural_ref
        body = _NUMBERED_PARA_RE.sub('', body, count=1).strip()
        for piece in _split_long_text(body):
            if len(piece) < MIN_CHUNK_LEN:
                continue
            ref = f"{doc_title} §{para_num}"
            chunks.append(Chunk(
                text=piece,
                context_prefix=f"{doc_title} — Paragraf {para_num}",
                structural_ref=ref,
                pattern_used="NUMBERED_PARAGRAPH",
            ))
    return chunks


# ---------------------------------------------------------------------------
# STRATEGI 2: Kanon Hukum Kanonik — "Kan. 123" / "Can. 123"
# ---------------------------------------------------------------------------
_CANON_RE = re.compile(r'^\s*(?:\*\*)?(?:Kan(?:on)?|Can(?:on)?)\.?\s*(\d{1,4})(?:\*\*)?\s*[—\-–.]?\s*', re.MULTILINE)


def detect_canon(text: str) -> Optional[List[re.Match]]:
    matches = list(_CANON_RE.finditer(text))
    if len(matches) < 5:
        return None
    return matches


def chunk_canon(text: str, doc_title: str) -> List[Chunk]:
    matches = detect_canon(text)
    chunks = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        canon_num = m.group(1)
        body = text[start:end].strip()
        body = _CANON_RE.sub('', body, count=1).strip()
        for piece in _split_long_text(body):
            if len(piece) < MIN_CHUNK_LEN:
                continue
            ref = f"Kan. {canon_num}"
            chunks.append(Chunk(
                text=piece,
                context_prefix=f"{doc_title} — Kanon {canon_num}",
                structural_ref=ref,
                pattern_used="CANON",
            ))
    return chunks


# ---------------------------------------------------------------------------
# STRATEGI 3: Ayat Alkitab — "Kitab Bab:Ayat" mis. "Yoh 3:16", "1 Kor 13:4-7"
# Dipakai juga untuk mendeteksi apakah dokumen ini Alkitab secara keseluruhan.
# ---------------------------------------------------------------------------
_BOOK_ABBR = (
    r'(?:Kej|Kel|Im|Bil|Ul|Yos|Hak|Rut|1Sam|2Sam|1Raj|2Raj|1Taw|2Taw|Ezr|Neh|Tob|Ydt|'
    r'Est|1Mak|2Mak|Ayb|Mzm|Ams|Pkh|Kid|Keb|Sir|Yes|Yer|Rat|Bar|Yeh|Dan|Hos|Yl|Am|Ob|'
    r'Yun|Mi|Nah|Hab|Zef|Hag|Za|Mal|Mat|Mrk|Luk|Yoh|Kis|Rom|1Kor|2Kor|Gal|Ef|Flp|Kol|'
    r'1Tes|2Tes|1Tim|2Tim|Tit|Flm|Ibr|Yak|1Ptr|2Ptr|1Yoh|2Yoh|3Yoh|Yud|Why)'
)
_BIBLE_HEADING_RE = re.compile(
    r'^#{1,3}\s*(' + _BOOK_ABBR.replace('(?:', '(?:') + r'|Kejadian|Keluaran|Matius|Markus|Lukas|Yohanes|Kisah\s*Para\s*Rasul|Wahyu)'
    r'.*?(?:Bab|Pasal)?\s*(\d{1,3})',
    re.MULTILINE | re.IGNORECASE
)
_BIBLE_VERSE_RE = re.compile(r'^\s*(\d{1,3})[.\)]\s+', re.MULTILINE)


def detect_bible(text: str) -> bool:
    heading_hits = len(_BIBLE_HEADING_RE.findall(text[:5000]))
    return heading_hits >= 1 and bool(re.search(r'\bAyat\b|\bPasal\b|\bBab\b', text[:3000], re.IGNORECASE))


def chunk_bible(text: str, doc_title: str) -> List[Chunk]:
    """Chunk per Bab (heading), lalu di dalamnya kelompokkan tiap ~5-8 ayat
    bernomor jadi satu chunk (menjaga konteks naratif tanpa 1 ayat = 1 chunk
    yang sering kali terlalu kecil untuk berdiri sendiri)."""
    chapter_splits = re.split(r'(?=^#{1,3}\s*.*(?:Bab|Pasal)\s*\d)', text, flags=re.MULTILINE | re.IGNORECASE)
    chunks = []
    for section in chapter_splits:
        if not section.strip():
            continue
        head_match = re.match(r'^#{1,3}\s*(.+)$', section.strip(), re.MULTILINE)
        chapter_label = head_match.group(1).strip() if head_match else doc_title
        verses = list(_BIBLE_VERSE_RE.finditer(section))
        if len(verses) < 2:
            section_body = re.sub(r'^#{1,3}\s*.+$', '', section.strip(), count=1, flags=re.MULTILINE).strip()
            for piece in _split_long_text(section_body):
                if len(piece) >= MIN_CHUNK_LEN:
                    chunks.append(Chunk(
                        text=piece, context_prefix=f"{doc_title} — {chapter_label}",
                        structural_ref=chapter_label, pattern_used="BIBLE_VERSE(no-verse-num)"))
            continue
        GROUP = 6
        for gi in range(0, len(verses), GROUP):
            group = verses[gi:gi + GROUP]
            start = group[0].start()
            end = verses[gi + GROUP].start() if gi + GROUP < len(verses) else len(section)
            body = section[start:end].strip()
            v_first = group[0].group(1)
            v_last = group[-1].group(1)
            vref = f"{chapter_label}:{v_first}-{v_last}" if v_first != v_last else f"{chapter_label}:{v_first}"
            if len(body) >= MIN_CHUNK_LEN:
                chunks.append(Chunk(
                    text=body, context_prefix=f"{doc_title} — {vref}",
                    structural_ref=vref, pattern_used="BIBLE_VERSE"))
    return chunks


# ---------------------------------------------------------------------------
# STRATEGI 4: Struktur skolastik — Pars/Quaestio/Articulus (Summa), atau
# "BOOK N" + "CHAPTER M" dua level (Adversus Haereses, De Civitate Dei,
# De Trinitate St. Agustinus, Summa Contra Gentiles).
# ---------------------------------------------------------------------------
_ARTICULUS_RE = re.compile(
    r'^#{1,4}\s*(?:ARTICLE|ARTICULUS|Article)\s+([IVXLCDM\d]+)', re.MULTILINE | re.IGNORECASE
)
_QUAESTIO_RE = re.compile(
    r'^#{1,4}\s*(?:QUESTION|QUAESTIO|Question)\s+([IVXLCDM\d]+)', re.MULTILINE | re.IGNORECASE
)
_BOOK_CHAPTER_RE = re.compile(
    r'^#{1,4}\s*(?:BOOK|BUKU)\s+([IVXLCDM\d]+)', re.MULTILINE | re.IGNORECASE
)
_CHAPTER_ONLY_RE = re.compile(
    r'^#{1,4}\s*(?:CHAPTER|CHAP\.?|BAB)\s+([IVXLCDM\d]+)', re.MULTILINE | re.IGNORECASE
)


def detect_scholastic(text: str) -> str:
    """Return 'articulus', 'book_chapter', or '' """
    if len(_ARTICULUS_RE.findall(text)) >= 3 or len(_QUAESTIO_RE.findall(text)) >= 2:
        return "articulus"
    if len(_BOOK_CHAPTER_RE.findall(text)) >= 1 and len(_CHAPTER_ONLY_RE.findall(text)) >= 3:
        return "book_chapter"
    return ""


def chunk_scholastic_articulus(text: str, doc_title: str) -> List[Chunk]:
    """Pecah per Quaestio, lalu per Articulus di dalamnya. Satu Articulus
    (dengan Objectiones/Sed Contra/Respondeo) idealnya jadi 1 chunk kalau
    muat; kalau tidak, dipecah lagi dengan _split_long_text tapi tetap bawa
    label Q.x Art.y yang sama."""
    q_splits = re.split(r'(?=^#{1,4}\s*(?:QUESTION|QUAESTIO)\s+[IVXLCDM\d]+)', text, flags=re.MULTILINE | re.IGNORECASE)
    chunks = []
    current_q = ""
    for qsec in q_splits:
        if not qsec.strip():
            continue
        qm = re.match(r'^#{1,4}\s*(?:QUESTION|QUAESTIO)\s+([IVXLCDM\d]+)', qsec.strip(), re.IGNORECASE)
        if qm:
            current_q = qm.group(1)
        a_splits = re.split(r'(?=^#{1,4}\s*(?:ARTICLE|ARTICULUS)\s+[IVXLCDM\d]+)', qsec, flags=re.MULTILINE | re.IGNORECASE)
        for asec in a_splits:
            if not asec.strip():
                continue
            am = re.match(r'^#{1,4}\s*(?:ARTICLE|ARTICULUS)\s+([IVXLCDM\d]+)', asec.strip(), re.IGNORECASE)
            art_label = am.group(1) if am else None
            ref = f"Q.{current_q}" + (f", Art.{art_label}" if art_label else "")
            asec_body = asec.strip()
            asec_body = re.sub(r'^#{1,4}\s*(?:QUESTION|QUAESTIO)\s+[IVXLCDM\d]+.*$', '', asec_body, count=1, flags=re.MULTILINE | re.IGNORECASE).strip()
            asec_body = re.sub(r'^#{1,4}\s*(?:ARTICLE|ARTICULUS)\s+[IVXLCDM\d]+.*$', '', asec_body, count=1, flags=re.MULTILINE | re.IGNORECASE).strip()
            for piece in _split_long_text(asec_body):
                if len(piece) >= MIN_CHUNK_LEN:
                    chunks.append(Chunk(
                        text=piece,
                        context_prefix=f"{doc_title} — {ref}",
                        structural_ref=f"{doc_title}, {ref}",
                        pattern_used="SCHOLASTIC_ARTICULUS",
                    ))
    return chunks


def chunk_scholastic_book_chapter(text: str, doc_title: str) -> List[Chunk]:
    b_splits = re.split(r'(?=^#{1,4}\s*(?:BOOK|BUKU)\s+[IVXLCDM\d]+)', text, flags=re.MULTILINE | re.IGNORECASE)
    chunks = []
    current_book = ""
    for bsec in b_splits:
        if not bsec.strip():
            continue
        bm = re.match(r'^#{1,4}\s*(?:BOOK|BUKU)\s+([IVXLCDM\d]+)', bsec.strip(), re.IGNORECASE)
        if bm:
            current_book = bm.group(1)
        c_splits = re.split(r'(?=^#{1,4}\s*(?:CHAPTER|CHAP\.?|BAB)\s+[IVXLCDM\d]+)', bsec, flags=re.MULTILINE | re.IGNORECASE)
        for csec in c_splits:
            if not csec.strip():
                continue
            cm = re.match(r'^#{1,4}\s*(?:CHAPTER|CHAP\.?|BAB)\s+([IVXLCDM\d]+)', csec.strip(), re.IGNORECASE)
            chap_label = cm.group(1) if cm else None
            ref = (f"Book {current_book}" if current_book else "") + (f", Chapter {chap_label}" if chap_label else "")
            ref = ref.strip(", ") or doc_title
            csec_body = csec.strip()
            csec_body = re.sub(r'^#{1,4}\s*(?:BOOK|BUKU)\s+[IVXLCDM\d]+.*$', '', csec_body, count=1, flags=re.MULTILINE | re.IGNORECASE).strip()
            csec_body = re.sub(r'^#{1,4}\s*(?:CHAPTER|CHAP\.?|BAB)\s+[IVXLCDM\d]+.*$', '', csec_body, count=1, flags=re.MULTILINE | re.IGNORECASE).strip()
            for piece in _split_long_text(csec_body):
                if len(piece) >= MIN_CHUNK_LEN:
                    chunks.append(Chunk(
                        text=piece,
                        context_prefix=f"{doc_title} — {ref}",
                        structural_ref=f"{doc_title}, {ref}",
                        pattern_used="SCHOLASTIC_BOOK_CHAPTER",
                    ))
    return chunks


# ---------------------------------------------------------------------------
# STRATEGI 5: Heading bab sederhana satu-level — "## CHAPTER N", "## Homili N"
# (Tome of Leo, Homili Krisostomus, dokumen Yesuit)
# ---------------------------------------------------------------------------
_SIMPLE_CHAPTER_RE = re.compile(
    r'^#{1,4}\s*(CHAPTER|BAB|HOMILI|HOMILY|DECREE|DEKRET|LETTER|SURAT)\s*([IVXLCDM\d]*)',
    re.MULTILINE | re.IGNORECASE
)


def detect_simple_chapter(text: str) -> Optional[List[re.Match]]:
    matches = list(_SIMPLE_CHAPTER_RE.finditer(text))
    if len(matches) < 2:
        return None
    return matches


def chunk_simple_chapter(text: str, doc_title: str) -> List[Chunk]:
    matches = detect_simple_chapter(text)
    chunks = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        label = f"{m.group(1).title()} {m.group(2)}".strip()
        body = text[start:end].strip()
        body = _SIMPLE_CHAPTER_RE.sub('', body, count=1).strip()
        for piece in _split_long_text(body):
            if len(piece) >= MIN_CHUNK_LEN:
                chunks.append(Chunk(
                    text=piece,
                    context_prefix=f"{doc_title} — {label}",
                    structural_ref=f"{doc_title}, {label}",
                    pattern_used="CHAPTER_HEADING",
                ))
    return chunks


# ---------------------------------------------------------------------------
# STRATEGI 6: Fallback — sama seperti chunk_text() lama, tapi tetap
# menghasilkan context_prefix (judul dokumen saja) supaya konsisten.
# ---------------------------------------------------------------------------
def chunk_fallback(text: str, doc_title: str) -> List[Chunk]:
    sections = re.split(r'\n(?=#{1,3} |\n)', text)
    chunks = []
    for section in sections:
        if not section.strip():
            continue
        for piece in _split_long_text(section, hard_limit=CHUNK_SIZE):
            if len(piece) >= MIN_CHUNK_LEN:
                chunks.append(Chunk(
                    text=piece,
                    context_prefix=doc_title,
                    structural_ref=doc_title,
                    pattern_used="FALLBACK_PARAGRAPH",
                ))
    return chunks


# ---------------------------------------------------------------------------
# DISPATCHER
# ---------------------------------------------------------------------------
def _strip_frontmatter(text: str) -> str:
    """Buang YAML frontmatter (--- ... ---) di awal file kalau ada, supaya
    tidak ikut ke-parse sebagai bagian isi."""
    m = re.match(r'^---\s*\n.*?\n---\s*\n', text, re.DOTALL)
    return text[m.end():] if m else text


def detect_pattern(text: str) -> str:
    """Mengembalikan nama pola tanpa melakukan chunking — dipakai dry_run.py
    untuk laporan cepat sebelum commit ke strategi tertentu."""
    body = _strip_frontmatter(text)
    if detect_bible(body):
        return "BIBLE_VERSE"
    if detect_numbered_paragraph(body):
        return "NUMBERED_PARAGRAPH"
    if detect_canon(body):
        return "CANON"
    scholastic = detect_scholastic(body)
    if scholastic == "articulus":
        return "SCHOLASTIC_ARTICULUS"
    if scholastic == "book_chapter":
        return "SCHOLASTIC_BOOK_CHAPTER"
    if detect_simple_chapter(body):
        return "CHAPTER_HEADING"
    return "FALLBACK_PARAGRAPH"


def chunk_document(text: str, doc_title: str) -> List[Chunk]:
    body = _strip_frontmatter(text)
    pattern = detect_pattern(body)
    dispatch = {
        "BIBLE_VERSE": chunk_bible,
        "NUMBERED_PARAGRAPH": chunk_numbered_paragraph,
        "CANON": chunk_canon,
        "SCHOLASTIC_ARTICULUS": chunk_scholastic_articulus,
        "SCHOLASTIC_BOOK_CHAPTER": chunk_scholastic_book_chapter,
        "CHAPTER_HEADING": chunk_simple_chapter,
        "FALLBACK_PARAGRAPH": chunk_fallback,
    }
    fn = dispatch[pattern]
    chunks = fn(body, doc_title)
    if not chunks:
        # Strategi terdeteksi tapi gagal hasilkan chunk (mis. regex cocok
        # tapi struktur tidak konsisten) -> fallback aman
        chunks = chunk_fallback(body, doc_title)
    return chunks
