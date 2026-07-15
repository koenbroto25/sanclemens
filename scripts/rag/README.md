# Scripts RAG v6.5 — CockroachDB Edition

Direktori ini berisi semua pipeline Python untuk sistem RAG Paroki Santo Klemens. Seluruh skrip ini ditulis untuk CockroachDB + Cloudflare R2 (Supabase hanya untuk tabel aplikasi non-RAG).

---

## Daftar Pipeline

| File | Fungsi | Target DB |
|------|--------|-----------|
| `pipeline_corpus_teologi.py` | Ingest corpus Katolik + Ignatian → `theological_chunks` + `ai_knowledge_base` | CockroachDB |
| `approve_corpus_teologi.py` | Approve corpus Teologi (Ahli Teologi) — pindah `needs_review` → `approved` | CockroachDB |
| `pipeline_renungan.py` | Sinkronisasi renungan published → `daily_reflections` + `ai_knowledge_base` | CockroachDB |
| `.env.example` | Template environment variables untuk seluruh pipeline | — |

---

## Prasyarat

1. **Python** 3.10+
2. **Dependencies**:
   ```bash
   pip install google-generativeai psycopg2-binary boto3 python-dotenv tiktoken
   ```
3. **Cloudflare R2 bucket** sudah dibuat (`paroki-klemens-rag-content`)
4. **CockroachDB cluster** aktif dan skema RAG sudah terpasang (Lampiran A `rencana_migrasi_rag_cockroachdb_final.md`)
5. **Env variables** terisi (lihat `.env.example`)

---

## Environment Variables

Salin `.env.example` menjadi `.env`, lalu isi dengan kredensial production.

### Untuk Python Scripts (`scripts/rag/.env`)

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

COCKROACHDB_HOST=...
COCKROACHDB_PORT=26257
COCKROACHDB_DBNAME=defaultdb
COCKROACHDB_USER=...
COCKROACHDB_PASSWORD=...

GEMINI_API_KEY=... # fallback single key
GOOGLE_API_KEY_1=... # rotating pool
GOOGLE_API_KEY_2=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=paroki-klemens-rag-content
```

### Untuk Next.js (`.env.local` root project)

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

COCKROACHDB_HOST=...
COCKROACHDB_PORT=26257
COCKROACHDB_DBNAME=defaultdb
COCKROACHDB_USER=...
COCKROACHDB_PASSWORD=...

GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=models/gemini-embedding-2
EMBEDDING_DIMENSIONALITY=768

R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=paroki-klemens-rag-content

NEXT_PUBLIC_APP_URL=https://...
CRON_SECRET=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

---

## Cara Menjalankan

### 1. Ingest Corpus Teologis

```bash
cd scripts/rag
python pipeline_corpus_teologi.py
```

- Membaca 28 dokumen Katolik + 12 dokumen Ignatian.
- Output: chunk disimpan di `theological_chunks` (CockroachDB) + teks di R2.
- Semua chunk masuk dengan `status = 'needs_review'`.

### 2. Approval Ahli Teologi

```bash
# Lihat chunk yang menunggu
python approve_corpus_teologi.py --list CCC

# Setujui satu dokumen
python approve_corpus_teologi.py --approve CCC <uuid-pastor>

# Lihat statistik
python approve_corpus_teologi.py --stats
```

### 3. Sinkronisasi Renungan ke RAG

```bash
# Mode normal: 48 jam terakhir
python pipeline_renungan.py

# Backfill semua renungan published
python pipeline_renungan.py --backfill
```

---

## Troubleshooting Cepat

| Error | Solusi |
|-------|--------|
| `psycopg2.OperationalError: connection refused` | Cek `COCKROACHDB_HOST`, port 26257, dan SSL cert |
| `GEMINI_API_KEY is missing` | Pastikan `GEMINI_API_KEY` atau `GOOGLE_API_KEY_1` terisi |
| `R2 upload failed` | Cek `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, dan bucket policy |
| `Chunk tidak muncul di search_rag_chunks()` | Chunk masih `needs_review` — jalankan `approve_corpus_teologi.py` |
| `Embedding dimension mismatch` | Pastikan model embedding `models/gemini-embedding-2` (768 dim) |
| `Vector cast error` | Pastikan menggunakan `str(embedding)` + `::vector` di SQL (v6.5.1 fix) |

---

## Referensi Utama

- Spesifikasi sistem: `RENUNGAN_HARIAN_SISTEM_LENGKAP_r3_v6_5_1.md`
- Rencana migrasi: `rencana_migrasi_rag_cockroachdb_final.md`
- Rencana implementasi: `renunganharian_plan.md`

---

**Last updated**: 14 Juli 2026