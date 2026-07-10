import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserProfile } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/ai/knowledge-base/pending-tagging
// List Q&A dengan tagging_status = 'pending_theological_tagging'
// Hanya bisa diakses oleh user dengan access_level >= 9 (admin/teolog)
interface PendingTaggingItem {
  id: string;
  question_variations: string[];
  answer_preview: string;
  domain: string;
  category_code?: string;
  authority_level?: string;
  tagging_status: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  try {
    const user = await getCurrentUserProfile();
    
    // Auth check: hanya admin/teolog (access_level >= 9)
    if (!user || (user.access_layer ?? 0) < 9) {
      return NextResponse.json(
        { error: 'Forbidden — requires access_level >= 9' },
        { status: 403 }
      );
    }

    const supabase = createClient();

    // Query: ambil Q&A theology/catechism_module yang menunggu tagging
    const { data, error } = await supabase
      .from('qa_pairs')
      .select('id, question_variations, answer_preview, domain, category_code, authority_level, tagging_status, is_approved, created_at, updated_at')
      .eq('tagging_status', 'pending_theological_tagging')
      .in('domain', ['theology', 'catechism_module'])
      .order('updated_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching pending tagging:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending tagging items' },
        { status: 500 }
      );
    }

    const items: PendingTaggingItem[] = (data || []).map((row) => ({
      id: row.id,
      question_variations: row.question_variations || [],
      answer_preview: row.answer_preview || '',
      domain: row.domain,
      category_code: row.category_code,
      authority_level: row.authority_level,
      tagging_status: row.tagging_status,
      is_approved: row.is_approved,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({
      count: items.length,
      items,
    });

  } catch (error) {
    console.error('Error in GET /api/ai/knowledge-base/pending-tagging:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}