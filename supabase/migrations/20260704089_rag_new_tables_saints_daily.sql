-- Migration: RAG New Tables — Saints & Daily Reflections
-- Created: 04 July 2026
-- Purpose: Create saints_chunks, saints_index, daily_reflections tables
-- Reference: rag_ai_r2_72.md §14, §15.3, §15.9; rag_data_governance_master.md §2.1

SET search_path = public, extensions;

-- ============================================================
-- 1. saints_chunks — Biography + Embedding untuk semantic search
-- ============================================================
CREATE TABLE IF NOT EXISTS public.saints_chunks (
    id                  UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    saint_name           TEXT NOT NULL,
    content_r2_key       TEXT,
    content_preview      TEXT,
    embedding            VECTOR(768),
    category_code        TEXT DEFAULT '7a',
    source_types         TEXT[] DEFAULT ARRAY['hagiografi'],
    authority_level      TEXT DEFAULT 'reference',
    embedding_outdated   BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.saints_chunks IS 'Chunk biografi orang kudus — konten penuh di R2, embedding & metadata di Postgres';
COMMENT ON COLUMN public.saints_chunks.content_r2_key IS 'R2 path: chunks/theological/{id}.txt';
COMMENT ON COLUMN public.saints_chunks.category_code IS '7a (hagiografi) — default, tidak berubah per baris';
COMMENT ON COLUMN public.saints_chunks.authority_level IS 'reference — default untuk hagiografi';

-- ============================================================
-- 2. saints_index — Metadata lookup by feast_day / exact match
-- ============================================================
CREATE TABLE IF NOT EXISTS public.saints_index (
    id                  UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    chunk_id            UUID NOT NULL REFERENCES public.saints_chunks(id) ON DELETE CASCADE,
    saint_name          TEXT NOT NULL,
    feast_day           DATE,
    patronage           TEXT[],
    visual_attributes   TEXT[],
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.saints_index IS 'Metadata pendek orang kudus — untuk exact lookup by feast_day, TANPA embedding, TANPA R2';
COMMENT ON COLUMN public.saints_index.chunk_id IS 'FK ke saints_chunks — lookup dua arah untuk ambil teks naratif penuh dari R2';

-- Index for fast feast_day lookup
CREATE INDEX IF NOT EXISTS idx_saints_index_feast_day ON public.saints_index (feast_day);
CREATE INDEX IF NOT EXISTS idx_saints_index_saint_name ON public.saints_index (saint_name);

-- ============================================================
-- 3. daily_reflections — Renungan Harian (by-date access)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_reflections (
    id                  UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    reflection_date     DATE NOT NULL,
    persona             TEXT NOT NULL,
    liturgical_color    TEXT,
    source_bacaan       TEXT,
    content_r2_key      TEXT,
    content_preview     TEXT,
    content_embedding   VECTOR(768),
    status              TEXT DEFAULT 'draft',
    domain              TEXT DEFAULT 'renungan_harian',
    embedding_outdated  BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.daily_reflections IS 'Renungan harian — pola akses by-date, bukan similarity search. Content penuh di R2.';
COMMENT ON COLUMN public.daily_reflections.content_r2_key IS 'R2 path: renungan/{YYYY-MM}/{YYYY-MM-DD}-{persona}.txt';

-- Index for fast date-based retrieval
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_reflections_date_persona 
    ON public.daily_reflections (reflection_date, persona);
CREATE INDEX IF NOT EXISTS idx_daily_reflections_date 
    ON public.daily_reflections (reflection_date);
CREATE INDEX IF NOT EXISTS idx_daily_reflections_status 
    ON public.daily_reflections (status);