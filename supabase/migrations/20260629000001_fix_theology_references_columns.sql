-- Add missing columns to theology_references for RAG uploader
ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS chunk_index INTEGER;
ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS document_code TEXT;
ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS content_text TEXT;
ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS paragraph_number TEXT;

-- Unique constraint for upsert
ALTER TABLE public.theology_references DROP CONSTRAINT IF EXISTS theology_references_doc_chunk_unique;
ALTER TABLE public.theology_references ADD CONSTRAINT theology_references_doc_chunk_unique UNIQUE (document_code, chunk_index);

-- Index
CREATE INDEX IF NOT EXISTS idx_theology_references_doc_chunk ON public.theology_references(document_code, chunk_index);
