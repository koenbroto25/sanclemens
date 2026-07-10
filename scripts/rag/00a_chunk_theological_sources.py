# scripts/rag/00a_chunk_theological_sources.py
"""
Chunker RAW SOURCE -> manifest + cache lokal. Ini BARU, menggantikan proses
lama yang menghasilkan 48.315 chunk terlalu kecil (rata-rata ~900 byte/chunk,
banyak yang cuma 1 kalimat/footnote seperti "Luke xiv. 14.").

Target baru: ~2200-3000 karakter per chunk (gabung beberapa paragraf,
pecah di batas paragraf, bukan di tengah kalimat), supaya jumlah baris turun
drastis (~48k -> perkiraan ~15-18k) sekaligus retrieval lebih bermakna
per chunk (satu chunk sekarang berisi 1 unit gagasan penuh, bukan potongan).

TIDAK menyentuh Supabase/R2 sama sekali. Output:
  data/rag_chunks_cache/{source_id}.txt   <- teks penuh per chunk
  data/manifest_theological.jsonl          <- metadata per chunk (1 baris = 1 chunk)

Setelah script ini selesai, jalankan 00_enqueue_batch.py untuk mendaftarkan
manifest ke ai_ingest_queue.
"""
import json
import re
import uuid
from pathlib import Path

from category_mapping import category_for_file, DOMAIN_BY_CATEGORY

RAW_DATA_DIR = Path("D:/paroki_digital_stclemens/data")
FOLDERS = ["cleaned", "jesuit", "modul katolisitas"]
CACHE_DIR = RAW_DATA_DIR / "rag_chunks_cache"
MANIFEST_PATH = RAW_DATA_DIR / "manifest_theological.jsonl"

TARGET_CHARS = 2800  # dinaikkan dari 2200 -> kompensasi karena HNSW dipertahankan (bukan IVFFlat)
MAX_CHARS = 3800
MIN_CHARS = 400  # paragraf sisa di bawah ini digabung ke chunk sebelumnya, bukan jadi chunk sendiri

# Namespace UUID tetap -> supaya source_id deterministik & idempotent lintas-run
NAMESPACE = uuid.UUID("7c9e6679-7425-40de-944b-e07fc1f90ae7")


def split_into_paragraphs(text: str) -> list[str]:
    # Pecah di baris kosong ganda (batas paragraf wajar di file .md/.txt hasil cleaning)
    parts = re.split(r"\n\s*\n", text)
    return [p.strip() for p in parts if p.strip()]


def extract_nearest_header(paragraph: str, last_header: str) -> str:
    """Kalau paragraf ini sendiri adalah header markdown, jadikan chapter_context baru."""
    first_line = paragraph.strip().split("\n")[0]
    if first_line.startswith("#"):
        return first_line.lstrip("#").strip()
    return last_header


def chunk_document(text: str) -> list[dict]:
    """Gabungkan paragraf berurutan sampai mendekati TARGET_CHARS, tanpa memotong
    di tengah paragraf. chapter_context = header markdown terakhir yang dilewati."""
    paragraphs = split_into_paragraphs(text)
    chunks = []
    buffer = []
    buffer_len = 0
    last_header = ""

    for para in paragraphs:
        last_header = extract_nearest_header(para, last_header)
        buffer.append(para)
        buffer_len += len(para) + 2

        if buffer_len >= TARGET_CHARS:
            chunks.append({"text": "\n\n".join(buffer), "chapter_context": last_header})
            buffer, buffer_len = [], 0

    if buffer:
        joined = "\n\n".join(buffer)
        # Paragraf sisa terlalu kecil -> gabung ke chunk sebelumnya daripada jadi chunk kerdil sendiri
        if chunks and len(joined) < MIN_CHARS:
            chunks[-1]["text"] += "\n\n" + joined
        else:
            chunks.append({"text": joined, "chapter_context": last_header})

    # Jaga-jaga: kalau ada chunk yang tetap kelewat besar (paragraf tunggal raksasa), biarkan apa adanya
    # -- lebih baik 1 chunk besar daripada memotong di tengah kalimat yang merusak makna.
    return chunks


def process_file(folder: str, filename: str) -> int:
    path = RAW_DATA_DIR / folder / filename
    text = path.read_text(encoding="utf-8", errors="ignore")
    relative_path = f"{folder}/{filename}"
    category_code, authority_level = category_for_file(relative_path)
    domain = DOMAIN_BY_CATEGORY[category_code]

    doc_chunks = chunk_document(text)
    count = 0
    with open(MANIFEST_PATH, "a", encoding="utf-8") as manifest_f:
        for idx, ch in enumerate(doc_chunks):
            source_id = str(uuid.uuid5(NAMESPACE, f"{relative_path}::{idx}"))
            cache_path = CACHE_DIR / f"{source_id}.txt"
            cache_path.write_text(ch["text"], encoding="utf-8")

            manifest_f.write(json.dumps({
                "source_id": source_id,
                "source_document": Path(filename).stem,
                "chapter_context": ch["chapter_context"][:500] if ch["chapter_context"] else None,
                "category_code": category_code,
                "authority_level": authority_level,
                "domain": domain,
                "char_len": len(ch["text"]),
            }, ensure_ascii=False) + "\n")
            count += 1
    return count


if __name__ == "__main__":
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if MANIFEST_PATH.exists():
        backup = MANIFEST_PATH.with_suffix(".jsonl.bak")
        MANIFEST_PATH.rename(backup)
        print(f"Manifest lama dicadangkan ke {backup}")

    total = 0
    for folder in FOLDERS:
        folder_path = RAW_DATA_DIR / folder
        if not folder_path.exists():
            print(f"Lewati (tidak ada): {folder_path}")
            continue
        for path in sorted(folder_path.iterdir()):
            if path.suffix.lower() not in (".md", ".txt"):
                continue
            n = process_file(folder, path.name)
            print(f"{folder}/{path.name}: {n} chunk")
            total += n

    print(f"\nTOTAL chunk baru: {total} (dibanding 48.315 chunk lama)")
    print(f"Manifest: {MANIFEST_PATH}")
    print(f"Cache teks: {CACHE_DIR}")
    print("Lanjut: jalankan 00_enqueue_batch.py dengan SOURCE_TABLE='theological_raw_chunk'")
