# scripts/rag/01_generate_embedding.py
"""
Tahap 1: ambil baris pipeline_stage='queued', generate embedding, simpan
sementara ke ai_ingest_queue.staged_embedding + staged_preview.
Kalau gagal, pipeline_stage tetap 'queued' tapi retry_count naik &
last_error diisi (biar tahap berikutnya tidak lanjut sebelum ini beres).
"""
from _shared import get_supabase, SOURCE_TABLE, BATCH_SIZE, MAX_RETRY, PREVIEW_LEN
from _shared import fetch_source_row, render_narrative, embed_text

sb = get_supabase()

if __name__ == "__main__":
    processed = 0
    while True:
        batch = (
            sb.table("ai_ingest_queue")
            .select("id, source_id")
            .eq("source_table", SOURCE_TABLE)
            .eq("pipeline_stage", "queued")
            .lt("retry_count", MAX_RETRY)
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
                text = render_narrative(source_row)
                vector = embed_text(text)

                sb.table("ai_ingest_queue").update({
                    "staged_embedding": vector,
                    "staged_preview": text[:PREVIEW_LEN],
                    "pipeline_stage": "embedded",
                    "updated_at": "now()",
                }).eq("id", qid).execute()
                processed += 1
            except Exception as e:
                sb.table("ai_ingest_queue").update({
                    "retry_count": sb.table("ai_ingest_queue").select("retry_count").eq("id", qid).execute().data[0]["retry_count"] + 1,
                    "last_error": str(e)[:500],
                    "failed_stage": "embedding",
                }).eq("id", qid).execute()
                print(f"  GAGAL {source_id}: {e}")

        print(f"Progress: {processed} chunk ter-embed...")

    print(f"\nSelesai tahap 1. Total ter-embed: {processed}")
    print("Cek sisa gagal: SELECT count(*) FROM ai_ingest_queue WHERE pipeline_stage='queued' AND retry_count>=3;")
