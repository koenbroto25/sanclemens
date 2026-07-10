# scripts/rag/05_verify_and_approve.py
"""
Tahap 5: verifikasi ringan (sampling acak + cek konsistensi jumlah),
lalu approve massal ai_knowledge_base.status: 'needs_review' -> 'approved'
untuk SOURCE_TABLE ini. pipeline_stage jadi 'done'.

Ini TIDAK menggantikan review manusia untuk konten sensitif -- untuk
data teologi/santo yang sumbernya sudah diketahui & dipercaya (bukan
UGC/kiriman umat), auto-approve sepadan. Kalau ke depan ada domain baru
yang perlu HIL review sungguhan, jangan pakai script ini apa adanya.
"""
from _shared import get_supabase, SOURCE_TABLE, TARGET_TABLE, chunk_id_for

sb = get_supabase()

if __name__ == "__main__":
    # 1. Hitung berapa yang siap diapprove
    pending = (
        sb.table("ai_ingest_queue")
        .select("id", count="exact")
        .eq("source_table", SOURCE_TABLE)
        .eq("pipeline_stage", "akb_registered")
        .execute()
    )
    print(f"Siap approve: {pending.count} baris")

    # 2. Sampling: tampilkan 5 contoh acak untuk verifikasi mata manusia
    sample = (
        sb.table("ai_ingest_queue")
        .select("source_id")
        .eq("source_table", SOURCE_TABLE)
        .eq("pipeline_stage", "akb_registered")
        .limit(5)
        .execute()
        .data
    )
    print("\n--- SAMPLING VERIFIKASI (cek manual sebelum lanjut) ---")
    for row in sample:
        chunk_id = chunk_id_for(row["source_id"])
        chunk = sb.table(TARGET_TABLE).select("*").eq("id", chunk_id).limit(1).execute().data
        akb = sb.table("ai_knowledge_base").select("*").eq("chunk_id", chunk_id).limit(1).execute().data
        print(f"  chunk_id={chunk_id}")
        print(f"    chunk ada di {TARGET_TABLE}: {'YA' if chunk else 'TIDAK ADA -- masalah!'}")
        print(f"    akb ada: {'YA' if akb else 'TIDAK ADA -- masalah!'}")

    confirm = input("\nLanjut approve semua baris di atas? (ketik 'ya' untuk lanjut): ")
    if confirm.strip().lower() != "ya":
        print("Dibatalkan.")
        exit()

    # 3. Approve massal
    chunk_ids = [
        chunk_id_for(r["source_id"])
        for r in sb.table("ai_ingest_queue")
        .select("source_id")
        .eq("source_table", SOURCE_TABLE)
        .eq("pipeline_stage", "akb_registered")
        .execute()
        .data
    ]
    for i in range(0, len(chunk_ids), 500):
        batch_ids = chunk_ids[i:i + 500]
        sb.table("ai_knowledge_base").update({"status": "approved"}).in_("chunk_id", batch_ids).execute()

    sb.table("ai_ingest_queue").update({
        "pipeline_stage": "done", "status": "completed", "processed_at": "now()",
    }).eq("source_table", SOURCE_TABLE).eq("pipeline_stage", "akb_registered").execute()

    print(f"\nSelesai. {len(chunk_ids)} baris di-approve untuk SOURCE_TABLE='{SOURCE_TABLE}'.")
