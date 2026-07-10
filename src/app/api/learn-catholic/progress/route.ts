export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: progress, error } = await supabase
      .from('user_learning_progress')
      .select('*, learning_modules(id, title, module_code)')
      .eq('user_id', user.user.id);

    if (error) {
      console.error('Error fetching user learning progress:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: progress, success: true });

  } catch (error) {
    console.error('Server error in GET /api/learn-catholic/progress:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { module_id, status, quiz_score, certificate_url } = await request.json();

    if (!module_id || !status) {
      return NextResponse.json({ error: 'Module ID and status are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_learning_progress')
      .upsert(
        {
          user_id: user.user.id,
          module_id,
          status,
          started_at: status === 'in_progress' ? new Date().toISOString() : undefined,
          completed_at: status === 'completed' || status === 'certified' ? new Date().toISOString() : undefined,
          quiz_score,
          certificate_url,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,module_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating learning progress:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true });

  } catch (error) {
    console.error('Server error in POST /api/learn-catholic/progress:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}