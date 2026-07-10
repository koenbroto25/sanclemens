import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserProfile } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface PendingTaggingUpdateRequest {
  category_code: string;
  authority_level: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserProfile();
    
    if (!user || (user.access_layer ?? 0) < 9) {
      return NextResponse.json(
        { error: 'Forbidden — requires access_level >= 9' },
        { status: 403 }
      );
    }

    const body: PendingTaggingUpdateRequest = await request.json();

    if (!body.category_code || !body.authority_level) {
      return NextResponse.json(
        { error: 'category_code and authority_level are required' },
        { status: 400 }
      );
    }

    const validAuthorityLevels = ['highest', 'high', 'medium', 'reference', 'devotional'];
    if (!validAuthorityLevels.includes(body.authority_level)) {
      return NextResponse.json(
        { error: `Invalid authority_level. Must be one of: ${validAuthorityLevels.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('qa_pairs')
      .update({
        category_code: body.category_code,
        authority_level: body.authority_level,
        is_approved: true,
        tagging_status: 'verified',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('tagging_status', 'pending_theological_tagging')
      .in('domain', ['theology', 'catechism_module'])
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating pending tagging:', error);
      return NextResponse.json(
        { error: 'Failed to update tagging — item not found or already processed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tagging berhasil disimpan — Q&A kini sudah di-approve',
      data: {
        id: data.id,
        category_code: data.category_code,
        authority_level: data.authority_level,
        is_approved: data.is_approved,
        tagging_status: data.tagging_status,
      },
    });

  } catch (error) {
    console.error('Error in PATCH /api/ai/knowledge-base/pending-tagging/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}