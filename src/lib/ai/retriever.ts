/**
 * AI Knowledge Retriever for v6.0 RAG architecture (R2 Content Offload)
 * Handles retrieval from both direct QA and RAG chunks
 * Returns R2 keys and previews instead of full text content
 */

import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from './embedding';

export interface RetrievalContext {
  query: string;
  embedding: number[] | null;
  domain: string;
  bot_id: string;
  user_access_level: number;
}

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
  authorityLevel?: number;
}

export interface RetrievalResult {
  retrieval_path: 'direct_qa' | 'rag' | 'llm_only' | 'fallback';
  sources: RetrievalSource[];
  confidence: number;
}

/**
 * Retrieve knowledge using v6.0 priority-based approach (R2 offload)
 * P1: Approved QAs from qa_pairs (similarity > 0.85)
 * P2: RAG chunks from ai_knowledge_base
 * P3: LLM only (no retrieval)
 * 
 * Returns R2 keys and previews instead of full text content.
 * The orchestrator should call hydrateTopKWithContent() for top-K chunks.
 */
export async function retrieveKnowledge(
  context: RetrievalContext,
  botAccess: string[]
): Promise<RetrievalResult> {
  const supabase = createClient();
  const { query, embedding, domain, bot_id, user_access_level } = context;

  // If no embedding, fall back to LLM only
  if (!embedding) {
    return {
      retrieval_path: 'llm_only',
      sources: [],
      confidence: 0
    };
  }

  // P1: Search approved QAs first
  const approvedQAs = await searchDirectQA(
    supabase,
    embedding,
    domain,
    botAccess,
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
        domain: domain,
        chunkTable: 'qa_pairs',
        chunkQualityScore: qa.chunk_quality_score,
        questionTypeClassification: qa.question_type_classification
      })),
      confidence: highConfidenceQA[0].similarity_score
    };
  }

  // P2: Search RAG chunks if no approved QA match
  const ragChunks = await searchRAGChunks(
    supabase,
    embedding,
    domain,
    botAccess,
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

  // P3: No retrieval found, use LLM only
  return {
    retrieval_path: 'llm_only',
    sources: [],
    confidence: 0
  };
}

/**
 * Search direct QAs using RPC
 */
export async function searchDirectQA(
  supabase: ReturnType<typeof createClient>,
  embedding: number[],
  domain: string,
  botAccess: string[],
  maxAccessLevel: number,
  limit: number
): Promise<DirectQAResult[]> {
  const { data, error } = await supabase.rpc('search_direct_qa', {
    p_query_embedding: embedding,
    p_domain: domain,
    p_bot_access: botAccess,
    p_user_access_level: maxAccessLevel,
    p_limit: limit
  });

  if (error) {
    console.error('Error searching direct QA:', error);
    return [];
  }

  return data || [];
}

/**
 * Search RAG chunks using RPC
 */
export async function searchRAGChunks(
  supabase: ReturnType<typeof createClient>,
  embedding: number[],
  domain: string,
  botAccess: string[],
  maxAccessLevel: number,
  limit: number
): Promise<RAGChunkResult[]> {
  const { data, error } = await supabase.rpc('search_rag_chunks', {
    p_query_embedding: embedding,
    p_domain: domain,
    p_bot_access: botAccess,
    p_user_access_level: maxAccessLevel,
    p_limit: limit
  });

  if (error) {
    console.error('Error searching RAG chunks:', error);
    return [];
  }

  return data || [];
}

/**
 * Generate query embedding with Gemini
 */
export async function generateQueryEmbedding(
  text: string,
  apiKey?: string
): Promise<number[] | null> {
  const key = apiKey || process.env.GOOGLE_API_KEY_1;
  if (!key) {
    console.error('GOOGLE_API_KEY_1 is not set');
    return null;
  }

  return generateEmbedding(text, key, {
    taskType: 'RETRIEVAL_QUERY',
    outputDimensionality: 768
  });
}

/**
 * Re-rank sources based on relevance (simple scoring)
 */
export function rerankSources(
  sources: Array<{ content: string; source_reference: string; score: number }>,
  query: string
): Array<{ content: string; source_reference: string; score: number }> {
  return sources
    .map(source => ({
      ...source,
      final_score: source.score // Could add more sophisticated re-ranking here
    }))
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, 5); // Top 5 sources
}
