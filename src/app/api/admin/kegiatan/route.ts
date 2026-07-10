export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('kegiatan_paroki')
      .select('*, profiles(full_name)')
      .order('tanggal', { ascending: true })
      .order('jam_mulai', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Admin kegiatan list error:', error);
    return NextResponse.json({ error: 'Gagal memuat kegiatan' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { data, error } = await supabase
      .from('kegiatan_paroki')
      .insert({ ...body, created_by: user.id })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Admin kegiatan create error:', error);
    return NextResponse.json({ error: 'Gagal membuat kegiatan' }, { status: 500 });
  }
}