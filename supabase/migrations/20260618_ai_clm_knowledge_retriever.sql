-- Migration: AI-CLM & Knowledge Retriever System
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;
SET search_path = public, extensions;

-- Date: 2026-06-18
-- Purpose: Add tables for Catholic Learning Module, App Overview Q&A, and Knowledge Retriever

-- 1. App Overview Q&A Table
CREATE TABLE IF NOT EXISTS public.app_overview_qna (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    question_embedding VECTOR(1536), -- for semantic search
    related_features TEXT[],         -- e.g., ['charity_dana_kasih', 'digital_vault']
    target_user_layers INTEGER[],    -- e.g., [0, 2] for public/guest, all layers for general info
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Learning Paths Table
CREATE TABLE IF NOT EXISTS public.learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- accessible to guests via /learn-catholic
    steps JSONB NOT NULL,            -- e.g., [{"title": "Step 1: What is Trinity?", "content_ref": "theology.references#123", "question": "Reflect on..."}]
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Learning Progress Records Table
CREATE TABLE IF NOT EXISTS public.learning_progress_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    path_id UUID REFERENCES public.learning_paths(id),
    current_step INTEGER DEFAULT 0,
    completed_steps INTEGER[] DEFAULT '{}',
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create theology.references table if not exists (schema is empty)
CREATE TABLE IF NOT EXISTS theology.references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    document_type TEXT,
    source_document TEXT,
    content_embedding VECTOR(1536),
    theology_topic TEXT,
    historical_context TEXT,
    philosophical_concept TEXT,
    everyday_application TEXT,
    relevance_score DECIMAL(3,2) DEFAULT 1.0,
    target_bot_modes TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create ai_user_profiles if not exists, then extend
CREATE TABLE IF NOT EXISTS public.ai_user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_user_profiles ADD COLUMN IF NOT EXISTS learning_progress_summary TEXT; -- Non-E2E summary for AI to reference
ALTER TABLE public.ai_user_profiles ADD COLUMN IF NOT EXISTS learning_path_preferences TEXT[];
ALTER TABLE public.ai_user_profiles ADD COLUMN IF NOT EXISTS preferred_learning_depth TEXT DEFAULT 'normal' CHECK (preferred_learning_depth IN ('ringkas', 'normal', 'detail', 'akademis'));

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_overview_qna_embedding ON public.app_overview_qna USING ivfflat (question_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_theology_references_embedding ON theology.references USING ivfflat (content_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON public.learning_progress_records(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_path_id ON public.learning_progress_records(path_id);

-- 7. Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- 8. RLS Policies
ALTER TABLE public.app_overview_qna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress_records ENABLE ROW LEVEL SECURITY;

-- Public Q&A is viewable by everyone
CREATE POLICY "Public app_overview_qna viewable by all" ON public.app_overview_qna
    FOR SELECT USING (true);

-- Only admins can insert/update app_overview_qna
CREATE POLICY "Admins can manage app_overview_qna" ON public.app_overview_qna
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_layer >= 5
        )
    );

-- Public learning paths are viewable by everyone
CREATE POLICY "Public learning_paths viewable by all" ON public.learning_paths
    FOR SELECT USING (is_public = true);

-- Users can view their own learning progress
CREATE POLICY "Users can view own learning progress" ON public.learning_progress_records
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own learning progress
CREATE POLICY "Users can create own learning progress" ON public.learning_progress_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own learning progress
CREATE POLICY "Users can update own learning progress" ON public.learning_progress_records
    FOR UPDATE USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.app_overview_qna IS 'Curated Q&A about the application features, benefits, and general information for new users';
COMMENT ON TABLE public.learning_paths IS 'Structured learning paths for Catholic faith education';
COMMENT ON TABLE public.learning_progress_records IS 'Tracks user progress through learning paths';