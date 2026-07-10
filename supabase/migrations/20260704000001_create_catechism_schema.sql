-- Migration: Catechism Schema — Learn Catholic (21 Modul Katolisitas)
-- Created: 4 July 2026
-- Purpose: Tabel baru untuk 21 modul katolisitas (Tahap 0–3)
-- Terpisah dari `learning_modules` V1 (tidak mengubah schema existing)

-- ============================================
-- 1. CATECHISM STAGES (4 tahap)
-- ============================================
CREATE TABLE IF NOT EXISTS public.catechism_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    order_index INTEGER NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    icon_slug TEXT,
    color_theme TEXT,
    saint_patron TEXT,
    saint_patron_medal TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CATECHISM MODULES (21 modul)
-- ============================================
CREATE TABLE IF NOT EXISTS public.catechism_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID NOT NULL REFERENCES public.catechism_stages(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    order_index INTEGER NOT NULL,
    opening_quote_text TEXT,
    opening_quote_source TEXT,
    content_r2_key TEXT NOT NULL,
    content_preview TEXT,
    prev_module_id UUID REFERENCES public.catechism_modules(id),
    next_module_id UUID REFERENCES public.catechism_modules(id),
    estimated_minutes INTEGER DEFAULT 10,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catechism_modules_stage ON public.catechism_modules(stage_id, order_index);
CREATE INDEX IF NOT EXISTS idx_catechism_modules_slug ON public.catechism_modules(slug);
CREATE INDEX IF NOT EXISTS idx_catechism_modules_order ON public.catechism_modules(order_index);

COMMENT ON TABLE public.catechism_modules IS '21 modul katolisitas untuk Learn Catholic (terpisah dari learning_modules V1)';

-- ============================================
-- 3. CATECHISM PROGRESS (tracking + sequential unlock)
-- ============================================
CREATE TABLE IF NOT EXISTS public.catechism_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.catechism_modules(id),
    status TEXT NOT NULL DEFAULT 'locked'
        CHECK (status IN ('locked','unlocked','in_progress','completed')),
    scroll_progress_pct INTEGER DEFAULT 0,
    quiz_passed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_catechism_progress_user ON public.catechism_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_catechism_progress_module ON public.catechism_progress(user_id, module_id);

COMMENT ON TABLE public.catechism_progress IS 'Progress user per modul katekismus dengan gating sequential';

-- ============================================
-- 4. CATECHISM QUIZZES (bank soal per modul)
-- ============================================
CREATE TABLE IF NOT EXISTS public.catechism_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.catechism_modules(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('a','b','c','d')),
    explanation TEXT,
    source_reference TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catechism_quizzes_module ON public.catechism_quizzes(module_id, order_index);

COMMENT ON TABLE public.catechism_quizzes IS 'Bank soal kuis per modul — 5 soal per modul, ditulis manual';

-- ============================================
-- 5. CATECHISM QUIZ ATTEMPTS (riwayat jawaban user)
-- ============================================
CREATE TABLE IF NOT EXISTS public.catechism_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    module_id UUID NOT NULL REFERENCES public.catechism_modules(id),
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    answers JSONB NOT NULL,
    attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catechism_attempts_user ON public.catechism_quiz_attempts(user_id, module_id);

COMMENT ON TABLE public.catechism_quiz_attempts IS 'Riwayat attempt kuis user per modul';

-- ============================================
-- 6. CATECHISM CERTIFICATES
-- ============================================
CREATE TABLE IF NOT EXISTS public.catechism_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    stage_id UUID REFERENCES public.catechism_stages(id),
    certificate_number TEXT UNIQUE NOT NULL,
    verification_code TEXT UNIQUE NOT NULL,
    pdf_r2_key TEXT NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catechism_certificates_user ON public.catechism_certificates(user_id);

COMMENT ON TABLE public.catechism_certificates IS 'Sertifikat per tahap & program penuh katekismus';

-- ============================================
-- 7. TRIGGER — Sequential Unlock
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_catechism_unlock_next()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed' OR OLD IS NULL) THEN
        INSERT INTO public.catechism_progress (user_id, module_id, status)
        SELECT NEW.user_id, cm.next_module_id, 'unlocked'
        FROM public.catechism_modules cm
        WHERE cm.id = NEW.module_id AND cm.next_module_id IS NOT NULL
        ON CONFLICT (user_id, module_id) DO UPDATE
            SET status = 'unlocked'
            WHERE public.catechism_progress.status = 'locked';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_catechism_unlock_next
AFTER UPDATE ON public.catechism_progress
FOR EACH ROW EXECUTE FUNCTION public.fn_catechism_unlock_next();

COMMENT ON FUNCTION public.fn_catechism_unlock_next IS 'Saat modul selesai, unlock modul berikutnya secara otomatis';

-- ============================================
-- 8. RLS POLICIES
-- ============================================
ALTER TABLE public.catechism_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catechism_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catechism_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catechism_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catechism_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catechism_certificates ENABLE ROW LEVEL SECURITY;

-- Stages & Modules — public read
CREATE POLICY catechism_stages_read ON public.catechism_stages
    FOR SELECT TO public USING (true);

CREATE POLICY catechism_modules_read ON public.catechism_modules
    FOR SELECT TO public USING (true);

-- Progress — hanya milik user sendiri
CREATE POLICY catechism_progress_select ON public.catechism_progress
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY catechism_progress_insert ON public.catechism_progress
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY catechism_progress_update ON public.catechism_progress
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Quiz questions — auth read (tanpa correct_answer untuk publik)
CREATE POLICY catechism_quizzes_select ON public.catechism_quizzes
    FOR SELECT TO authenticated USING (true);

-- Quiz attempts — milik user sendiri
CREATE POLICY catechism_attempts_select ON public.catechism_quiz_attempts
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY catechism_attempts_insert ON public.catechism_quiz_attempts
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Certificates — milik user sendiri
CREATE POLICY catechism_certificates_select ON public.catechism_certificates
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Admin write (access_layer >= 5)
CREATE POLICY catechism_modules_admin ON public.catechism_modules
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5)
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5)
    );

CREATE POLICY catechism_quizzes_admin ON public.catechism_quizzes
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5)
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5)
    );