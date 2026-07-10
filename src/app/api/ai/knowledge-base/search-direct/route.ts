import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserProfile } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface SearchDirectRequest {
  query: string;
  domain: string;
  bot_access: string;
  user_access_level: number;
  limit?: number;
}

interface SearchDirectResponse {
  qa_pair_id: string;
  answer_r2_key: string;
  answer_preview: string;
  source_reference: string;
  similarity_score: number;
  chunk_quality_score: number;
  question_type_classification: string;
  category_code?: string;
  authority_level?: string;
  is_approved: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchDirectRequest = await request.json();
    const { query, domain, bot_access, user_access_level, limit = 5 } = body;

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

    // Call search_direct_qa RPC
    const supabase = createClient();
    const { data, error } = await supabase.rpc('search_direct_qa', {
      p_query_embedding: queryEmbedding,
      p_domain: domain,
      p_bot_access: bot_access,
      p_user_access_level: maxAccessLevel,
      p_limit: limit
    });

    if (error) {
      console.error('Error in search_direct_qa:', error);
      return NextResponse.json(
        { error: 'Failed to search direct QA' },
        { status: 500 }
      );
    }

    // Transform to ensure consistent field names
    const transformedData = (data || []).map((item: any) => ({
      qa_pair_id: item.entry_id || item.qa_pair_id,
      answer_r2_key: item.answer_r2_key,
      answer_preview: item.answer_preview,
      source_reference: item.source_reference,
      similarity_score: item.similarity_score,
      chunk_quality_score: item.chunk_quality_score,
      question_type_classification: item.question_type_classification,
      category_code: item.category_code,
      authority_level: item.authority_level,
      is_approved: item.is_approved,
    }));

    return NextResponse.json(transformedData);

  } catch (error) {
    console.error('Error in /api/ai/knowledge-base/search-direct:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}