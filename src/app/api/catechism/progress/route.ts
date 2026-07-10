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

    // Fetch all progress for user
    const { data: progress, error } = await supabase
      .from('catechism_progress')
      .select('*')
      .eq('user_id', user.user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build a map of module_id Ã¢â€ â€™ progress
    const progressMap: Record<string, any> = {};
    if (progress) {
      progress.forEach(p => { progressMap[p.module_id] = p; });
    }

    return NextResponse.json({ data: progressMap, success: true });
  } catch (error) {
    console.error('Server error in GET /api/catechism/progress:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { module_slug, scroll_pct } = body;

    if (!module_slug || scroll_pct === undefined) {
      return NextResponse.json({ error: 'module_slug and scroll_pct required' }, { status: 400 });
    }

    // Find module id
    const { data: mod } = await supabase
      .from('catechism_modules')
      .select('id, order_index')
      .eq('slug', module_slug)
      .single();

    if (!mod) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Clamp scroll_pct
    const clampedPct = Math.min(100, Math.max(0, Math.round(scroll_pct)));

    // Check if progress record exists
    const { data: existing } = await supabase
      .from('catechism_progress')
      .select('id, status')
      .eq('user_id', user.user.id)
      .eq('module_id', mod.id)
      .single();

    if (existing) {
      // Update
      const updates: any = { scroll_progress_pct: clampedPct, updated_at: new Date().toISOString() };
      
      // If first time reading, set in_progress
      if (existing.status === 'unlocked' || existing.status === 'locked') {
        updates.status = 'in_progress';
        updates.started_at = new Date().toISOString();
      }

      // If scroll >= 90% and not yet completed, mark as completed
      if (clampedPct >= 90 && existing.status !== 'completed') {
        // Only complete if quiz is passed (or quiz not available for this module)
        const { count: quizCount } = await supabase
          .from('catechism_quizzes')
          .select('id', { count: 'exact', head: true })
          .eq('module_id', mod.id)
          .eq('is_published', true);

        const quizExists = (quizCount || 0) > 0;

        if (!quizExists) {
          // No quiz for this module, complete directly
          updates.status = 'completed';
          updates.completed_at = new Date().toISOString();
          updates.quiz_passed = true;
        }
        // If quiz exists, completion is handled by quiz submission
      }

      const { error } = await supabase
        .from('catechism_progress')
        .update(updates)
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insert new progress
      const { error } = await supabase
        .from('catechism_progress')
        .insert({
          user_id: user.user.id,
          module_id: mod.id,
          status: 'in_progress',
          scroll_progress_pct: clampedPct,
          started_at: new Date().toISOString(),
        });

      if (error) throw error;
    }

    return NextResponse.json({ success: true, scroll_progress_pct: clampedPct });
  } catch (error) {
    console.error('Server error in POST /api/catechism/progress:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}