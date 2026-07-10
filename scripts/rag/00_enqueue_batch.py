# scripts/rag/00_enqueue_batch.py
"""
Tahap 0: daftarkan semua source_id (dari manifest_theological.jsonl ATAU
saints.json, tergantung PIPELINE_SOURCE_TABLE) ke ai_ingest_queue dengan
pipeline_stage='queued'. Idempotent -- aman dijalankan ulang, baris yang
sudah ada di-skip (on_conflict source_table+source_id).
"""
import json

from _shared import get_supabase, SOURCE_TABLE, MANIFEST_PATH, SAINTS_JSON_PATH

sb = get_supabase()


def source_ids_theological():
    with open(MANIFEST_PATH, encoding="utf-8") as f:
        for line in f:
            yield json.loads(line)["source_id"]


def source_ids_saints():
    saints = json.loads(SAINTS_JSON_PATH.read_text(encoding="utf-8"))
    for s in saints:
        yield s["id"]


if __name__ == "__main__":
    ids = list(source_ids_theological() if SOURCE_TABLE == "theological_raw_chunk" else source_ids_saints())
    print(f"Total source_id ditemukan: {len(ids)} untuk SOURCE_TABLE='{SOURCE_TABLE}'")

    inserted, skipped = 0, 0
    for i in range(0, len(ids), 500):
        batch = ids[i:i + 500]
        rows = [{
            "source_table": SOURCE_TABLE,
            "source_id": sid,
            "operation": "insert",
            "status": "pending",
            "pipeline_stage": "queued",
            "retry_count": 0,
        } for sid in batch]

        result = sb.table("ai_ingest_queue").upsert(
            rows, on_conflict="source_table,source_id", ignore_duplicates=True
        ).execute()
        inserted += len(result.data) if result.data else 0
        print(f"  Batch {i}-{i+len(batch)}: diproses")

    print(f"\nSelesai. Cek status: SELECT pipeline_stage, status, count(*) FROM ai_ingest_queue GROUP BY 1,2;")
