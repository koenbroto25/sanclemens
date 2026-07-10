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

    if (!adminProfile || adminProfile.access_layer < 5) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: ads, error } = await supabase
      .from('ads')
      .select('*')
      .eq('type', 'non-marketplace')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Gagal mengambil data iklan' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: ads });
  } catch (error) {
    console.error('Get ads error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    if (!adminProfile || adminProfile.access_layer < 5) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, content, image_url, link_url, start_date, end_date } = await request.json();

    const { data: ad, error } = await supabase
      .from('ads')
      .insert({
        title,
        content,
        image_url,
        link_url,
        start_date,
        end_date,
        type: 'non-marketplace',
        created_by: user.id,
        active: true,
      })
      .single();

    if (error) {
      console.error('Create ad error:', error);
      return NextResponse.json({ error: 'Gagal membuat iklan' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: ad });
  } catch (error) {
    console.error('Create ad error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}