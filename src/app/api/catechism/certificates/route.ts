export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user certificates
    const { data: certificates, error } = await supabase
      .from('catechism_certificates')
      .select(`
        id,
        certificate_number,
        verification_code,
        pdf_r2_key,
        issued_at,
        stage_id,
        catechism_stages!left (
          slug,
          title,
          icon_slug,
          color_theme
        )
      `)
      .eq('user_id', user.user.id)
      .order('issued_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Count progress
    const { data: progress } = await supabase
      .from('catechism_progress')
      .select('module_id, status, catechism_modules!inner(stage_id, order_index)')
      .eq('user_id', user.user.id);

    // Count modules per stage
    const { data: stageModules } = await supabase
      .from('catechism_modules')
      .select('stage_id, id')
      .order('order_index');

    const totalPerStage: Record<string, number> = {};
    (stageModules || []).forEach(m => {
      totalPerStage[m.stage_id] = (totalPerStage[m.stage_id] || 0) + 1;
    });

    // Count completed per stage
    const completedPerStage: Record<string, number> = {};
    (progress || []).forEach(p => {
      if (p.status === 'completed') {
        const sid = (p as any).catechism_modules?.stage_id;
        if (sid) completedPerStage[sid] = (completedPerStage[sid] || 0) + 1;
      }
    });

    return NextResponse.json({
      data: {
        certificates: certificates || [],
        progress_summary: {
          total_per_stage: totalPerStage,
          completed_per_stage: completedPerStage,
          total_modules: stageModules?.length || 0,
          completed_modules: (progress || []).filter(p => p.status === 'completed').length,
        },
      },
      success: true,
    });
  } catch (error) {
    console.error('Server error in GET /api/catechism/certificates:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}