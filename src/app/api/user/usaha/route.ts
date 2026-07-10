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
    
    const { data: usahaList, error: usahaError } = await supabase
      .from('usaha_umat')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    
    if (usahaError) {
      console.error('Error fetching usaha:', usahaError);
      return NextResponse.json({ error: 'Failed to fetch usaha' }, { status: 500 });
    }
    
    return NextResponse.json({ data: usahaList || [] });
    
  } catch (error) {
    console.error('Error in GET /api/user/usaha:', error);
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
    const { nama_usaha, kategori_usaha, deskripsi, alamat_usaha, koordinat_lat, koordinat_lng, no_wa, jam_operasional, can_deliver, service_radius_km, is_charity_friendly, charity_discount_percentage } = body;
    
    if (!nama_usaha || !kategori_usaha) {
      return NextResponse.json({ error: 'Nama usaha dan kategori harus diisi' }, { status: 400 });
    }
    
    const { data: newUsaha, error: insertError } = await supabase
      .from('usaha_umat')
      .insert({
        user_id: profile.id,
        nama_usaha,
        kategori_usaha,
        deskripsi,
        alamat_usaha,
        koordinat_lat,
        koordinat_lng,
        no_wa,
        jam_operasional,
        can_deliver: can_deliver || false,
        service_radius_km: service_radius_km || 5,
        is_charity_friendly: is_charity_friendly || false,
        charity_discount_percentage: charity_discount_percentage || 0,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating usaha:', insertError);
      return NextResponse.json({ error: 'Failed to create usaha' }, { status: 500 });
    }
    
    return NextResponse.json({ data: newUsaha }, { status: 201 });
    
  } catch (error) {
    console.error('Error in POST /api/user/usaha:', error);
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
      return NextResponse.json({ error: 'Usaha ID is required' }, { status: 400 });
    }
    
    // Verify ownership
    const { data: existingUsaha } = await supabase
      .from('usaha_umat')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (!existingUsaha || existingUsaha.user_id !== profile.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { data: updatedUsaha, error: updateError } = await supabase
      .from('usaha_umat')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating usaha:', updateError);
      return NextResponse.json({ error: 'Failed to update usaha' }, { status: 500 });
    }
    
    return NextResponse.json({ data: updatedUsaha });
    
  } catch (error) {
    console.error('Error in PUT /api/user/usaha:', error);
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
      return NextResponse.json({ error: 'Usaha ID is required' }, { status: 400 });
    }
    
    // Verify ownership
    const { data: existingUsaha } = await supabase
      .from('usaha_umat')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (!existingUsaha || existingUsaha.user_id !== profile.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { error: deleteError } = await supabase
      .from('usaha_umat')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting usaha:', deleteError);
      return NextResponse.json({ error: 'Failed to delete usaha' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error in DELETE /api/user/usaha:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}