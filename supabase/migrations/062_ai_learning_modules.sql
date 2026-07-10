-- Migration: AI Schema - Learning Modules (Learn Catholic Bot 8)
-- Created: 19 June 2026
-- Purpose: Support structured religious education with progress tracking

-- Table: public.learning_modules
CREATE TABLE IF NOT EXISTS public.learning_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_code TEXT UNIQUE NOT NULL,   -- 'KKK_BAB1', 'KHK_KAN965', 'PUMR_EKARISTI'
    title TEXT NOT NULL,
    description TEXT,
    source_document TEXT,               -- 'KGK', 'KHK', 'PUMR', 'VATII'
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    estimated_duration_minutes INTEGER,
    sequence_order INTEGER,
    prerequisite_modules TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    is_public_preview BOOLEAN DEFAULT TRUE,  -- Preview tanpa login
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_modules_code ON public.learning_modules(module_code);
CREATE INDEX IF NOT EXISTS idx_learning_modules_published ON public.learning_modules(is_published, sequence_order);

-- Table: public.learning_content
CREATE TABLE IF NOT EXISTS public.learning_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
    content_type TEXT CHECK (content_type IN ('text','audio','video','quiz','reflection')),
    content_data JSONB NOT NULL,        -- Konten dinamis: { text, verses, questions }
    sequence_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_content_module ON public.learning_content(module_id, sequence_order);

-- Table: public.user_learning_progress
CREATE TABLE IF NOT EXISTS public.user_learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed','certified')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    quiz_score INTEGER,
    certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON public.user_learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_module ON public.user_learning_progress(module_id, status);

-- Table: public.learning_qa_context
CREATE TABLE IF NOT EXISTS public.learning_qa_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
    current_content_id UUID REFERENCES public.learning_content(id),
    suggested_questions JSONB,          -- AI-generated: pertanyaan untuk memancing diskusi
    reinforcement_points JSONB,         -- Key takeaways
    theological_sources TEXT[]          -- Referensi ke theology.references
);

CREATE INDEX IF NOT EXISTS idx_learning_qa_module ON public.learning_qa_context(module_id);

-- RLS Policies
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_qa_context ENABLE ROW LEVEL SECURITY;

-- Public read for published modules
CREATE POLICY learning_modules_read_published ON public.learning_modules
    FOR SELECT TO public USING (is_published = TRUE);

-- Authenticated read all
CREATE POLICY learning_modules_read_auth ON public.learning_modules
    FOR SELECT TO authenticated USING (true);

-- Content: public can read if module is published
CREATE POLICY learning_content_read_published ON public.learning_content
    FOR SELECT TO public USING (
        EXISTS (SELECT 1 FROM public.learning_modules WHERE id = module_id AND is_published = TRUE)
    );

CREATE POLICY learning_content_read_auth ON public.learning_content
    FOR SELECT TO authenticated USING (true);

-- Progress: users can only access own progress
CREATE POLICY learning_progress_read_own ON public.user_learning_progress
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY learning_progress_write_own ON public.user_learning_progress
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY learning_progress_update_own ON public.user_learning_progress
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- QA Context: public read for published modules
CREATE POLICY learning_qa_read_published ON public.learning_qa_context
    FOR SELECT TO public USING (
        EXISTS (SELECT 1 FROM public.learning_modules WHERE id = module_id AND is_published = TRUE)
    );

CREATE POLICY learning_qa_read_auth ON public.learning_qa_context
    FOR SELECT TO authenticated USING (true);

-- Admin write (access_layer >= 5)
CREATE POLICY learning_modules_write ON public.learning_modules
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5)
    );

CREATE POLICY learning_content_write ON public.learning_content
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 5)
    );

-- Comments
COMMENT ON TABLE public.learning_modules IS 'Learning modules for Bot 8 Learn Catholic - structured religious education curriculum';
COMMENT ON TABLE public.user_learning_progress IS 'Track user progress through learning modules with certificates';