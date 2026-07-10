# scripts/rag/02_upload_r2.py
"""
Tahap 2: ambil baris pipeline_stage='embedded', upload teks penuh ke R2
(path FLAT per tabel sesuai rag_data_governance_master.md §1 prinsip #1:
chunks/{folder}/{id}.txt -- BUKAN per kategori), simpan content_r2_key
ke staged_r2_key, pipeline_stage jadi 'r2_uploaded'.
"""
from _shared import get_supabase, get_r2_client, R2_BUCKET, R2_FOLDER
from _shared import SOURCE_TABLE, BATCH_SIZE, fetch_source_row, render_narrative

sb = get_supabase()
r2 = get_r2_client()

if __name__ == "__main__":
    processed = 0
    while True:
        batch = (
            sb.table("ai_ingest_queue")
            .select("id, source_id")
            .eq("source_table", SOURCE_TABLE)
            .eq("pipeline_stage", "embedded")
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
                r2_key = f"chunks/{R2_FOLDER}/{source_id}.txt"

                r2.put_object(Bucket=R2_BUCKET, Key=r2_key, Body=text.encode("utf-8"))

                sb.table("ai_ingest_queue").update({
                    "staged_r2_key": r2_key,
                    "pipeline_stage": "r2_uploaded",
                    "updated_at": "now()",
                }).eq("id", qid).execute()
                processed += 1
            except Exception as e:
                sb.table("ai_ingest_queue").update({
                    "last_error": str(e)[:500],
                    "failed_stage": "r2_upload",
                }).eq("id", qid).execute()
                print(f"  GAGAL {source_id}: {e}")

        print(f"Progress: {processed} chunk ter-upload ke R2...")

    print(f"\nSelesai tahap 2. Total ter-upload: {processed}")
