export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/auth/get-current-user';

interface SearchRequest {
  query: string;
  domain: string;
  bot_id: string;
  access_level: number;
  limit?: number;
  search_type?: 'direct_qa' | 'rag' | 'all'; // New in v6.0
}

interface SearchResult {
  content: string;
  source_reference: string;
  score: number;
  domain: string;
  document_code: string;
  chunk_quality_score: number;
  is_approved_qa?: boolean;
  qa_pair_id?: string;
}

// Generate embedding for query using Gemini
async function generateQueryEmbedding(text: string): Promise<number[] | null> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY_1;
    if (!apiKey) return null;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            parts: [{ text: text }]
          },
          taskType: 'RETRIEVAL_QUERY'
        })
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.embedding?.values || null;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

// Search direct QA using RPC (v6.0)
async function searchDirectQA(
  supabase: ReturnType<typeof createClient>,
  embedding: number[],
  domain: string,
  botAccess: string[],
  maxAccessLevel: number,
  limit: number = 5
) {
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

// Search RAG chunks using RPC (v6.0)
async function searchRAGChunks(
  supabase: ReturnType<typeof createClient>,
  embedding: number[],
  domain: string,
  botAccess: string[],
  maxAccessLevel: number,
  limit: number = 20
) {
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

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { query, domain, bot_id, access_level, limit = 20, search_type = 'all' } = body;

    // Validate input
    if (!query || !domain || !bot_id) {
      return NextResponse.json(
        { error: 'Missing required fields: query, domain, bot_id' },
        { status: 400 }
      );
    }

    // Get user session for access level check
    const user = await getCurrentUserProfile();
    const userAccessLevel = user?.access_layer ?? 0;

    // Use provided access_level or default to user's access level
    const maxAccessLevel = Math.min(access_level, userAccessLevel);

    // Get bot configuration from DB
    const supabase = createClient();
    const { data: botConfig, error: botConfigError } = await supabase
      .from('bot_configs')
      .select('bot_access, access_level_min')
      .eq('bot_id', bot_id)
      .single();

    if (botConfigError || !botConfig) {
      console.error('Error fetching bot config:', botConfigError?.message);
      return NextResponse.json(
        { error: `Failed to retrieve bot configuration for bot_id: ${bot_id}` },
        { status: 400 }
      );
    }

    const botAccess = botConfig.bot_access || [];

    // Check access level
    if (userAccessLevel < botConfig.access_level_min) {
      return NextResponse.json(
        { error: 'Insufficient access level for this bot' },
        { status: 403 }
      );
    }

    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(query);

    if (!queryEmbedding) {
      return NextResponse.json(
        { error: 'Failed to generate query embedding' },
        { status: 500 }
      );
    }

    let results: SearchResult[] = [];

    if (search_type === 'direct_qa' || search_type === 'all') {
      // Search approved QAs
      const directQAs = await searchDirectQA(
        supabase,
        queryEmbedding,
        domain,
        botAccess,
        maxAccessLevel,
        search_type === 'direct_qa' ? limit : 5
      );

      results.push(...directQAs.map((qa: any) => ({
        content: qa.answer_preview,
        r2_key: qa.answer_r2_key,
        source_reference: qa.source_reference || 'Approved Q&A',
        score: qa.similarity_score,
        domain: qa.domain || domain,
        document_code: qa.document_code || '',
        chunk_quality_score: qa.chunk_quality_score || 3,
        is_approved_qa: true,
        qa_pair_id: qa.qa_pair_id
      })));
    }

    if (search_type === 'rag' || search_type === 'all') {
      // Search RAG chunks (only if not already satisfied by direct QA)
      const ragLimit = search_type === 'rag' ? limit : (20 - results.length);
      if (ragLimit > 0) {
        const ragChunks = await searchRAGChunks(
          supabase,
          queryEmbedding,
          domain,
          botAccess,
          maxAccessLevel,
          ragLimit
        );

        results.push(...ragChunks.map((chunk: any) => ({
          content: chunk.content_preview,
          r2_key: chunk.content_r2_key,
          source_reference: chunk.source_reference,
          score: chunk.similarity_score,
          domain: chunk.domain || domain,
          document_code: chunk.document_code || '',
          chunk_quality_score: chunk.chunk_quality_score || 3,
          is_approved_qa: false
        })));
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Log search (async, don't block)
    if (user?.id) {
      supabase.from('ai_interaction_logs').insert({
        user_id: user.id,
        bot_id,
        query: `[SEARCH] ${query}`,
        domain,
        question_type: 'knowledge_base_search',
        sources_used: results.map(r => r.source_reference),
        confidence: results.length > 0 ? results[0].score : 0,
        retrieval_path: search_type === 'direct_qa' ? 'direct_qa' : 'rag',
        created_at: new Date().toISOString()
      }).then(({ error }) => { if (error) console.error('Failed to log search:', error); });
    }

    return NextResponse.json({
      chunks: results,
      total: results.length,
      search_type
    });

  } catch (error) {
    console.error('Error in /api/ai/knowledge-base/search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}