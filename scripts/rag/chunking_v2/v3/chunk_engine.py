#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
chunk_engine.py — Chunking v3 untuk pipeline RAG Paroki St. Klemens

Revisi v3: diperbaiki berdasarkan audit nyata terhadap 38 dokumen di
data/cleaned dan data/jesuit (lihat CHANGELOG di bawah). v2 hanya diuji
terhadap 1 dokumen (Tome of Leo) dan banyak pola meleset saat diuji ke
seluruh korpus.

CHANGELOG v2 -> v3 (semua berdasar bukti nyata dari audit):
  - NUMBERED_PARAGRAPH dulu salah menangkap "(1) Whether..." (sub-poin
    dalam kurung, mis. Super Boethium De Trinitate) sebagai paragraf
    bernomor resmi. Sekarang HANYA menangkap "N." atau "**N.**" di awal
    baris, bukan "(N)".
  - NUMBERED_PARAGRAPH juga salah match pada Homili Krisostomus (murni
    prosa panjang tanpa penomoran resmi, tapi ada angka+titik kebetulan
    di tengah teks). Sekarang mensyaratkan proporsi kenaikan berurutan
    LEBIH TINGGI dan jarak antar-match tidak boleh terlalu jauh (>6000
    karakter mengindikasikan match acak, bukan penomoran asli).
  - Ditambah varian BRACKET_PARAGRAPH: "[1]", "[2]" dst di awal baris
    (Autobiography of St Ignatius) — pola berbeda dari "1." biasa.
  - CANON dulu tidak menangkap format "**[Kan.  1  -  ]**" (bracket +
    bold + spasi ganda tidak konsisten, dipakai Kitab_Hukum_Kanonik.md).
    Regex diperbaiki untuk itu.
  - SCHOLASTIC_ARTICULUS dulu hanya menerima angka Romawi ("QUESTION
    IV"), padahal Summa_Theologica_*.md pakai angka Arab ("QUESTION 1").
    Sekarang menerima keduanya.
  - Ditambah pola BARU: CHAPTER_NUMBERED_PARAGRAPH — untuk dokumen yang
    punya DUA level sekaligus: heading bab ("## BAB SATU: ...") DAN
    paragraf bernomor resmi di dalamnya ("**5.**", "**6.**"). Ini pola
    Sacrosanctum Concilium dan kemungkinan besar Ecclesia de Eucharistia,
    Mulieris Dignitatem, Unitatis Redintegratio juga (perlu diverifikasi
    ulang di dry-run). SEBELUMNYA dokumen ini jatuh ke CHAPTER_HEADING
    biasa dan kehilangan presisi nomor paragraf.
  - CHAPTER_HEADING (simple chapter) ditambah kata kunci "HOMILY N"
    (Homili_St._Yohanes_Krisostomus pakai "## Homily 1 on Matthew", bukan
    "## Chapter 1"), dan title yang meluber ke baris kedua kini ikut
    tertangkap (De Civitate Dei: "## Chapter 1: Of the Adversaries...\n
    for Christ's Sake Spared...").
  - BIBLE_VERSE diperbaiki total: ALKITAB_Kitab_Suci_Katolik.md ternyata
    menaruh nama kitab dan "Bab N" di DUA BARIS TERPISAH tanpa heading
    markdown (bukan "## Kejadian Bab 1" dalam satu baris seperti asumsi
    v2), jadi regex lama tidak pernah cocok dan dokumen ini jatuh ke
    FALLBACK. Sekarang dideteksi dari pasangan baris "<Nama Kitab>" lalu
    "Bab N" berurutan.
  - detect_pattern() sekarang juga mengembalikan flag encoding_warning
    ketika teks mengandung tanda mojibake umum (Ã¢â‚¬ dsb, hasil UTF-8
    yang salah dibaca Latin-1) — ditemukan di De_Civitate_Dei.md. Ini
    HARUS diperbaiki di sumber sebelum ingest, bukan disamarkan di
    tahap chunking.

STRATEGI DETEKSI (dicoba berurutan dari paling spesifik; lihat
_PATTERN_DISPATCH di bagian bawah untuk urutan pasti):

  1. BIBLE_VERSE               -> "Kitab" + "Bab N" dua baris berurutan,
                                   lalu ayat bernomor "1 ...", "2 ..."
  2. CANON                     -> "Kan. N" / "**[Kan. N - ]**"
  3. SCHOLASTIC_ARTICULUS       -> Question/Quaestio + Article/Articulus
                                   (angka Arab ATAU Romawi)
  4. SCHOLASTIC_BOOK_CHAPTER    -> "BOOK N" + "CHAPTER M" dua level
  5. CHAPTER_NUMBERED_PARAGRAPH -> heading Bab/Chapter DAN paragraf
                                   bernomor resmi di dalamnya (2 level)
  6. NUMBERED_PARAGRAPH         -> paragraf bernomor resmi SAJA, tanpa
                                   heading bab di atasnya
  7. BRACKET_PARAGRAPH          -> "[1]", "[2]" dst di awal baris
  8. CHAPTER_HEADING            -> heading "## Chapter/Bab/Homily N"
                                   tanpa penomoran paragraf di dalamnya
  9. FALLBACK_PARAGRAPH         -> tidak ada pola apa pun terdeteksi

Setiap chunk berbentuk dataclass Chunk (lihat di bawah).

PENTING: modul ini SENGAJA tidak upload apa pun ke DB/R2. Dipakai lewat
dry_run.py untuk audit hasil sebelum diintegrasikan ke pipeline upload_*.py.
"""
import re
from dataclasses import dataclass
from typing import List, Optional

CHUNK_SIZE = 800
CHUNK_OVERLAP = 100
MIN_CHUNK_LEN = 50

# Ambang jarak maksimum (karakter) antar match penomoran berurutan yang
# masih dianggap "penomoran resmi asli". Kalau match berikutnya jauh lebih
# dari ini, kemungkinan besar itu angka kebetulan di tengah prosa (mis.
# referensi Alkitab inline "(1 Kor 13:4)"), bukan struktur dokumen.
MAX_GAP_FOR_NUMBERED = 6000


@dataclass
class Chunk:
    text: str
    context_prefix: str
    structural_ref: str
    pattern_used: str


# ---------------------------------------------------------------------------
# Deteksi mojibake (encoding rusak) — HANYA pelaporan, tidak memperbaiki.
# Perbaikan encoding harus dilakukan di sumber (re-export dari format asli
# dengan encoding benar), bukan ditambal di tahap chunking.
# ---------------------------------------------------------------------------
_MOJIBAKE_MARKERS = ('â€™', 'â€"', 'â€"', 'â€œ', 'â€\x9d', 'Ã¢', 'â€¦')


def has_encoding_issue(text: str) -> bool:
    return any(marker in text for marker in _MOJIBAKE_MARKERS)


# ---------------------------------------------------------------------------
# Util umum: batas kalimat & pemotongan teks panjang
# ---------------------------------------------------------------------------
_SENTENCE_BOUNDARY_RE = re.compile(r'[.!?]["\')\]]?\s+(?=[A-Z\u00c0-\u024f0-9"\u201c(])')


def _find_sentence_boundary(text: str, start: int, end: int) -> int:
    """Cari batas akhir kalimat TERAKHIR di dalam text[start:end], dengan
    syarat karakter setelah tanda baca adalah huruf kapital/kutip pembuka
    (menghindari salah berhenti di singkatan atau tengah frasa ALL-CAPS).
    Kembalikan -1 kalau tidak ada kandidat valid."""
    window = text[start:end]
    matches = list(_SENTENCE_BOUNDARY_RE.finditer(window))
    if not matches:
        return -1
    return start + matches[-1].end()


def _ref_with_suffix(ref: str, idx: int, total: int) -> str:
    """Tambahkan sub-index '.N' pada structural_ref HANYA jika unit ini
    terpecah jadi lebih dari satu chunk (total > 1). Supaya dua chunk
    berbeda tidak pernah punya structural_ref identik persis, sekaligus
    tidak mengganggu ref untuk paragraf yang tidak terpecah (mayoritas
    kasus tetap bersih tanpa suffix)."""
    return f"{ref}.{idx + 1}" if total > 1 else ref


def _split_long_text(text: str, hard_limit: int = CHUNK_SIZE) -> List[str]:
    """Potong teks panjang per-kalimat dengan overlap. Teks di atas
    hard_limit SELALU dipotong, supaya tidak ada chunk raksasa yang lolos."""
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


def _validate_numbering(matches: List[re.Match], nums: List[int]) -> bool:
    """Validasi bersama untuk semua varian 'paragraf bernomor': minimal 5
    match, mayoritas urut naik +1, DAN jarak antar-match tidak melompat
    terlalu jauh (indikasi match acak di tengah prosa panjang)."""
    if len(matches) < 5:
        return False
    increasing = sum(1 for a, b in zip(nums, nums[1:]) if b == a + 1)
    if increasing / max(1, len(nums) - 1) < 0.7:
        return False
    gaps = [m2.start() - m1.start() for m1, m2 in zip(matches, matches[1:])]
    huge_gaps = sum(1 for g in gaps if g > MAX_GAP_FOR_NUMBERED)
    if huge_gaps / max(1, len(gaps)) > 0.3:
        return False
    return True


# ---------------------------------------------------------------------------
# STRATEGI: Paragraf bernomor resmi — "1." atau "**1.**" di awal baris
# (Vatikan II, ensiklik). TIDAK menangkap "(1)" dalam kurung (itu biasanya
# sub-poin daftar dalam prosa, bukan struktur dokumen — lihat Super
# Boethium De Trinitate di CHANGELOG).
# ---------------------------------------------------------------------------
_NUMBERED_PARA_RE = re.compile(
    r'^\s*(?:\*\*)?(\d{1,4})\.(?:\*\*)?\s+(?=[A-Z\u00c0-\u024f"\u201c])',
    re.MULTILINE
)


def detect_numbered_paragraph(text: str) -> Optional[List[re.Match]]:
    matches = list(_NUMBERED_PARA_RE.finditer(text))
    if not matches:
        return None
    nums = [int(m.group(1)) for m in matches]
    return matches if _validate_numbering(matches, nums) else None


def chunk_numbered_paragraph(text: str, doc_title: str) -> List[Chunk]:
    matches = detect_numbered_paragraph(text)
    chunks = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        para_num = m.group(1)
        body = text[start:end].strip()
        body = _NUMBERED_PARA_RE.sub('', body, count=1).strip()
        pieces = _split_long_text(body)
        for pi, piece in enumerate(pieces):
            if len(piece) < MIN_CHUNK_LEN:
                continue
            chunks.append(Chunk(
                text=piece,
                context_prefix=f"{doc_title} — Paragraf {para_num}",
                structural_ref=_ref_with_suffix(f"{doc_title} §{para_num}", pi, len(pieces)),
                pattern_used="NUMBERED_PARAGRAPH",
            ))
    return chunks


# ---------------------------------------------------------------------------
# STRATEGI: Paragraf bernomor varian BRACKET — "[1]", "[2]" di awal baris
# (Autobiography of St Ignatius). Beda dari NUMBERED_PARAGRAPH biasa karena
# formatnya bracket, bukan titik.
# ---------------------------------------------------------------------------
_BRACKET_PARA_RE = re.compile(r'^\s*\[(\d{1,4})\]\s*', re.MULTILINE)


def detect_bracket_paragraph(text: str) -> Optional[List[re.Match]]:
    matches = list(_BRACKET_PARA_RE.finditer(text))
    if not matches:
        return None
    nums = [int(m.group(1)) for m in matches]
    return matches if _validate_numbering(matches, nums) else None


def chunk_bracket_paragraph(text: str, doc_title: str) -> List[Chunk]:
    matches = detect_bracket_paragraph(text)
    chunks = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        para_num = m.group(1)
        body = text[start:end].strip()
        body = _BRACKET_PARA_RE.sub('', body, count=1).strip()
        pieces = _split_long_text(body)
        for pi, piece in enumerate(pieces):
            if len(piece) < MIN_CHUNK_LEN:
                continue
            chunks.append(Chunk(
                text=piece,
                context_prefix=f"{doc_title} — Paragraf [{para_num}]",
                structural_ref=_ref_with_suffix(f"{doc_title} §{para_num}", pi, len(pieces)),
                pattern_used="BRACKET_PARAGRAPH",
            ))
    return chunks


# ---------------------------------------------------------------------------
# STRATEGI: Kanon Hukum Kanonik — "Kan. 123" / "**[Kan.  1  -  ]**"
# Format asli KHK: bracket + bold + jumlah spasi TIDAK konsisten di sekitar
# nomor dan tanda hubung. Regex dibuat toleran terhadap whitespace ganda.
# ---------------------------------------------------------------------------
_CANON_RE = re.compile(
    r'^\s*(?:\*\*)?\[?\s*(?:Kan(?:on)?|Can(?:on)?)\.?\s{1,3}(\d{1,4})\s{0,3}(?:-\s{0,3})?\]?(?:\*\*)?\s*',
    re.MULTILINE | re.IGNORECASE
)


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
        pieces = _split_long_text(body)
        for pi, piece in enumerate(pieces):
            if len(piece) < MIN_CHUNK_LEN:
                continue
            chunks.append(Chunk(
                text=piece,
                context_prefix=f"{doc_title} — Kanon {canon_num}",
                structural_ref=_ref_with_suffix(f"Kan. {canon_num}", pi, len(pieces)),
                pattern_used="CANON",
            ))
    return chunks


# ---------------------------------------------------------------------------
# STRATEGI: Ayat Alkitab.
# TEMUAN PENTING dari audit: ALKITAB_Kitab_Suci_Katolik.md TIDAK memakai
# heading markdown untuk nama kitab/bab. Formatnya dua baris polos
# berurutan:
#     Kejadian
#
#     Bab 1
#
#     1 Pada mulanya...
# Jadi deteksi harus mencari pasangan baris "<Nama Kitab>" diikuti (dengan
# baris kosong opsional di antaranya) baris "Bab N" — BUKAN heading '#'.
# ---------------------------------------------------------------------------
_BOOK_NAMES = (
    r'Kejadian|Keluaran|Imamat|Bilangan|Ulangan|Yosua|Hakim-Hakim|Rut|'
    r'(?:1|2)\s*Samuel|(?:1|2)\s*Raja-Raja|(?:1|2)\s*Tawarikh|Ezra|Nehemia|Tobit|Yudit|'
    r'Ester|(?:1|2)\s*Makabe|Ayub|Mazmur|Amsal|Pengkhotbah|Kidung\s*Agung|Kebijaksanaan|'
    r'Sirakh|Yesaya|Yeremia|Ratapan|Barukh|Yehezkiel|Daniel|Hosea|Yoel|Amos|Obaja|Yunus|'
    r'Mikha|Nahum|Habakuk|Zefanya|Hagai|Zakharia|Maleakhi|Matius|Markus|Lukas|Yohanes|'
    r'Kisah\s*Para\s*Rasul|Roma|(?:1|2)\s*Korintus|Galatia|Efesus|Filipi|Kolose|'
    r'(?:1|2)\s*Tesalonika|(?:1|2)\s*Timotius|Titus|Filemon|Ibrani|Yakobus|(?:1|2)\s*Petrus|'
    r'(?:1|2|3)\s*Yohanes|Yudas|Wahyu'
)
_BIBLE_BOOK_LINE_RE = re.compile(rf'^({_BOOK_NAMES})\s*$', re.MULTILINE)
_BIBLE_CHAPTER_LINE_RE = re.compile(r'^Bab\s+(\d{1,3})\s*$', re.MULTILINE)
_BIBLE_VERSE_RE = re.compile(r'^\s*(\d{1,3})\s+(?=[A-Z])', re.MULTILINE)


def detect_bible(text: str) -> bool:
    book_hits = len(_BIBLE_BOOK_LINE_RE.findall(text))
    chapter_hits = len(_BIBLE_CHAPTER_LINE_RE.findall(text))
    return book_hits >= 1 and chapter_hits >= 3


def chunk_bible(text: str, doc_title: str) -> List[Chunk]:
    """Chunk per Bab (nama kitab + nomor bab dari dua baris polos), lalu di
    dalamnya kelompokkan tiap ~6 ayat bernomor jadi satu chunk."""
    chapter_splits = re.split(r'(?=^Bab\s+\d{1,3}\s*$)', text, flags=re.MULTILINE)
    chunks = []
    current_book = doc_title
    for section in chapter_splits:
        if not section.strip():
            continue
        book_match = _BIBLE_BOOK_LINE_RE.search(section[:200])
        chap_match = _BIBLE_CHAPTER_LINE_RE.match(section.strip())
        chap_num = chap_match.group(1) if chap_match else None
        if book_match:
            current_book = book_match.group(1).strip()
        chapter_label = f"{current_book} Bab {chap_num}" if chap_num else current_book

        body_after_header = _BIBLE_CHAPTER_LINE_RE.sub('', section, count=1).strip()
        verses = list(_BIBLE_VERSE_RE.finditer(body_after_header))
        if len(verses) < 2:
            pieces = _split_long_text(body_after_header)
            for pi, piece in enumerate(pieces):
                if len(piece) >= MIN_CHUNK_LEN:
                    chunks.append(Chunk(
                        text=piece, context_prefix=f"{doc_title} — {chapter_label}",
                        structural_ref=_ref_with_suffix(chapter_label, pi, len(pieces)),
                        pattern_used="BIBLE_VERSE(no-verse-num)"))
            continue
        GROUP = 6
        for gi in range(0, len(verses), GROUP):
            group = verses[gi:gi + GROUP]
            start = group[0].start()
            end = verses[gi + GROUP].start() if gi + GROUP < len(verses) else len(body_after_header)
            body = body_after_header[start:end].strip()
            v_first, v_last = group[0].group(1), group[-1].group(1)
            vref = f"{chapter_label}:{v_first}-{v_last}" if v_first != v_last else f"{chapter_label}:{v_first}"
            if len(body) >= MIN_CHUNK_LEN:
                chunks.append(Chunk(
                    text=body, context_prefix=f"{doc_title} — {vref}",
                    structural_ref=vref, pattern_used="BIBLE_VERSE"))
    return chunks


# ---------------------------------------------------------------------------
# STRATEGI: Struktur skolastik — Pars/Quaestio/Articulus (Summa), atau
# "BOOK N" + "CHAPTER M" dua level (Adversus Haereses, De Civitate Dei,
# De Trinitate St. Agustinus, Summa Contra Gentiles).
# TEMUAN: Summa_Theologica_*.md pakai ANGKA ARAB ("QUESTION 1"), bukan cuma
# Romawi seperti asumsi v2 -- regex diperluas untuk terima keduanya.
# ---------------------------------------------------------------------------
_NUM_TOKEN = r'[IVXLCDM\d]+'
_ARTICULUS_RE = re.compile(
    rf'^#{{1,4}}\s*(?:ARTICLE|ARTICULUS)\s+{_NUM_TOKEN}', re.MULTILINE | re.IGNORECASE
)
_QUAESTIO_RE = re.compile(
    rf'^#{{1,4}}\s*(?:QUESTION|QUAESTIO)\s+{_NUM_TOKEN}', re.MULTILINE | re.IGNORECASE
)
_BOOK_CHAPTER_RE = re.compile(
    rf'^#{{1,4}}\s*(?:BOOK|BUKU)\s+{_NUM_TOKEN}', re.MULTILINE | re.IGNORECASE
)
_CHAPTER_ONLY_RE = re.compile(
    rf'^#{{1,4}}\s*(?:CHAPTER|CHAP\.?|BAB)\s+{_NUM_TOKEN}', re.MULTILINE | re.IGNORECASE
)


def detect_scholastic(text: str) -> str:
    """Return 'articulus', 'book_chapter', atau '' """
    if len(_ARTICULUS_RE.findall(text)) >= 3 or len(_QUAESTIO_RE.findall(text)) >= 2:
        return "articulus"
    if len(_BOOK_CHAPTER_RE.findall(text)) >= 1 and len(_CHAPTER_ONLY_RE.findall(text)) >= 3:
        return "book_chapter"
    return ""


def chunk_scholastic_articulus(text: str, doc_title: str) -> List[Chunk]:
    q_split_re = rf'(?=^#{{1,4}}\s*(?:QUESTION|QUAESTIO)\s+{_NUM_TOKEN})'
    q_splits = re.split(q_split_re, text, flags=re.MULTILINE | re.IGNORECASE)
    chunks = []
    current_q = ""
    for qsec in q_splits:
        if not qsec.strip():
            continue
        qm = re.match(rf'^#{{1,4}}\s*(?:QUESTION|QUAESTIO)\s+({_NUM_TOKEN})', qsec.strip(), re.IGNORECASE)
        if qm:
            current_q = qm.group(1)
        a_split_re = rf'(?=^#{{1,4}}\s*(?:ARTICLE|ARTICULUS)\s+{_NUM_TOKEN})'
        a_splits = re.split(a_split_re, qsec, flags=re.MULTILINE | re.IGNORECASE)
        for asec in a_splits:
            if not asec.strip():
                continue
            am = re.match(rf'^#{{1,4}}\s*(?:ARTICLE|ARTICULUS)\s+({_NUM_TOKEN})', asec.strip(), re.IGNORECASE)
            art_label = am.group(1) if am else None
            if current_q:
                ref = f"Q.{current_q}" + (f", Art.{art_label}" if art_label else "")
            else:
                ref = "Pendahuluan"
            asec_body = asec.strip()
            asec_body = re.sub(rf'^#{{1,4}}\s*(?:QUESTION|QUAESTIO)\s+{_NUM_TOKEN}.*$', '', asec_body, count=1, flags=re.MULTILINE | re.IGNORECASE).strip()
            asec_body = re.sub(rf'^#{{1,4}}\s*(?:ARTICLE|ARTICULUS)\s+{_NUM_TOKEN}.*$', '', asec_body, count=1, flags=re.MULTILINE | re.IGNORECASE).strip()
            pieces = _split_long_text(asec_body)
            for pi, piece in enumerate(pieces):
                if len(piece) >= MIN_CHUNK_LEN:
                    chunks.append(Chunk(
                        text=piece,
                        context_prefix=f"{doc_title} — {ref}",
                        structural_ref=_ref_with_suffix(f"{doc_title}, {ref}", pi, len(pieces)),
                        pattern_used="SCHOLASTIC_ARTICULUS",
                    ))
    return chunks


def chunk_scholastic_book_chapter(text: str, doc_title: str) -> List[Chunk]:
    b_split_re = rf'(?=^#{{1,4}}\s*(?:BOOK|BUKU)\s+{_NUM_TOKEN})'
    b_splits = re.split(b_split_re, text, flags=re.MULTILINE | re.IGNORECASE)
    chunks = []
    current_book = ""
    for bsec in b_splits:
        if not bsec.strip():
            continue
        bm = re.match(rf'^#{{1,4}}\s*(?:BOOK|BUKU)\s+({_NUM_TOKEN})', bsec.strip(), re.IGNORECASE)
        if bm:
            current_book = bm.group(1)
        c_split_re = rf'(?=^#{{1,4}}\s*(?:CHAPTER|CHAP\.?|BAB)\s+{_NUM_TOKEN})'
        c_splits = re.split(c_split_re, bsec, flags=re.MULTILINE | re.IGNORECASE)
        for csec in c_splits:
            if not csec.strip():
                continue
            cm = re.match(rf'^#{{1,4}}\s*(?:CHAPTER|CHAP\.?|BAB)\s+({_NUM_TOKEN})', csec.strip(), re.IGNORECASE)
            chap_label = cm.group(1) if cm else None
            ref = (f"Book {current_book}" if current_book else "") + (f", Chapter {chap_label}" if chap_label else "")
            ref = ref.strip(", ") or "Pendahuluan"
            csec_body = csec.strip()
            csec_body = re.sub(rf'^#{{1,4}}\s*(?:BOOK|BUKU)\s+{_NUM_TOKEN}.*$', '', csec_body, count=1, flags=re.MULTILINE | re.IGNORECASE).strip()
            csec_body = re.sub(rf'^#{{1,4}}\s*(?:CHAPTER|CHAP\.?|BAB)\s+{_NUM_TOKEN}.*$', '', csec_body, count=1, flags=re.MULTILINE | re.IGNORECASE).strip()
            pieces = _split_long_text(csec_body)
            for pi, piece in enumerate(pieces):
                if len(piece) >= MIN_CHUNK_LEN:
                    chunks.append(Chunk(
                        text=piece,
                        context_prefix=f"{doc_title} — {ref}",
                        structural_ref=_ref_with_suffix(f"{doc_title}, {ref}", pi, len(pieces)),
                        pattern_used="SCHOLASTIC_BOOK_CHAPTER",
                    ))
    return chunks


# ---------------------------------------------------------------------------
# STRATEGI BARU v3: dua level sekaligus — heading Bab/Chapter DAN paragraf
# bernomor resmi di dalamnya. Pola ini dipakai Sacrosanctum Concilium, dan
# kemungkinan besar Ecclesia de Eucharistia / Mulieris Dignitatem /
# Unitatis Redintegratio (PERLU DIVERIFIKASI ULANG lewat dry-run setelah
# perbaikan ini, karena v2 salah mengklasifikasikannya sebagai
# CHAPTER_HEADING biasa dan kehilangan nomor paragraf).
# ---------------------------------------------------------------------------
_SPELLED_NUM = (
    r'SATU|DUA|TIGA|EMPAT|LIMA|ENAM|TUJUH|DELAPAN|SEMBILAN|SEPULUH|'
    r'PERTAMA|KEDUA|KETIGA|KEEMPAT|KELIMA|KEENAM|KETUJUH|KEDELAPAN|KESEMBILAN|KESEPULUH|'
    r'ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN'
)
_CHAPTER_HEAD_RE = re.compile(
    rf'^#{{1,4}}\s*(?:CHAPTER|BAB|BUKU)\s*((?:{_SPELLED_NUM})|[IVXLCDM\d]*)\s*[:\.]?\s*(.*)$',
    re.MULTILINE | re.IGNORECASE
)


def detect_chapter_numbered_paragraph(text: str) -> bool:
    chapter_matches = list(_CHAPTER_HEAD_RE.finditer(text))
    if not chapter_matches:
        return False
    numbered = detect_numbered_paragraph(text)
    if numbered is None:
        return False
    first_chapter_pos = chapter_matches[0].start()
    after_count = sum(1 for m in numbered if m.start() >= first_chapter_pos)
    return after_count / len(numbered) >= 0.5


def chunk_chapter_numbered_paragraph(text: str, doc_title: str) -> List[Chunk]:
    """Split dulu per Bab (heading), lalu di dalam tiap Bab pecah per
    paragraf bernomor resmi -- referensi jadi 'Bab X §N', presisi dua
    level."""
    chap_splits = re.split(rf'(?=^#{{1,4}}\s*(?:CHAPTER|BAB|BUKU)\s*(?:[IVXLCDM\d]*|{_SPELLED_NUM}))', text, flags=re.MULTILINE | re.IGNORECASE)
    chunks = []
    current_chapter_label = "Pendahuluan"
    for csec in chap_splits:
        if not csec.strip():
            continue
        cm = _CHAPTER_HEAD_RE.match(csec.strip())
        if cm:
            num, title_part = cm.group(1), cm.group(2).strip()
            num = num.title() if num.isalpha() else num
            current_chapter_label = f"Bab {num}" + (f": {title_part}" if title_part else "")
            body = _CHAPTER_HEAD_RE.sub('', csec.strip(), count=1).strip()
        else:
            body = csec.strip()

        para_matches = detect_numbered_paragraph(body)
        if not para_matches:
            pieces = _split_long_text(body)
            for pi, piece in enumerate(pieces):
                if len(piece) >= MIN_CHUNK_LEN:
                    chunks.append(Chunk(
                        text=piece,
                        context_prefix=f"{doc_title} — {current_chapter_label}",
                        structural_ref=_ref_with_suffix(f"{doc_title}, {current_chapter_label}", pi, len(pieces)),
                        pattern_used="CHAPTER_NUMBERED_PARAGRAPH(no-para-num)",
                    ))
            continue

        for i, m in enumerate(para_matches):
            start = m.start()
            end = para_matches[i + 1].start() if i + 1 < len(para_matches) else len(body)
            para_num = m.group(1)
            para_body = body[start:end].strip()
            para_body = _NUMBERED_PARA_RE.sub('', para_body, count=1).strip()
            ref = f"{current_chapter_label} §{para_num}"
            pieces = _split_long_text(para_body)
            for pi, piece in enumerate(pieces):
                if len(piece) >= MIN_CHUNK_LEN:
                    chunks.append(Chunk(
                        text=piece,
                        context_prefix=f"{doc_title} — {ref}",
                        structural_ref=_ref_with_suffix(f"{doc_title}, {ref}", pi, len(pieces)),
                        pattern_used="CHAPTER_NUMBERED_PARAGRAPH",
                    ))
    return chunks


# ---------------------------------------------------------------------------
# STRATEGI: Heading bab satu-level — "## CHAPTER N", "## Homily N on ..."
# Ditambah dukungan untuk title yang meluber ke baris kedua (De Civitate Dei:
# "## Chapter 1: Of the Adversaries...\nfor Christ's Sake Spared...").
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
        pieces = _split_long_text(body)
        for pi, piece in enumerate(pieces):
            if len(piece) >= MIN_CHUNK_LEN:
                chunks.append(Chunk(
                    text=piece,
                    context_prefix=f"{doc_title} — {label}",
                    structural_ref=_ref_with_suffix(f"{doc_title}, {label}", pi, len(pieces)),
                    pattern_used="CHAPTER_HEADING",
                ))
    return chunks


# ---------------------------------------------------------------------------
# STRATEGI: Fallback — split per paragraf kosong ganda + potong per-karakter
# dengan overlap. Dipakai kalau tidak ada pola apa pun terdeteksi.
# ---------------------------------------------------------------------------
def chunk_fallback(text: str, doc_title: str) -> List[Chunk]:
    sections = re.split(r'\n(?=#{1,3} |\n)', text)
    chunks = []
    idx = 0
    for section in sections:
        if not section.strip():
            continue
        for piece in _split_long_text(section, hard_limit=CHUNK_SIZE):
            if len(piece) >= MIN_CHUNK_LEN:
                idx += 1
                chunks.append(Chunk(
                    text=piece,
                    context_prefix=f"{doc_title} — bagian {idx}",
                    structural_ref=f"{doc_title} #{idx}",
                    pattern_used="FALLBACK_PARAGRAPH",
                ))
    return chunks


# ---------------------------------------------------------------------------
# DISPATCHER
# ---------------------------------------------------------------------------
def _strip_frontmatter(text: str) -> str:
    """Buang YAML frontmatter (--- ... ---) di awal file kalau ada."""
    m = re.match(r'^---\s*\n.*?\n---\s*\n', text, re.DOTALL)
    return text[m.end():] if m else text


# Urutan deteksi: PALING SPESIFIK dulu. CHAPTER_NUMBERED_PARAGRAPH harus
# dicek SEBELUM NUMBERED_PARAGRAPH biasa dan SEBELUM CHAPTER_HEADING biasa,
# supaya dokumen dua-level tidak salah jatuh ke salah satu levelnya saja.
def detect_pattern(text: str) -> str:
    """Mengembalikan nama pola tanpa melakukan chunking — dipakai dry_run.py
    untuk laporan cepat sebelum commit ke strategi tertentu."""
    body = _strip_frontmatter(text)
    if detect_bible(body):
        return "BIBLE_VERSE"
    if detect_canon(body):
        return "CANON"
    scholastic = detect_scholastic(body)
    if scholastic == "articulus":
        return "SCHOLASTIC_ARTICULUS"
    if scholastic == "book_chapter":
        return "SCHOLASTIC_BOOK_CHAPTER"
    if detect_chapter_numbered_paragraph(body):
        return "CHAPTER_NUMBERED_PARAGRAPH"
    if detect_numbered_paragraph(body):
        return "NUMBERED_PARAGRAPH"
    if detect_bracket_paragraph(body):
        return "BRACKET_PARAGRAPH"
    if detect_simple_chapter(body):
        return "CHAPTER_HEADING"
    return "FALLBACK_PARAGRAPH"


_PATTERN_DISPATCH = {
    "BIBLE_VERSE": chunk_bible,
    "CANON": chunk_canon,
    "SCHOLASTIC_ARTICULUS": chunk_scholastic_articulus,
    "SCHOLASTIC_BOOK_CHAPTER": chunk_scholastic_book_chapter,
    "CHAPTER_NUMBERED_PARAGRAPH": chunk_chapter_numbered_paragraph,
    "NUMBERED_PARAGRAPH": chunk_numbered_paragraph,
    "BRACKET_PARAGRAPH": chunk_bracket_paragraph,
    "CHAPTER_HEADING": chunk_simple_chapter,
    "FALLBACK_PARAGRAPH": chunk_fallback,
}


def chunk_document(text: str, doc_title: str) -> List[Chunk]:
    body = _strip_frontmatter(text)
    pattern = detect_pattern(body)
    fn = _PATTERN_DISPATCH[pattern]
    chunks = fn(body, doc_title)
    if not chunks:
        # Strategi terdeteksi tapi gagal hasilkan chunk -> fallback aman
        chunks = chunk_fallback(body, doc_title)
    return chunks
