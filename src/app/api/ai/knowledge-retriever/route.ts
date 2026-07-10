/**
 * Knowledge Retriever API — v6 RAG Architecture (R2 Content Offload)
 * 
 * Menggantikan endpoint lama yang masih query theology_references & qa_knowledge_base
 * dengan RPC baru: search_direct_qa() dan search_rag_chunks() yang return R2 key + preview.
 * 
 * Full content hanya di-fetch dari R2 untuk top-K final.
 * 
 * Spesifikasi: rag_ai_r2_72.md §5, §6
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/ai/embedding';
import { hydrateTopKWithContent } from '@/lib/rag-content-fetcher';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { query, domain, bot_id, max_results = 5, fetch_full_content = false } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query harus diisi' }, { status: 400 });
    }

    // 1. Generate embedding untuk query
    const apiKey = process.env.GOOGLE_API_KEY_1 || '';
    const embedding = await generateEmbedding(query, apiKey, {
      taskType: 'RETRIEVAL_QUERY',
      outputDimensionality: 768,
    });

    if (!embedding) {
      return NextResponse.json({ error: 'Gagal generate embedding' }, { status: 500 });
    }

    // 2. Search direct QA (P1)
    const qaResult = await supabase.rpc('search_direct_qa', {
      p_query_embedding: embedding,
      p_domain: domain || 'public_info',
      p_bot_access: bot_id || 'bot_1',
      p_user_access_level: 0,
      p_limit: Math.min(max_results, 10),
    });

    // 3. Search RAG chunks (P2) — fallback jika QA tidak cukup
    let ragChunks: any[] = [];
    if (!qaResult.data || qaResult.data.length < 3) {
      const chunkResult = await supabase.rpc('search_rag_chunks', {
        p_query_embedding: embedding,
        p_domain: domain || 'public_info',
        p_bot_access: bot_id || 'bot_1',
        p_user_access_level: 0,
        p_limit: max_results,
      });

      if (chunkResult.data) {
        ragChunks = chunkResult.data;
      }
    }

    // 4. Gabungkan hasil QA + RAG
    const combinedSources = [
      ...(qaResult.data || []).map((qa: any) => ({
        id: qa.entry_id,
        r2Key: qa.answer_r2_key,
        contentPreview: qa.answer_preview,
        sourceReference: qa.source_reference || 'Q&A',
        score: qa.similarity_score,
        isApprovedQA: true,
        domain: domain || 'public_info',
        chunkTable: 'qa_pairs',
        chunkQualityScore: qa.chunk_quality_score,
        questionTypeClassification: qa.question_type_classification,
        categoryCode: qa.category_code,
        authorityLevel: qa.authority_level,
        source: 'qa_pair',
      })),
      ...ragChunks.map((chunk: any) => ({
        id: chunk.chunk_id,
        r2Key: chunk.content_r2_key,
        contentPreview: chunk.content_preview,
        sourceReference: chunk.source_reference,
        score: chunk.boosted_score || chunk.similarity_score,
        isApprovedQA: false,
        domain: chunk.domain,
        chunkTable: chunk.chunk_table,
        chunkQualityScore: chunk.chunk_quality_score,
        questionTypeClassification: chunk.question_type_classification,
        authorityLevel: chunk.authority_level,
        source: 'rag_chunk',
      })),
    ];

    // Sort by score descending
    combinedSources.sort((a: any, b: any) => b.score - a.score);

    // 5. Fetch full content dari R2 hanya jika diminta (opsional, untuk HIL)
    let finalResults = combinedSources.slice(0, max_results);

    if (fetch_full_content && finalResults.length > 0) {
      const hydrated = await hydrateTopKWithContent(
        finalResults.map((r: any) => ({
          chunkId: r.id,
          r2Key: r.r2Key,
          contentPreview: r.contentPreview,
          sourceReference: r.sourceReference,
          similarityScore: r.score,
          domain: r.domain,
          chunkTable: r.chunkTable,
          chunkQualityScore: r.chunkQualityScore,
          questionTypeClassification: r.questionTypeClassification,
          isApprovedQA: r.isApprovedQA,
        }))
      );

      finalResults = finalResults.map((r: any) => {
        const hydratedChunk = hydrated.find((h: any) => h.chunkId === r.id);
        return {
          ...r,
          fullContent: hydratedChunk?.fullContent || null,
        };
      });
    }

    // 6. Return results
    return NextResponse.json({
      success: true,
      data: finalResults,
      query,
      domain: domain || 'general',
      retrieval_path: qaResult.data && qaResult.data.length > 0 ? 'direct_qa' : 'rag',
      total_sources: combinedSources.length,
    });
  } catch (error) {
    console.error('Knowledge retriever error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}