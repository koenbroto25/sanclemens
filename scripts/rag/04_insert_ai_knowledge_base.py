# scripts/rag/04_insert_ai_knowledge_base.py
"""
Tahap 4: ambil baris pipeline_stage='chunk_inserted', daftarkan ke
ai_knowledge_base dengan status='needs_review' (BELUM 'approved' --
approval final di Tahap 5, sesuai prinsip #4 governance master: setiap
baris yang bisa muncul di retrieval WAJIB lewat ai_knowledge_base dulu).
"""
from _shared import get_supabase, SOURCE_TABLE, TARGET_TABLE
from _shared import BATCH_SIZE, fetch_source_row, akb_metadata_for, chunk_id_for

sb = get_supabase()

if __name__ == "__main__":
    processed = 0
    while True:
        batch = (
            sb.table("ai_ingest_queue")
            .select("id, source_id")
            .eq("source_table", SOURCE_TABLE)
            .eq("pipeline_stage", "chunk_inserted")
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

                akb_row = akb_metadata_for(source_row, chunk_id)
                sb.table("ai_knowledge_base").insert(akb_row).execute()

                sb.table("ai_ingest_queue").update({
                    "pipeline_stage": "akb_registered",
                    "updated_at": "now()",
                }).eq("id", qid).execute()
                processed += 1
            except Exception as e:
                sb.table("ai_ingest_queue").update({
                    "last_error": str(e)[:500],
                    "failed_stage": "akb_insert",
                }).eq("id", qid).execute()
                print(f"  GAGAL {source_id}: {e}")

        print(f"Progress: {processed} baris ter-daftar ke ai_knowledge_base (needs_review)...")

    print(f"\nSelesai tahap 4. Total ter-daftar: {processed}")
    print("Lanjut: jalankan 05_verify_and_approve.py untuk review & approve batch.")
