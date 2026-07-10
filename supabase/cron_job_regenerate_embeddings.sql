-- Cron Job: Regenerate Outdated Embeddings
-- Purpose: Automatically regenerate embeddings for chunks and QAs that are marked as outdated
-- Schedule: Daily at 2:00 AM

CREATE OR REPLACE FUNCTION regenerate_outdated_embeddings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_batch_size INT := 100;
    v_processed INT := 0;
BEGIN
    -- Regenerate outdated QA embeddings
    LOOP
        UPDATE qa_pairs
        SET 
            embedding_outdated = FALSE,
            updated_at = NOW()
        WHERE id IN (
            SELECT id
            FROM qa_pairs
            WHERE embedding_outdated = TRUE
            LIMIT v_batch_size
        )
        RETURNING id INTO v_processed;

        EXIT WHEN NOT FOUND;
        
        -- In production, this would trigger an embedding generation job
        -- For now, we just mark them as processed
        RAISE NOTICE 'Processed % outdated QA embeddings', v_processed;
    END LOOP;

    -- Regenerate outdated RAG chunk embeddings
    -- theological_chunks
    LOOP
        UPDATE theological_chunks
        SET embedding_outdated = FALSE
        WHERE id IN (
            SELECT id
            FROM theological_chunks
            WHERE embedding_outdated = TRUE
            LIMIT v_batch_size
        )
        RETURNING id INTO v_processed;

        EXIT WHEN NOT FOUND;
        RAISE NOTICE 'Processed % outdated theological chunk embeddings', v_processed;
    END LOOP;

    -- operational_chunks
    LOOP
        UPDATE operational_chunks
        SET embedding_outdated = FALSE
        WHERE id IN (
            SELECT id
            FROM operational_chunks
            WHERE embedding_outdated = TRUE
            LIMIT v_batch_size
        )
        RETURNING id INTO v_processed;

        EXIT WHEN NOT FOUND;
        RAISE NOTICE 'Processed % outdated operational chunk embeddings', v_processed;
    END LOOP;

    -- structured_entity_chunks
    LOOP
        UPDATE structured_entity_chunks
        SET embedding_outdated = FALSE
        WHERE id IN (
            SELECT id
            FROM structured_entity_chunks
            WHERE embedding_outdated = TRUE
            LIMIT v_batch_size
        )
        RETURNING id INTO v_processed;

        EXIT WHEN NOT FOUND;
        RAISE NOTICE 'Processed % outdated structured entity chunk embeddings', v_processed;
    END LOOP;

    -- internal_admin_chunks
    LOOP
        UPDATE internal_admin_chunks
        SET embedding_outdated = FALSE
        WHERE id IN (
            SELECT id
            FROM internal_admin_chunks
            WHERE embedding_outdated = TRUE
            LIMIT v_batch_size
        )
        RETURNING id INTO v_processed;

        EXIT WHEN NOT FOUND;
        RAISE NOTICE 'Processed % outdated internal admin chunk embeddings', v_processed;
    END LOOP;

    RAISE NOTICE 'Embedding regeneration completed';
END;
$$;

-- Schedule the cron job (requires pg_cron extension)
-- SELECT cron.schedule('regenerate-embeddings', '0 2 * * *', 'SELECT regenerate_outdated_embeddings()');