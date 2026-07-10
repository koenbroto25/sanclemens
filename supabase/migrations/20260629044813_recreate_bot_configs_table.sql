-- Migration: Recreate public.bot_configs table
-- Created: 29 June 2026
-- Purpose: Correct the schema of public.bot_configs to align with ai_implementation_plan_v6.md and rag_ai.md,
--          and ensure proper seeding.

SET search_path = public, extensions;

-- ============================================================
-- 1. DROP TABLE: public.bot_configs (with CASCADE)
--    - This will drop dependent objects like foreign keys or triggers.
-- ============================================================
DROP TABLE IF EXISTS public.bot_configs CASCADE;

-- ============================================================
-- 2. CREATE TABLE: public.bot_configs
--    - Recreate with the correct schema
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bot_configs (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id                      TEXT NOT NULL UNIQUE,
    bot_name                    TEXT NOT NULL,
    access_level_required       INTEGER NOT NULL DEFAULT 0,
    rag_top_k_initial           INTEGER NOT NULL DEFAULT 15,
    rag_top_k_after_relevance   INTEGER NOT NULL DEFAULT 10,
    rag_top_k_final             INTEGER NOT NULL DEFAULT 5,
    min_confidence_threshold    FLOAT NOT NULL DEFAULT 0.70,
    use_llm_cross_encoder       BOOLEAN NOT NULL DEFAULT FALSE,
    allowed_cross_domains       TEXT[],
    fallback_response_template  TEXT NOT NULL,
    max_turns_per_session       INTEGER DEFAULT 30,
    cooldown_suggestion_at_turn INTEGER DEFAULT 25,
    active_system_prompt_id     UUID, -- FK to ai_prompts.id, to be added later if needed
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. RECREATE TRIGGER: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_bot_configs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END; $$;

CREATE TRIGGER trg_bot_configs_updated_at
BEFORE UPDATE ON public.bot_configs
FOR EACH ROW EXECUTE FUNCTION update_bot_configs_updated_at();

-- Note: The foreign key to public.ai_prompts(id) (active_system_prompt_id) will not be added here.
-- It will be handled as part of a later verification step, or a dedicated migration if ai_prompts
-- needs to be dropped and recreated as well, or if it already exists and can be referenced.
-- For now, focus is on getting bot_configs schema correct for seeding.