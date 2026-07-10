# RAG Pipeline — Revisi Full (Juli 2026)

## Persiapan (sekali saja)

1. Copy folder `scripts/rag/` ke `D:\paroki_digital_stclemens\scripts\rag\`
2. Install dependency (kalau belum ada):
```powershell
cd D:\paroki_digital_stclemens
pip install supabase boto3 google-generativeai python-dotenv
```
3. Pastikan constraint unique ada di `ai_ingest_queue` (dibutuhkan `00_enqueue_batch.py`).
   Jalankan sekali di Supabase SQL:
```sql
ALTER TABLE public.ai_ingest_queue
  ADD CONSTRAINT ai_ingest_queue_source_unique UNIQUE (source_table, source_id);
```

## Preset 1 — Re-ingest Teologi (theological_chunks)

```powershell
cd D:\paroki_digital_stclemens\scripts\rag

$env:PIPELINE_SOURCE_TABLE = "theological_raw_chunk"
$env:PIPELINE_TARGET_TABLE = "theological_chunks"
$env:PIPELINE_R2_FOLDER    = "theological"
$env:PIPELINE_EMBEDDING_COL = "content_embedding"

python 00a_chunk_theological_sources.py   # chunking raw source -> manifest + cache lokal
python 00_enqueue_batch.py                # daftarkan ke ai_ingest_queue
python 01_generate_embedding.py           # generate embedding (paling lama, banyak API call)
python 02_upload_r2.py                    # upload teks ke R2
python 03_insert_chunk.py                 # insert ke theological_chunks
python 04_insert_ai_knowledge_base.py     # daftarkan ke ai_knowledge_base (needs_review)
python 05_verify_and_approve.py           # sampling + approve massal
```

## Preset 2 — Ingest Santo/Santa (saints_chunks, folder R2 tetap "theological")

```powershell
$env:PIPELINE_SOURCE_TABLE = "saints_manual_import"
$env:PIPELINE_TARGET_TABLE = "saints_chunks"
$env:PIPELINE_R2_FOLDER    = "theological"
$env:PIPELINE_EMBEDDING_COL = "embedding"   # BEDA nama kolom dari theological_chunks!

# 00a tidak perlu dijalankan (saints.json dibaca langsung oleh fetch_source_row)
python 00_enqueue_batch.py
python 01_generate_embedding.py
python 02_upload_r2.py
python 03_insert_chunk.py
python 04_insert_ai_knowledge_base.py
python 05_verify_and_approve.py
```

**PENTING**: `saints.json` harus punya kolom `id` per baris (uuid unik) sebagai
`source_id`. Kalau file mentahnya belum punya `id`, jalankan dulu skrip kecil
untuk menambahkan uuid ke tiap baris sebelum lanjut (tanya saya kalau perlu).

## Setelah kedua preset selesai — verifikasi ulang

```sql
SELECT 'theological_chunks' t, count(*) FROM public.theological_chunks
UNION ALL SELECT 'saints_chunks', count(*) FROM public.saints_chunks
UNION ALL SELECT 'ai_knowledge_base_approved', count(*) FROM public.ai_knowledge_base WHERE status='approved';

SELECT pg_size_pretty(pg_total_relation_size('public.theological_chunks'));
```

## Prayers (TIDAK lewat pipeline chunk — langsung ke prayers_collection)

Sesuai `rag_data_governance_master.md` §5 (pohon keputusan): `prayers_collection`
< 1000 baris, exact-lookup, TIDAK di-offload ke R2/embedding chunk. Perlu script
terpisah sederhana (insert langsung + 1 embedding per baris, tanpa R2). Saya
buatkan kalau Anda konfirmasi field mapping `prayers.json` (nama kolom di JSON
vs kolom `prayers_collection`).

## Kalau ada tahap gagal di tengah jalan

Semua tahap **idempotent** — aman dijalankan ulang, baris yang sudah lolos
tahap tertentu (`pipeline_stage`) otomatis di-skip oleh filter `.eq("pipeline_stage", ...)`
di tahap berikutnya. Cek dulu status macet di mana:
```sql
SELECT pipeline_stage, failed_stage, count(*), array_agg(last_error) FILTER (WHERE last_error IS NOT NULL)
FROM public.ai_ingest_queue
WHERE source_table = 'theological_raw_chunk'
GROUP BY 1, 2;
```
