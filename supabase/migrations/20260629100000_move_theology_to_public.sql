-- Recreate theology tables in public schema
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

CREATE TABLE IF NOT EXISTS public.theology_prayers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    kategori TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.theology_prayer_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    sos_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_theology_refs_doc ON public.theology_references(document_code);
CREATE INDEX IF NOT EXISTS idx_theology_refs_kategori ON public.theology_references(kategori);

-- RLS
ALTER TABLE public.theology_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theology_prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theology_prayer_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS theology_references_read ON public.theology_references;
CREATE POLICY theology_references_read ON public.theology_references FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS theology_prayers_read ON public.theology_prayers;
CREATE POLICY theology_prayers_read ON public.theology_prayers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS theology_prayer_guides_read ON public.theology_prayer_guides;
CREATE POLICY theology_prayer_guides_read ON public.theology_prayer_guides FOR SELECT TO authenticated USING (true);