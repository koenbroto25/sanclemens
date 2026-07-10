export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAccessLayer, roleHasAccess } from '@/lib/middleware-helpers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('access_layer, lingkungan_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Build query based on access layer
    // Layer 9 (Pastor), Layer 8 (Wakil DPP), Layer 7 (Komsos) - can view all
    // Layer 4 (KL) - can view their lingkungan only
    let query = supabase.from('data_gakin').select('*, families(*), gakin_approvals(*)');
    
    if (profile.access_layer >= 8) {
      // Pastor, Wakil DPP, Komsos - can see all
      query = query.order('created_at', { ascending: false });
    } else if (profile.access_layer === 4) {
      // KL - can see their lingkungan only
      const { data: families } = await supabase
        .from('families')
        .select('id')
        .eq('lingkungan_id', profile.lingkungan_id);
      
      const familyIds = families?.map(f => f.id) || [];
      query = query.in('family_id', familyIds);
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: gakinData, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Gagal mengambil data GAKIN' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: gakinData });
  } catch (error) {
    console.error('Get GAKIN error:', error);
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

    // Get user profile to check access layer
    const { data: profile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('access_layer')
      .eq('id', user.id)
      .single();

    if (profileFetchError || !profile) {
        console.error('Error fetching user profile:', profileFetchError);
        return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 403 });
    }

    // Hanya Ketua Lingkungan (access_layer 4) yang dapat mengajukan data GAKIN
    if (profile.access_layer !== 4) {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Ketua Lingkungan yang dapat mengajukan data GAKIN.' }, { status: 403 });
    }

    const { family_id, penghasilan_per_bulan, jumlah_tanggungan, kondisi_rumah, catatan_seksos, foto_kondisi } = await request.json();

    // Create GAKIN proposal
    const { data: gakin, error } = await supabase
      .from('data_gakin')
      .insert({
        family_id,
        penghasilan_per_bulan,
        jumlah_tanggungan,
        kondisi_rumah,
        catatan_seksos,
        foto_kondisi,
        status: 'proposed',
        proposed_by: user.id,
      })
      .single();

    if (error) {
      console.error('Create GAKIN error:', error);
      return NextResponse.json({ error: 'Gagal mengajukan GAKIN' }, { status: 500 });
    }

    // Notify 4 approvers: Pastor + Wakil DPP + Komsos + KL
    // Notification to approvers via Fonnte

    return NextResponse.json({
      success: true,
      message: 'Pengajuan GAKIN berhasil. Menunggu persetujuan 3 dari 4 approver.',
      data: gakin,
    });
  } catch (error) {
    console.error('Submit GAKIN error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}