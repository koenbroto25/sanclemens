/**
 * Full Content Endpoint — Fetch teks lengkap dari R2 untuk dashboard HIL reviewer
 * HANYA bisa dipanggil oleh admin/teolog (access_level_min >= 9)
 * Spesifikasi: rag_ai_r2_72.md §9.4
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchContentFromR2 } from '@/lib/r2-client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // 1. Auth check — pastikan user adalah admin/teolog
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('access_layer, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
    }

    // Hanya admin/teolog dengan access_layer >= 9 yang boleh akses full content
    if (profile.access_layer < 9) {
      return NextResponse.json(
        { error: 'Access denied. Required access_layer >= 9.' },
        { status: 403 }
      );
    }

    // 2. Cari row di ai_knowledge_base atau tabel chunk langsung
    const { id } = params;

    // Coba cari di ai_knowledge_base dulu
    const { data: akb, error: akbError } = await supabase
      .from('ai_knowledge_base')
      .select('chunk_id, qa_pair_id, chunk_table_ref, content_type')
      .eq('id', id)
      .single();

    if (akbError || !akb) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // 3. Dapatkan r2_key dari tabel chunk/qa_pairs
    let r2Key: string | null = null;
    let sourceTable: string | null = null;

    if (akb.content_type === 'qa_pair' && akb.qa_pair_id) {
      const { data } = await supabase
        .from('qa_pairs')
        .select('answer_r2_key')
        .eq('id', akb.qa_pair_id)
        .single();
      if (data) {
        r2Key = data.answer_r2_key;
        sourceTable = 'qa_pairs';
      }
    } else if (akb.chunk_table_ref && akb.chunk_id) {
      const { data } = await supabase
        .from(akb.chunk_table_ref)
        .select('content_r2_key')
        .eq('id', akb.chunk_id)
        .single();
      if (data) {
        r2Key = data.content_r2_key;
        sourceTable = akb.chunk_table_ref;
      }
    }

    if (!r2Key) {
      return NextResponse.json(
        { error: 'R2 key not found for this entry' },
        { status: 404 }
      );
    }

    // 4. Fetch full content dari R2
    const fullContent = await fetchContentFromR2(r2Key);

    if (fullContent === null) {
      return NextResponse.json(
        { error: 'Content not found in R2 (orphan object)' },
        { status: 404 }
      );
    }

    // 5. Log audit untuk tracking siapa yang akses
    try {
      await supabase.from('ai_interaction_logs').insert({
        user_id: user.id,
        bot_id: 'system',
        query: `full-content:${id}`,
        retrieval_path: 'tool_use',
        confidence_score: 1.0,
        was_redirected: false,
        was_refused: false,
        retrieval_context: {
          action: 'view_full_content',
          akb_id: id,
          r2_key: r2Key,
          source_table: sourceTable,
        },
      });
    } catch (logErr) {
      // Non-critical — jangan gagalkan response
      console.warn('[FullContent] Failed to log access:', logErr);
    }

    // 6. Return full content
    return NextResponse.json({
      id,
      r2Key,
      sourceTable,
      fullContent,
      characterCount: fullContent.length,
    });
  } catch (error) {
    console.error('[FullContent] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}