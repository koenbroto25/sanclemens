export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    const isAuthenticated = !!user.user;

    // Fetch all stages with modules
    const { data: stages, error } = await supabase
      .from('catechism_stages')
      .select(`
        id,
        slug,
        order_index,
        title,
        subtitle,
        description,
        icon_slug,
        color_theme,
        saint_patron,
        saint_patron_medal,
        catechism_modules (
          id,
          slug,
          code,
          title,
          order_index,
          content_preview,
          opening_quote_text,
          opening_quote_source,
          estimated_minutes,
          is_published
        )
      `)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching catechism stages:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If authenticated, fetch user progress
    let progressMap: Record<string, string> = {};
    if (isAuthenticated) {
      const moduleIds = stages?.flatMap(s => s.catechism_modules?.map(m => m.id) || []) || [];
      if (moduleIds.length > 0) {
        const { data: progress } = await supabase
          .from('catechism_progress')
          .select('module_id, status')
          .eq('user_id', user.user.id)
          .in('module_id', moduleIds);
        
        if (progress) {
          progress.forEach(p => { progressMap[p.module_id] = p.status; });
        }
      }
    }

    // Attach progress to modules
    const stagesWithProgress = (stages || []).map(stage => ({
      ...stage,
      catechism_modules: (stage.catechism_modules || [])
        .filter(m => m.is_published || isAuthenticated)
        .map(m => ({
          ...m,
          user_status: progressMap[m.id] || (isAuthenticated ? 'locked' : null),
        }))
        .sort((a, b) => a.order_index - b.order_index),
    }));

    return NextResponse.json({ data: stagesWithProgress, success: true });
  } catch (error) {
    console.error('Server error in GET /api/catechism/stages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}