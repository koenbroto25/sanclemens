ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS theology_topic TEXT[];
ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS penulis TEXT;
ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS kategori TEXT;
ALTER TABLE public.theology_references ADD COLUMN IF NOT EXISTS chunk_index INTEGER;