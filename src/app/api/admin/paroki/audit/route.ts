export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('access_layer')
      .eq('id', user.id)
      .single();

    if (!adminProfile || adminProfile.access_layer < 6) {
      return NextResponse.json({ error: 'Forbidden - Bendahara or above only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const periode = searchParams.get('periode');
    const status = searchParams.get('status');

    let query = supabase
      .from('audit_logs')
      .select('*, profiles(full_name, role)')
      .order('created_at', { ascending: false });

    if (periode) {
      query = query.gte('created_at', `${periode}-01`).lt('created_at', `${periode}-31`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: audits, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Gagal mengambil data audit' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: audits });
  } catch (error) {
    console.error('Get audit error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}