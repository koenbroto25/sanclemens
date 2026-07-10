CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.theology_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_code TEXT NOT NULL,
    chunk_index INTEGER,
    title TEXT,
    penulis TEXT,
    kategori TEXT,
    paragraph_number TEXT,
    content_text TEXT NOT NULL,
    content_embedding extensions.vector(3072),
    theology_topic TEXT[],
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_code, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_theology_refs_doc ON public.theology_references(document_code);
CREATE INDEX IF NOT EXISTS idx_theology_refs_kategori ON public.theology_references(kategori);