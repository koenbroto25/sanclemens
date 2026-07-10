# scripts/rag/03_insert_chunk.py
"""
Tahap 3: ambil baris pipeline_stage='r2_uploaded', insert ke TARGET_TABLE
(theological_chunks / saints_chunks) dengan id BARU (uuid, bukan source_id --
supaya konsisten dengan skema existing yang pakai uuid random utk PK, hindari
masalah id-tidak-sinkron seperti kasus saints_collection sebelumnya).
pipeline_stage jadi 'chunk_inserted'.
"""
from _shared import get_supabase, SOURCE_TABLE, TARGET_TABLE, EMBEDDING_COLUMN
from _shared import BATCH_SIZE, PREVIEW_LEN, fetch_source_row, render_narrative, metadata_for, chunk_id_for

sb = get_supabase()

if __name__ == "__main__":
    processed = 0
    while True:
        batch = (
            sb.table("ai_ingest_queue")
            .select("id, source_id, staged_embedding, staged_r2_key, staged_preview")
            .eq("source_table", SOURCE_TABLE)
            .eq("pipeline_stage", "r2_uploaded")
            .limit(BATCH_SIZE)
            .execute()
            .data
        )
        if not batch:
            break

        for row in batch:
            qid, source_id = row["id"], row["source_id"]
            try:
                source_row = fetch_source_row(source_id)
                chunk_id = chunk_id_for(source_id)

                insert_row = {
                    "id": chunk_id,
                    EMBEDDING_COLUMN: row["staged_embedding"],
                    "content_r2_key": row["staged_r2_key"],
                    "content_preview": row["staged_preview"] or render_narrative(source_row)[:PREVIEW_LEN],
                    **metadata_for(source_row),
                }
                sb.table(TARGET_TABLE).insert(insert_row).execute()

                sb.table("ai_ingest_queue").update({
                    "pipeline_stage": "chunk_inserted",
                    "updated_at": "now()",
                }).eq("id", qid).execute()
                processed += 1
            except Exception as e:
                sb.table("ai_ingest_queue").update({
                    "last_error": str(e)[:500],
                    "failed_stage": "chunk_insert",
                }).eq("id", qid).execute()
                print(f"  GAGAL {source_id}: {e}")

        print(f"Progress: {processed} chunk ter-insert ke {TARGET_TABLE}...")

    print(f"\nSelesai tahap 3. Total ter-insert: {processed}")
