import os
from dotenv import load_dotenv
load_dotenv(".env.local")
import psycopg2

conn = psycopg2.connect(
    host=os.environ["COCKROACHDB_HOST"], port=26257,
    dbname=os.environ["COCKROACHDB_DBNAME"], user=os.environ["COCKROACHDB_USER"],
    password=os.environ["COCKROACHDB_PASSWORD"], sslmode="verify-full")
conn.autocommit = True
cur = conn.cursor()

print("Menambahkan cabang daily_reflections ke search_rag_chunks()...")
cur.execute("""
CREATE OR REPLACE FUNCTION search_rag_chunks(
    p_query_embedding VECTOR(768),
    p_domain STRING,
    p_bot_access STRING,
    p_user_access_level INT8,
    p_limit INT8
) RETURNS TABLE (
    chunk_id UUID, content_r2_key STRING, content_preview STRING, source_reference STRING,
    similarity_score FLOAT8, boosted_score FLOAT8, authority_level STRING, domain STRING,
    chunk_table STRING, chunk_quality_score INT8, question_type_classification STRING
)
LANGUAGE SQL
STABLE
AS $$
    SELECT * FROM (
    (SELECT
        tc.id, tc.content_r2_key, tc.content_preview, akb.source_reference,
        (1.0::FLOAT8 - (power(tc.content_embedding <-> p_query_embedding, 2.0::FLOAT8) / 2.0::FLOAT8))::FLOAT8 AS similarity_score,
        ((1.0::FLOAT8 - (power(tc.content_embedding <-> p_query_embedding, 2.0::FLOAT8) / 2.0::FLOAT8)) *
            (CASE tc.authority_level
                WHEN 'highest'    THEN 1.15::FLOAT8
                WHEN 'high'       THEN 1.08::FLOAT8
                WHEN 'medium'     THEN 1.00::FLOAT8
                WHEN 'reference'  THEN 0.95::FLOAT8
                WHEN 'devotional' THEN 0.90::FLOAT8
                ELSE 1.00::FLOAT8
            END))::FLOAT8 AS boosted_score,
        tc.authority_level,
        akb.domain, 'theological_chunks'::STRING AS chunk_table,
        akb.chunk_quality_score, akb.question_type_classification
    FROM ai_knowledge_base akb
    JOIN theological_chunks tc ON tc.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.chunk_table_ref = 'theological_chunks' AND tc.embedding_outdated = FALSE
      AND tc.content_r2_key IS NOT NULL
    ORDER BY tc.content_embedding <-> p_query_embedding
    LIMIT p_limit * 10)

    UNION ALL

    (SELECT
        oc.id, oc.content_r2_key, oc.content_preview, akb.source_reference,
        (1.0::FLOAT8 - (power(oc.content_embedding <-> p_query_embedding, 2.0::FLOAT8) / 2.0::FLOAT8))::FLOAT8 AS similarity_score,
        (1.0::FLOAT8 - (power(oc.content_embedding <-> p_query_embedding, 2.0::FLOAT8) / 2.0::FLOAT8))::FLOAT8 AS boosted_score,
        NULL::STRING AS authority_level,
        akb.domain, 'operational_chunks'::STRING AS chunk_table,
        akb.chunk_quality_score, akb.question_type_classification
    FROM ai_knowledge_base akb
    JOIN operational_chunks oc ON oc.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.chunk_table_ref = 'operational_chunks' AND oc.embedding_outdated = FALSE
      AND oc.content_r2_key IS NOT NULL
      AND (oc.expires_at IS NULL OR oc.expires_at > now())
    ORDER BY oc.content_embedding <-> p_query_embedding
    LIMIT p_limit)

    UNION ALL

    (SELECT
        sc.id, sc.content_r2_key, sc.content_preview, akb.source_reference,
        (1.0::FLOAT8 - (power(sc.content_embedding <-> p_query_embedding, 2.0::FLOAT8) / 2.0::FLOAT8))::FLOAT8 AS similarity_score,
        (1.0::FLOAT8 - (power(sc.content_embedding <-> p_query_embedding, 2.0::FLOAT8) / 2.0::FLOAT8))::FLOAT8 AS boosted_score,
        NULL::STRING AS authority_level,
        akb.domain, 'structured_entity_chunks'::STRING AS chunk_table,
        akb.chunk_quality_score, akb.question_type_classification
    FROM ai_knowledge_base akb
    JOIN structured_entity_chunks sc ON sc.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.chunk_table_ref = 'structured_entity_chunks'
      AND sc.embedding_outdated = FALSE AND sc.entity_active = TRUE
      AND sc.content_r2_key IS NOT NULL
      AND (sc.expires_at IS NULL OR sc.expires_at > now())
    ORDER BY sc.content_embedding <-> p_query_embedding
    LIMIT p_limit)

    UNION ALL

    (SELECT
        ia.id, ia.content_r2_key, ia.content_preview, akb.source_reference,
        (1.0::FLOAT8 - (power(ia.content_embedding <-> p_query_embedding, 2.0::FLOAT8) / 2.0::FLOAT8))::FLOAT8 AS similarity_score,
        (1.0::FLOAT8 - (power(ia.content_embedding <-> p_query_embedding, 2.0::FLOAT8) / 2.0::FLOAT8))::FLOAT8 AS boosted_score,
        NULL::STRING AS authority_level,
        akb.domain, 'internal_admin_chunks'::STRING AS chunk_table,
        akb.chunk_quality_score, akb.question_type_classification
    FROM ai_knowledge_base akb
    JOIN internal_admin_chunks ia ON ia.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.chunk_table_ref = 'internal_admin_chunks' AND ia.embedding_outdated = FALSE
      AND ia.content_r2_key IS NOT NULL
    ORDER BY ia.content_embedding <-> p_query_embedding
    LIMIT p_limit)

    UNION ALL

    (SELECT
        dr.id, dr.content_r2_key, dr.content_preview, akb.source_reference,
        (1.0::FLOAT8 - (power(dr.content_embedding <-> p_query_embedding, 2.0::FLOAT8) / 2.0::FLOAT8))::FLOAT8 AS similarity_score,
        (1.0::FLOAT8 - (power(dr.content_embedding <-> p_query_embedding, 2.0::FLOAT8) / 2.0::FLOAT8))::FLOAT8 AS boosted_score,
        NULL::STRING AS authority_level,
        akb.domain, 'daily_reflections'::STRING AS chunk_table,
        akb.chunk_quality_score, akb.question_type_classification
    FROM ai_knowledge_base akb
    JOIN daily_reflections dr ON dr.id = akb.chunk_id
    WHERE akb.domain = p_domain AND akb.bot_access @> ARRAY[p_bot_access]
      AND akb.access_level_min <= p_user_access_level AND akb.status = 'approved'
      AND akb.chunk_table_ref = 'daily_reflections' AND dr.embedding_outdated = FALSE
      AND dr.content_r2_key IS NOT NULL
    ORDER BY dr.content_embedding <-> p_query_embedding
    LIMIT p_limit)
    ) AS sub
    ORDER BY boosted_score DESC
    LIMIT p_limit;
$$;
""")
print("  OK — search_rag_chunks() sekarang mencakup 5 cabang (+ daily_reflections)")

conn.close()
print("SELESAI")
