-- Migration: Create match_feedback table
-- Created: 20 June 2026
-- Purpose: Track feedback on job applications and assistance matches for success learning algorithm

CREATE TYPE public.match_type AS ENUM ('job_application', 'assistance_match');
CREATE TYPE public.feedback_status AS ENUM ('success', 'failure', 'no_response');
CREATE TYPE public.match_outcome AS ENUM ('hired', 'received_aid', 'rejected', 'cancelled', 'other');

CREATE TABLE public.match_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- User providing feedback (e.g., job seeker, aid recipient, employer)
    related_match_id UUID, -- References lowongan_lamaran.id or a future assistance_match table ID
    match_type match_type NOT NULL,
    feedback_status feedback_status NOT NULL,
    outcome match_outcome,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5), -- 1=poor, 5=excellent
    comments TEXT,
    feedback_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient lookup
CREATE INDEX idx_match_feedback_user_id ON public.match_feedback(user_id);
CREATE INDEX idx_match_feedback_related_match_id ON public.match_feedback(related_match_id);
CREATE INDEX idx_match_feedback_type_status ON public.match_feedback(match_type, feedback_status);

-- RLS Policies
ALTER TABLE public.match_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert and read their own feedback
CREATE POLICY match_feedback_read_own ON public.match_feedback
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY match_feedback_write_own ON public.match_feedback
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Admin can read all feedback (for algorithm training and monitoring)
CREATE POLICY match_feedback_read_admin ON public.match_feedback
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_layer >= 6)
    );

COMMENT ON TABLE public.match_feedback IS 'Stores feedback on match outcomes for the AI success learning algorithm.';