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
    
    const { data: charityList, error: charityError } = await supabase
      .from('charity_services')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    
    if (charityError) {
      console.error('Error fetching charity services:', charityError);
      return NextResponse.json({ error: 'Failed to fetch charity services' }, { status: 500 });
    }
    
    return NextResponse.json({ data: charityList || [] });
    
  } catch (error) {
    console.error('Error in GET /api/user/charity:', error);
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
    const { kategori_jasa, deskripsi_jasa, spesialisasi, syarat_penerima, cara_kontak, waktu_tersedia, max_recipients_perbulan } = body;
    
    if (!kategori_jasa || !deskripsi_jasa) {
      return NextResponse.json({ error: 'Kategori jasa dan deskripsi harus diisi' }, { status: 400 });
    }
    
    const { data: newCharity, error: insertError } = await supabase
      .from('charity_services')
      .insert({
        user_id: profile.id,
        kategori_jasa,
        deskripsi_jasa,
        spesialisasi: spesialisasi || [],
        syarat_penerima,
        cara_kontak,
        waktu_tersedia,
        max_recipients_perbulan: max_recipients_perbulan || 10,
        is_active: true,
        is_verified: false,  // Perlu verifikasi admin
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating charity service:', insertError);
      return NextResponse.json({ error: 'Failed to create charity service' }, { status: 500 });
    }
    
    return NextResponse.json({ data: newCharity }, { status: 201 });
    
  } catch (error) {
    console.error('Error in POST /api/user/charity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
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
    
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Charity service ID is required' }, { status: 400 });
    }
    
    // Verify ownership
    const { data: existingCharity } = await supabase
      .from('charity_services')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (!existingCharity || existingCharity.user_id !== profile.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { data: updatedCharity, error: updateError } = await supabase
      .from('charity_services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating charity service:', updateError);
      return NextResponse.json({ error: 'Failed to update charity service' }, { status: 500 });
    }
    
    return NextResponse.json({ data: updatedCharity });
    
  } catch (error) {
    console.error('Error in PUT /api/user/charity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Charity service ID is required' }, { status: 400 });
    }
    
    // Verify ownership
    const { data: existingCharity } = await supabase
      .from('charity_services')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (!existingCharity || existingCharity.user_id !== profile.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { error: deleteError } = await supabase
      .from('charity_services')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting charity service:', deleteError);
      return NextResponse.json({ error: 'Failed to delete charity service' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error in DELETE /api/user/charity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}