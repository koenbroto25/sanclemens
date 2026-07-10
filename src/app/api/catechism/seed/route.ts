export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has any catechism progress
    const { data: existingProgress, error: checkError } = await supabase
      .from('catechism_progress')
      .select('id')
      .eq('user_id', user.user.id)
      .limit(1);

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existingProgress && existingProgress.length > 0) {
      // Already seeded
      return NextResponse.json({ data: { already_seeded: true }, success: true });
    }

    // Find the first module (order_index = 0)
    const { data: firstModule } = await supabase
      .from('catechism_modules')
      .select('id')
      .eq('order_index', 0)
      .single();

    if (!firstModule) {
      return NextResponse.json({ error: 'No modules found. Run ingest pipeline first.' }, { status: 500 });
    }

    // Insert progress for first module (unlocked), others will be locked by default
    const { error: insertError } = await supabase
      .from('catechism_progress')
      .insert({
        user_id: user.user.id,
        module_id: firstModule.id,
        status: 'unlocked',
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: { seeded: true, first_module_id: firstModule.id },
      success: true,
    });

  } catch (error) {
    console.error('Server error in POST /api/catechism/seed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}