"""
migrate_content_to_r2.py — Backfill data existing dari Postgres ke Cloudflare R2.
Baca semua baris dengan r2_key masih NULL, upload teks penuhnya ke R2,
lalu update baris dengan r2_key + preview. Berjalan per-batch.
Reference: rag_ai_r2_72.md §11.2
"""
import os
import sys
import time
from typing import Any

# Tambahkan parent directory ke path untuk import _shared
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'rag'))
from _shared import supabase, r2, BUCKET, PREVIEW_LENGTH

# Konfigurasi tabel yang akan dimigrasi
# (table_name, text_column, key_column, preview_column, r2_prefix)
TABLES = [
    ("qa_pairs", "answer_text", "answer_r2_key", "answer_preview", "qa"),
    ("theological_chunks", "content_for_rag", "content_r2_key", "content_preview", "chunks/theological"),
    ("operational_chunks", "content_for_rag", "content_r2_key", "content_preview", "chunks/operational"),
    ("structured_entity_chunks", "content_for_rag", "content_r2_key", "content_preview", "chunks/structured_entity"),
    ("internal_admin_chunks", "content_for_rag", "content_r2_key", "content_preview", "chunks/internal_admin"),
]

BATCH_SIZE = 100
SLEEP_BETWEEN_BATCHES = 1  # detik, untuk hindari rate limit


def migrate_table(
    table_name: str,
    text_col: str,
    key_col: str,
    preview_col: str,
    r2_prefix: str
) -> tuple[int, int]:
    """Migrate satu tabel. Return (total, errors)."""
    total = 0
    errors = 0
    offset = 0

    while True:
        # Ambil baris yang belum punya r2_key
        rows = supabase.table(table_name) \
            .select("id", text_col) \
            .is_(key_col, "null") \
            .order("created_at") \
            .limit(BATCH_SIZE) \
            .offset(offset) \
            .execute()

        if not rows.data:
            break

        batch_data = rows.data
        offset += len(batch_data)

        for row in batch_data:
            try:
                row_id = row["id"]
                full_text = row[text_col]

                if not full_text or not full_text.strip():
                    # Skip baris dengan teks kosong — set key jadi placeholder
                    supabase.table(table_name).update({
                        key_col: f"{r2_prefix}/{row_id}.txt",
                        preview_col: "",
                    }).eq("id", row_id).execute()
                    total += 1
                    continue

                r2_key = f"{r2_prefix}/{row_id}.txt"
                preview = full_text[:PREVIEW_LENGTH].strip()

                # Upload ke R2
                r2.put_object(
                    Bucket=BUCKET,
                    Key=r2_key,
                    Body=full_text.encode("utf-8"),
                    ContentType="text/plain; charset=utf-8",
                )

                # Update baris di Postgres
                supabase.table(table_name).update({
                    key_col: r2_key,
                    preview_col: preview,
                }).eq("id", row_id).execute()

                total += 1
                if total % 50 == 0:
                    print(f"  [{table_name}] {total} rows migrated...")

            except Exception as e:
                errors += 1
                print(f"  ERROR [{table_name}] row {row.get('id', '?')}: {e}")

        # Brief pause antar batch
        time.sleep(SLEEP_BETWEEN_BATCHES)

    return total, errors


def verify_migration(table_name: str, key_col: str) -> tuple[int, int]:
    """Verifikasi: hitung baris yang masih NULL vs total."""
    total = supabase.table(table_name).select("id", count="exact").execute()
    null_count = supabase.table(table_name) \
        .select("id", count="exact") \
        .is_(key_col, "null") \
        .execute()

    return total.count if hasattr(total, 'count') else 0, \
           null_count.count if hasattr(null_count, 'count') else 0


if __name__ == "__main__":
    print("=" * 60)
    print("RAG Content Migration — Postgres to R2")
    print("=" * 60)
    print()

    overall_total = 0
    overall_errors = 0

    for table_name, text_col, key_col, preview_col, r2_prefix in TABLES:
        print(f"\n{'─' * 40}")
        print(f"Migrating table: {table_name}")
        print(f"  Text column: {text_col}")
        print(f"  R2 prefix: {r2_prefix}")
        print(f"{'─' * 40}")

        # Cek dulu berapa baris yang perlu dimigrasi
        null_rows = supabase.table(table_name) \
            .select("id", count="exact") \
            .is_(key_col, "null") \
            .execute()
        pending = null_rows.count if hasattr(null_rows, 'count') else 0
        print(f"  Rows to migrate: {pending}")

        if pending == 0:
            print(f"  ✓ No rows to migrate for {table_name}")
            continue

        # Jalankan migrasi
        migrated, errors = migrate_table(
            table_name, text_col, key_col, preview_col, r2_prefix
        )
        overall_total += migrated
        overall_errors += errors
        print(f"  Done: {migrated} migrated, {errors} errors")

    # Verifikasi akhir
    print(f"\n{'=' * 60}")
    print("Verification:")
    print(f"{'=' * 60}")
    all_clear = True
    for table_name, _, key_col, _, _ in TABLES:
        total, null_count = verify_migration(table_name, key_col)
        status = "✓" if null_count == 0 else "✗"
        if null_count > 0:
            all_clear = False
        print(f"  [{status}] {table_name}: {null_count}/{total} rows still NULL")

    print(f"\n{'=' * 60}")
    print(f"Total migrated: {overall_total}")
    print(f"Total errors: {overall_errors}")
    if all_clear:
        print("✓ ALL TABLES VERIFIED — 0 rows with NULL r2_key")
        print("\nNext step: Run VALIDATE CONSTRAINT:")
        print("  ALTER TABLE public.qa_pairs VALIDATE CONSTRAINT chk_answer_r2_key_present;")
        print("\nThen after backup: DROP COLUMN + VACUUM FULL (see §11.4)")
    else:
        print(f"⚠ {overall_errors} errors — check logs above")
    print(f"{'=' * 60}")