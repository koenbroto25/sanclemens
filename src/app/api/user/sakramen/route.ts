export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    const { data: sakramenList, error: sakramenError } = await supabase
      .from('sakramen_user')
      .select('*')
      .eq('user_id', profile.id)
      .order('tanggal_sakramen', { ascending: false });
    
    if (sakramenError) {
      console.error('Error fetching sakramen:', sakramenError);
      return NextResponse.json({ error: 'Failed to fetch sakramen' }, { status: 500 });
    }
    
    return NextResponse.json({ data: sakramenList || [] });
    
  } catch (error) {
    console.error('Error in GET /api/user/sakramen:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    const body = await request.json();
    const { jenis_sakramen, tanggal_sakramen, tempat_sakramen, nama_orang_tua_baptis, nama_penterjemah, nama_prelat, sertifikat_url } = body;
    
    if (!jenis_sakramen) {
      return NextResponse.json({ error: 'Jenis sakramen harus diisi' }, { status: 400 });
    }
    
    const { data: newSakramen, error: insertError } = await supabase
      .from('sakramen_user')
      .insert({
        user_id: profile.id,
        jenis_sakramen,
        tanggal_sakramen,
        tempat_sakramen,
        nama_orang_tua_baptis,
        nama_penterjemah,
        nama_prelat,
        sertifikat_url,
        created_by: profile.id,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating sakramen:', insertError);
      return NextResponse.json({ error: 'Failed to create sakramen' }, { status: 500 });
    }
    
    return NextResponse.json({ data: newSakramen }, { status: 201 });
    
  } catch (error) {
    console.error('Error in POST /api/user/sakramen:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}