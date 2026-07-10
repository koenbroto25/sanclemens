import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError?.message);
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('access_layer')
      .eq('id', user.user.id)
      .single();
    if (profileError || !profile || profile.access_layer < 9) {
      console.error('Authorization error:', profileError?.message);
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }
    // Fetch data from admin views
    const { data: contentChecklist, error: ccError } = await supabase
      .from('admin_content_checklist')
      .select('*');
    const { data: botContentSummary, error: bcsError } = await supabase
      .from('admin_bot_content_summary')
      .select('*');
    const { data: chunksChecklist, error: chkError } = await supabase
      .from('admin_chunks_checklist')
      .select('*');

    const { data: orphanQa, error: oqError } = await supabase
      .from('admin_orphan_qa')
      .select('*');
    const { data: uploadProgress, error: upError } = await supabase
      .from('admin_upload_progress')
      .select('*')
      .single();
    if (ccError || bcsError || chkError || oqError || upError) {
      console.error('Error fetching admin data:', ccError || bcsError || chkError || oqError ||upError);
      return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 });
    }
    return NextResponse.json({
      contentChecklist,
      botContentSummary,
      chunksChecklist,
      orphanQa,
      uploadProgress,
    });
  } catch (error) {
    console.error('Unexpected error in QA Checklist API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}