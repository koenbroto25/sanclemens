-- Migration 002b: Add slug to Lingkungan
-- Ref: GDD BAB IV.2, BAB 0.3 — Pintu 2 namespace /lingkungan/:slug
-- Perlu untuk routing Pintu 2 dan middleware redirect

-- ============================================
-- 1. ADD slug COLUMN to LINGKUNGAN
-- ============================================
ALTER TABLE public.lingkungan
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- ============================================
-- 2. GENERATE slug FROM nama FOR EXISTING ROWS
-- ============================================
-- slug: lowercase, spaces → hyphens, remove special chars
UPDATE public.lingkungan
SET slug = LOWER(REGEXP_REPLACE(nama, '[^a-z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- ============================================
-- 3. ENSURE UNIQUENESS (handle duplicates)
-- ============================================
-- If duplicate slugs exist, append -1, -2, etc.
DO $$
DECLARE
    rec RECORD;
    counter INTEGER;
    base_slug TEXT;
BEGIN
    FOR rec IN
        SELECT slug, COUNT(*) as cnt
        FROM public.lingkungan
        WHERE slug IS NOT NULL
        GROUP BY slug
        HAVING COUNT(*) > 1
    LOOP
        counter := 1;
        FOR rec IN
            SELECT id, slug FROM public.lingkungan
            WHERE slug = rec.slug
            ORDER BY created_at
        LOOP
            IF counter > 1 THEN
                UPDATE public.lingkungan
                SET slug = rec.slug || '-' || counter
                WHERE id = rec.id;
            END IF;
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- 4. ADD INDEX FOR FAST LOOKUP
-- ============================================
CREATE INDEX IF NOT EXISTS idx_lingkungan_slug ON public.lingkungan(slug);

-- ============================================
-- 5. NOT NULL CONSTRAINT (after data migration)
-- ============================================
ALTER TABLE public.lingkungan
ALTER COLUMN slug SET NOT NULL;

-- ============================================
-- 6. COMMENT
-- ============================================
COMMENT ON COLUMN public.lingkungan.slug IS 'Kebabs-case identifier untuk URL Pintu 2: /lingkungan/[slug]';