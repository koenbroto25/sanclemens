-- Migration: Create Embedding Staleness Triggers
-- Created: 29 June 2026
-- Purpose: Implement triggers to mark embeddings as outdated when source chunk content changes.

SET search_path = public, extensions;

-- ============================================================
-- 1. FUNCTION: set_embedding_outdated()
--    Generic function to set the 'embedding_outdated' column to TRUE.
-- ============================================================
CREATE OR REPLACE FUNCTION set_embedding_outdated()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.content_for_rag IS DISTINCT FROM OLD.content_for_rag OR
       NEW.metadata_json   IS DISTINCT FROM OLD.metadata_json THEN
        NEW.embedding_outdated = TRUE;
    END IF;
    RETURN NEW;
END;
$$;

-- ============================================================
-- 2. TRIGGERS: For each chunk table
-- ============================================================

-- theological_chunks
CREATE OR REPLACE TRIGGER trg_set_embedding_outdated_theological
BEFORE UPDATE ON public.theological_chunks
FOR EACH ROW EXECUTE FUNCTION set_embedding_outdated();

-- operational_chunks
CREATE OR REPLACE TRIGGER trg_set_embedding_outdated_operational
BEFORE UPDATE ON public.operational_chunks
FOR EACH ROW EXECUTE FUNCTION set_embedding_outdated();

-- structured_entity_chunks
CREATE OR REPLACE TRIGGER trg_set_embedding_outdated_structured_entity
BEFORE UPDATE ON public.structured_entity_chunks
FOR EACH ROW EXECUTE FUNCTION set_embedding_outdated();

-- internal_admin_chunks
CREATE OR REPLACE TRIGGER trg_set_embedding_outdated_internal_admin
BEFORE UPDATE ON public.internal_admin_chunks
FOR EACH ROW EXECUTE FUNCTION set_embedding_outdated();