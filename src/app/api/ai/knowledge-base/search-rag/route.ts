import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserProfile } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface SearchRAGRequest {
  query: string;
  domain: string;
  bot_access: string;
  user_access_level: number;
  limit?: number;
}

interface SearchRAGResponse {
  chunk_id: string;
  content_r2_key: string;
  content_preview: string;
  source_reference: string;
  similarity_score: number;
  boosted_score: number;
  authority_level?: string;
  domain: string;
  chunk_table: string;
  chunk_quality_score: number;
  question_type_classification: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRAGRequest = await request.json();
    const { query, domain, bot_access, user_access_level, limit = 20 } = body;

    // Validate input
    if (!query || !domain || !bot_access) {
      return NextResponse.json(
        { error: 'Missing required fields: query, domain, bot_access' },
        { status: 400 }
      );
    }

    // Get user session for access level check
    const user = await getCurrentUserProfile();
    const maxAccessLevel = Math.min(user_access_level, user?.access_layer ?? 0);

    // Generate query embedding
    const apiKey = process.env.GOOGLE_API_KEY_1;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Embedding service not configured' },
        { status: 500 }
      );
    }

    const embeddingResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            parts: [{ text: query }]
          },
          taskType: 'RETRIEVAL_QUERY'
        })
      }
    );

    if (!embeddingResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to generate query embedding' },
        { status: 500 }
      );
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.embedding?.values;

    if (!queryEmbedding) {
      return NextResponse.json(
        { error: 'Failed to extract embedding from response' },
        { status: 500 }
      );
    }

    // Call search_rag_chunks RPC
    const supabase = createClient();
    const { data, error } = await supabase.rpc('search_rag_chunks', {
      p_query_embedding: queryEmbedding,
      p_domain: domain,
      p_bot_access: bot_access,
      p_user_access_level: maxAccessLevel,
      p_limit: limit
    });

    if (error) {
      console.error('Error in search_rag_chunks:', error);
      return NextResponse.json(
        { error: 'Failed to search RAG chunks' },
        { status: 500 }
      );
    }

    // Transform to ensure consistent field names
    const transformedData = (data || []).map((item: any) => ({
      chunk_id: item.chunk_id,
      content_r2_key: item.content_r2_key,
      content_preview: item.content_preview,
      source_reference: item.source_reference,
      similarity_score: item.similarity_score,
      boosted_score: item.boosted_score,
      authority_level: item.authority_level,
      domain: item.domain,
      chunk_table: item.chunk_table,
      chunk_quality_score: item.chunk_quality_score,
      question_type_classification: item.question_type_classification,
    }));

    return NextResponse.json(transformedData);

  } catch (error) {
    console.error('Error in /api/ai/knowledge-base/search-rag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}