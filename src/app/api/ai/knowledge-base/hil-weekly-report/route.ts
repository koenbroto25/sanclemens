import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserProfile } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/ai/knowledge-base/hil-weekly-report
// Laporan mingguan HIL: hitung pending_theological_tagging + statistik lain
// Hanya bisa diakses oleh user dengan access_level >= 9 (admin/teolog)
export async function GET() {
  try {
    const user = await getCurrentUserProfile();
    
    if (!user || (user.access_layer ?? 0) < 9) {
      return NextResponse.json(
        { error: 'Forbidden — requires access_level >= 9' },
        { status: 403 }
      );
    }

    const supabase = createClient();

    // 1. Hitung pending_theological_tagging (untuk tab "Perlu Tag Otoritas")
    const { count: pendingCount, error: pendingError } = await supabase
      .from('qa_pairs')
      .select('*', { count: 'exact', head: true })
      .eq('tagging_status', 'pending_theological_tagging')
      .in('domain', ['theology', 'catechism_module']);

    if (pendingError) {
      console.error('Error counting pending tagging:', pendingError);
    }

    // 2. Hitung verified (sudah di-tag dan approved)
    const { count: verifiedCount, error: verifiedError } = await supabase
      .from('qa_pairs')
      .select('*', { count: 'exact', head: true })
      .eq('tagging_status', 'verified')
      .in('domain', ['theology', 'catechism_module']);

    if (verifiedError) {
      console.error('Error counting verified tagging:', verifiedError);
    }

    // 3. Hitung total Q&A theology/catechism_module
    const { count: totalTheologicalQA, error: totalError } = await supabase
      .from('qa_pairs')
      .select('*', { count: 'exact', head: true })
      .in('domain', ['theology', 'catechism_module']);

    if (totalError) {
      console.error('Error counting total theological QA:', totalError);
    }

    // 4. Statistik ai_knowledge_base per status
    const { data: kbStats, error: kbError } = await supabase
      .from('ai_knowledge_base')
      .select('status, content_type')
      .in('content_type', ['rag_chunk', 'qa_pair']);

    let needsReview = 0;
    let approved = 0;
    let total = 0;

    if (kbStats) {
      for (const row of kbStats) {
        total++;
        if (row.status === 'approved') approved++;
        if (row.status === 'needs_review') needsReview++;
      }
    }

    // 5. Statistik interaksi 7 hari terakhir
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: weeklyInteractions, error: interactionError } = await supabase
      .from('ai_interaction_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    if (interactionError) {
      console.error('Error counting weekly interactions:', interactionError);
    }

    // 6. Breakdown interaksi per bot (7 hari terakhir)
    const { data: botInteractions, error: botError } = await supabase
      .from('ai_interaction_logs')
      .select('bot_id, retrieval_path')
      .gte('created_at', sevenDaysAgo.toISOString());

    const botStats: Record<string, { total: number; by_path: Record<string, number> }> = {};
    
    if (botInteractions) {
      for (const row of botInteractions) {
        if (!botStats[row.bot_id]) {
          botStats[row.bot_id] = { total: 0, by_path: {} };
        }
        botStats[row.bot_id].total++;
        botStats[row.bot_id].by_path[row.retrieval_path] = (botStats[row.bot_id].by_path[row.retrieval_path] || 0) + 1;
      }
    }

    return NextResponse.json({
      report_date: new Date().toISOString(),
      period: '7_days',
      theological_tagging: {
        pending_theological_tagging: pendingCount || 0,
        verified: verifiedCount || 0,
        total_theological_qa: totalTheologicalQA || 0,
        completion_rate: totalTheologicalQA && verifiedCount 
          ? `${((verifiedCount / totalTheologicalQA) * 100).toFixed(1)}%` 
          : 'N/A',
      },
      knowledge_base: {
        total,
        approved,
        needsReview,
        approval_rate: total ? `${((approved / total) * 100).toFixed(1)}%` : 'N/A',
      },
      interactions: {
        weekly_total: weeklyInteractions || 0,
        by_bot: botStats,
      },
    });

  } catch (error) {
    console.error('Error in GET /api/ai/knowledge-base/hil-weekly-report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}