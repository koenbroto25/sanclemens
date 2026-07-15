/**
 * AI Knowledge Retriever for CockroachDB
 * Replaces Supabase RPC calls with direct CockroachDB queries
 * Supports RLS via access_layer parameter
 */

import { Pool, QueryResultRow } from 'pg';

const cockroachdbPool = new Pool({
  host: process.env.COCKROACHDB_HOST,
  port: 26257,
  database: process.env.COCKROACHDB_DBNAME || 'defaultdb',
  user: process.env.COCKROACHDB_USER,
  password: process.env.COCKROACHDB_PASSWORD,
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.COCKROACHDB_CA_CERT ? Buffer.from(process.env.COCKROACHDB_CA_CERT, 'base64') : undefined,
  },
});

export interface DirectQAResult {
  qa_pair_id: string;
  r2_key: string;
  content_preview: string;
  source_reference: string;
  similarity_score: number;
  chunk_quality_score: number;
  question_type_classification: string;
}

export interface RAGChunkResult {
  chunk_id: string;
  r2_key: string;
  content_preview: string;
  source_reference: string;
  similarity_score: number;
  domain: string;
  chunk_table: string;
  chunk_quality_score: number;
  question_type_classification: string;
}

export interface RetrievalSource {
  chunkId: string;
  r2Key: string;
  contentPreview: string;
  sourceReference: string;
  score: number;
  isApprovedQA: boolean;
  domain: string;
  chunkTable: string;
  chunkQualityScore: number;
  questionTypeClassification: string;
}

export interface RetrievalResult {
  retrieval_path: 'direct_qa' | 'rag' | 'llm_only' | 'fallback';
  sources: RetrievalSource[];
  confidence: number;
}

/**
 * Search direct QAs in CockroachDB
 */
export async function searchDirectQA(
  embedding: number[],
  domain: string,
  botId: string,
  maxAccessLevel: number,
  limit: number
): Promise<DirectQAResult[]> {
  const client = await cockroachdbPool.connect();
  try {
    const embeddingStr = '[' + embedding.join(',') + ']';
    const result = await client.query(
      `SELECT 
        entry_id as qa_pair_id,
        answer_r2_key as r2_key,
        answer_preview as content_preview,
        source_reference,
        similarity_score,
        chunk_quality_score,
        question_type_classification
      FROM search_direct_qa($1::vector, $2, $3, $4, $5)`,
      [embeddingStr, domain, botId, maxAccessLevel, limit]
    );
    return result.rows.map((row: QueryResultRow) => ({
      qa_pair_id: row.qa_pair_id,
      r2_key: row.r2_key,
      content_preview: row.content_preview,
      source_reference: row.source_reference,
      similarity_score: parseFloat(row.similarity_score),
      chunk_quality_score: parseFloat(row.chunk_quality_score),
      question_type_classification: row.question_type_classification
    }));
  } finally {
    client.release();
  }
}

/**
 * Search RAG chunks in CockroachDB
 */
export async function searchRAGChunks(
  embedding: number[],
  domain: string,
  botId: string,
  maxAccessLevel: number,
  limit: number
): Promise<RAGChunkResult[]> {
  const client = await cockroachdbPool.connect();
  try {
    const embeddingStr = '[' + embedding.join(',') + ']';
    const result = await client.query(
      `SELECT 
        chunk_id,
        content_r2_key as r2_key,
        content_preview,
        source_reference,
        similarity_score,
        domain,
        chunk_table,
        chunk_quality_score,
        question_type_classification
      FROM search_rag_chunks($1::vector, $2, $3, $4, $5)`,
      [embeddingStr, domain, botId, maxAccessLevel, limit]
    );
    return result.rows.map((row: QueryResultRow) => ({
      chunk_id: row.chunk_id,
      r2_key: row.r2_key,
      content_preview: row.content_preview,
      source_reference: row.source_reference,
      similarity_score: parseFloat(row.similarity_score),
      domain: row.domain,
      chunk_table: row.chunk_table,
      chunk_quality_score: parseFloat(row.chunk_quality_score),
      question_type_classification: row.question_type_classification
    }));
  } finally {
    client.release();
  }
}

/**
 * Retrieve knowledge from CockroachDB
 */
export async function retrieveKnowledge(
  context: {
    query: string;
    embedding: number[] | null;
    domain: string;
    botId: string;
    user_access_level: number;
  }): Promise<RetrievalResult> {
  const { embedding, domain, botId, user_access_level } = context;

  if (!embedding) {
    return {
      retrieval_path: 'llm_only',
      sources: [],
      confidence: 0
    };
  }

  // P1: Search approved QAs first
  const approvedQAs = await searchDirectQA(
    embedding,
    domain,
    botId,
    user_access_level,
    5
  );

  const highConfidenceQA = approvedQAs.filter(qa => qa.similarity_score > 0.85);

  if (highConfidenceQA.length > 0) {
    return {
      retrieval_path: 'direct_qa',
      sources: highConfidenceQA.map(qa => ({
        chunkId: qa.qa_pair_id,
        r2Key: qa.r2_key,
        contentPreview: qa.content_preview,
        sourceReference: qa.source_reference || 'Approved Q&A',
        score: qa.similarity_score,
        isApprovedQA: true,
        domain,
        chunkTable: 'qa_pairs',
        chunkQualityScore: qa.chunk_quality_score,
        questionTypeClassification: qa.question_type_classification
      })),
      confidence: highConfidenceQA[0].similarity_score
    };
  }

  // P2: Search RAG chunks
  const ragChunks = await searchRAGChunks(
    embedding,
    domain,
    botId,
    user_access_level,
    20
  );

  if (ragChunks.length > 0) {
    return {
      retrieval_path: 'rag',
      sources: ragChunks.map(chunk => ({
        chunkId: chunk.chunk_id,
        r2Key: chunk.r2_key,
        contentPreview: chunk.content_preview,
        sourceReference: chunk.source_reference,
        score: chunk.similarity_score,
        isApprovedQA: false,
        domain: chunk.domain,
        chunkTable: chunk.chunk_table,
        chunkQualityScore: chunk.chunk_quality_score,
        questionTypeClassification: chunk.question_type_classification
      })),
      confidence: ragChunks[0].similarity_score
    };
  }

  // P3: No retrieval found
  return {
    retrieval_path: 'llm_only',
    sources: [],
    confidence: 0
  };
}