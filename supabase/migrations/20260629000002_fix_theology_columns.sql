-- Add all missing columns for RAG uploader
ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS nama_dokumen TEXT;
ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS penulis TEXT;
ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS kategori TEXT;
ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS teks TEXT;
ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS embedding extensions.vector(1536);

ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS theology_topic TEXT[];

ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS theology_topic TEXT[];

-- Unique constraint for upsert
ALTER TABLE public.theology_references DROP CONSTRAINT IF EXISTS theology_references_doc_chunk_unique;
ALTER TABLE public.theology_references ADD CONSTRAINT theology_references_doc_chunk_unique UNIQUE (document_code, chunk_index);



