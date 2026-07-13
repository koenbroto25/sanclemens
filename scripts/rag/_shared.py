# scripts/rag/_shared.py
"""
Modul bersama seluruh tahap pipeline (00-05). Konfigurasi TABEL TARGET diatur
lewat environment variable supaya satu set script bisa dipakai ulang untuk
tabel manapun (theological_chunks, saints_chunks, dst) tanpa edit kode.

WAJIB di-set sebelum menjalankan tahap manapun (lihat README.md untuk 2 preset:
run teologi vs run saints):
  PIPELINE_SOURCE_TABLE   -> nilai kolom ai_ingest_queue.source_table yang diproses
  PIPELINE_TARGET_TABLE   -> tabel tujuan (theological_chunks / saints_chunks)
  PIPELINE_R2_FOLDER      -> folder R2 (theological / ...)
  PIPELINE_EMBEDDING_COL  -> nama kolom embedding di tabel tujuan
                             (content_embedding utk theological_chunks,
                              embedding utk saints_chunks -- BEDA nama, lihat
                              rag_data_governance_master.md §2.1)
"""
import json
import os
import time
from pathlib import Path

from dotenv import load_dotenv
import psycopg2 # Import for CockroachDB
from supabase import create_client
import boto3
from botocore.config import Config # Import for R2
from google import genai as google_genai
from google.genai import types as google_genai_types

load_dotenv("D:/paroki_digital_stclemens/.env.local")

# ---- Konfigurasi tabel target (via ENV, lihat docstring di atas) ----
SOURCE_TABLE = os.environ.get("PIPELINE_SOURCE_TABLE")
TARGET_TABLE = os.environ.get("PIPELINE_TARGET_TABLE")
R2_FOLDER = os.environ.get("PIPELINE_R2_FOLDER")
EMBEDDING_COLUMN = os.environ.get("PIPELINE_EMBEDDING_COL")

# Guard anti-bloat — field non-whitelist di baris tabel chunk tidak boleh lebih panjang ini
ALLOWED_LONG_FIELDS = {EMBEDDING_COLUMN}
MAX_METADATA_FIELD_LENGTH = 500

# Jadwal retry — SAMA untuk semua tahap, per §16.5 rag_ai_r2_final.md.
# Retry berlaku PER TAHAP (retry_count reset tiap kali pipeline_stage naik).
RETRY_SCHEDULE_MINUTES = {1: 1, 2: 5, 3: 30}
MAX_RETRY_BEFORE_PERMANENT_FAIL = 4

RAW_DATA_DIR = Path("D:/paroki_digital_stclemens/data")
CACHE_DIR = RAW_DATA_DIR / "rag_chunks_cache"
MANIFEST_PATH = RAW_DATA_DIR / "manifest_theological.jsonl"
SAINTS_JSON_PATH = RAW_DATA_DIR / "saints.json"

BATCH_SIZE = 50
MAX_RETRY = 3

import time as _time


def poll_until_done(fetch_batch_fn, idle_limit_seconds=300, poll_interval=10, label=""):
    """Generator: terus panggil fetch_batch_fn() sampai idle (tidak ada baris baru)
    selama idle_limit_seconds berturut-turut, baru berhenti. Dipakai supaya tahap
    01-04 bisa dijalankan BERSAMAAN di 4 terminal terpisah sebagai pipa mengalir --
    tahap 02/03/04 akan menunggu hasil tahap sebelumnya, bukan langsung keluar
    saat antrean masih kosong di awal."""
    idle_elapsed = 0
    while True:
        batch = fetch_batch_fn()
        if batch:
            idle_elapsed = 0
            yield batch
        else:
            if idle_elapsed >= idle_limit_seconds:
                print(f"[{label}] Tidak ada pekerjaan baru selama {idle_limit_seconds}s, dianggap selesai. Keluar.")
                return
            _time.sleep(poll_interval)
            idle_elapsed += poll_interval
            print(f"[{label}] menunggu tahap sebelumnya... ({idle_elapsed}s idle)")

# ---- Supabase ----
def get_supabase_client():
    return create_client(os.environ["NEXT_PUBLIC_SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

# ---- CockroachDB ----
def get_cockroach_db_connection():
    return psycopg2.connect(
        host=os.environ.get('COCKROACHDB_HOST'), port=26257,
        dbname=os.environ.get('COCKROACHDB_DBNAME', 'defaultdb'),
        user=os.environ.get('COCKROACHDB_USER'),
        password=os.environ.get('COCKROACHDB_PASSWORD', ''),
        sslmode='verify-full'
    )

# ---- Cloudflare R2 (boto3, S3-compatible) ----
def get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        config=Config(signature_version="s3v4")
    )


R2_BUCKET = os.environ.get("R2_BUCKET_NAME", "paroki-klemens-rag-content")
PREVIEW_LEN = int(os.environ.get("R2_CONTENT_PREVIEW_LENGTH", "150"))


# ---- Embedding (Gemini, konsisten dengan embedding_provider='Gemini' di data existing) ----
_GEMINI_KEYS = [v for k, v in os.environ.items() if k.startswith("GOOGLE_API_KEY_")]
_key_cursor = {"i": 0}


async def embed_text(text: str) -> list[float]:
    """Round-robin antar API key supaya tidak kena rate limit satu key saja."""
    last_err = None
    for attempt in range(len(_GEMINI_KEYS)):
        key = _GEMINI_KEYS[_key_cursor["i"] % len(_GEMINI_KEYS)]
        _key_cursor["i"] += 1
        try:
            client = google_genai.Client(api_key=key)
            result = client.models.embed_content(
                model="gemini-embedding-001",
                contents=text,
                config=google_genai_types.EmbedContentConfig(output_dimensionality=768),
            )
            return result.embeddings[0].values
        except Exception as e:
            last_err = e
            print(f"  [embed_text] key #{attempt} gagal: {e}, coba key berikutnya...")
            time.sleep(1)
    raise RuntimeError(f"Semua API key embedding gagal. Error terakhir: {last_err}")


# ---- Sumber data mentah per SOURCE_TABLE ----
def fetch_source_row(source_id: str) -> dict:
    """Ambil teks + metadata mentah untuk satu source_id, tergantung SOURCE_TABLE."""
    if SOURCE_TABLE == "theological_raw_chunk":
        cache_path = CACHE_DIR / f"{source_id}.txt"
        text = cache_path.read_text(encoding="utf-8")
        manifest_row = _load_manifest_row(source_id)
        return {"text": text, **manifest_row}

    if SOURCE_TABLE == "saints_manual_import":
        saints = json.loads(SAINTS_JSON_PATH.read_text(encoding="utf-8"))
        row = next(s for s in saints if s["id"] == source_id)
        return {
            "text": row["biography"],
            "saint_name": row["saint_name"],
            "feast_day": row.get("feast_day"),
            "type": row.get("type"),
            "patronage": row.get("patronage", []),
            "visual_attributes": row.get("visual_attributes", []),
        }

    raise ValueError(f"SOURCE_TABLE '{SOURCE_TABLE}' tidak dikenal di fetch_source_row()")


_manifest_cache = None


def _load_manifest_row(source_id: str) -> dict:
    global _manifest_cache
    if _manifest_cache is None:
        _manifest_cache = {}
        with open(MANIFEST_PATH, encoding="utf-8") as f:
            for line in f:
                row = json.loads(line)
                _manifest_cache[row["source_id"]] = row
    return _manifest_cache[source_id]


def render_narrative(source_row: dict) -> str:
    """Teks final yang di-embed & disimpan ke R2. Untuk kasus kita, teks mentah
    sudah cukup bersih (hasil cleaning sebelumnya), jadi tinggal dikembalikan."""
    return source_row["text"].strip()


def metadata_for(source_row: dict) -> dict:
    """Kolom-kolom yang diinsert ke TARGET_TABLE (di luar id/embedding/r2_key/preview)."""
    if TARGET_TABLE == "theological_chunks":
        return {
            "chunk_source_domain": "theological",
            "source_document": source_row["source_document"],
            "source_reference": source_row["source_document"],
            "chapter_context": source_row.get("chapter_context"),
            "category_code": source_row["category_code"],
            "authority_level": source_row["authority_level"],
        }
    if TARGET_TABLE == "saints_chunks":
        return {
            "saint_name": source_row["saint_name"],
            "category_code": "7a",
            "source_types": ["hagiografi"],
            "authority_level": "reference",
            "domain": "catechism_module",
            "access_level_min": 0,
        }
    raise ValueError(f"TARGET_TABLE '{TARGET_TABLE}' tidak dikenal di metadata_for()")


import uuid as _uuid

_CHUNK_ID_NAMESPACE = _uuid.UUID("2f9c1a34-6b8e-4b1a-9c3d-8e7f6a5b4c3d")


def chunk_id_for(source_id: str) -> str:
    """id final di TARGET_TABLE, deterministik dari source_id -- supaya tahap 3
    (insert) dan tahap 4 (insert ai_knowledge_base) selalu sepakat tanpa perlu
    kolom staging tambahan, dan idempotent kalau tahap diulang."""
    return str(_uuid.uuid5(_CHUNK_ID_NAMESPACE, f"{TARGET_TABLE}::{source_id}"))


def akb_metadata_for(source_row: dict, chunk_id: str) -> dict:
    """Kolom-kolom untuk baris ai_knowledge_base terkait chunk ini."""
    from category_mapping import DOMAIN_BY_CATEGORY, BOT_ACCESS_BY_DOMAIN

    if TARGET_TABLE == "theological_chunks":
        domain = source_row["domain"]  # sudah dihitung di manifest
    elif TARGET_TABLE == "saints_chunks":
        domain = "catechism_module"
    else:
        raise ValueError(f"TARGET_TABLE '{TARGET_TABLE}' tidak dikenal di akb_metadata_for()")

    return {
        "domain": domain,
        "bot_access": BOT_ACCESS_BY_DOMAIN.get(domain, ["bot_3", "bot_8", "bot_pastor"]),
        "access_level_min": 0,
        "chunk_table_ref": TARGET_TABLE,
        "chunk_id": chunk_id,
        "content_type": "rag_chunk",
        "status": "needs_review",
    }
