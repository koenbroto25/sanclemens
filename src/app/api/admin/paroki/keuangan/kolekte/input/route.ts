export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('access_layer, role')
      .eq('id', user.id)
      .single();

    if (!adminProfile || adminProfile.access_layer < 6) {
      return NextResponse.json({ error: 'Forbidden - Bendahara only' }, { status: 403 });
    }

    const { tanggal, lingkungan_id, petik_lain, kolase_putih, kolase_berwarna, total } = await request.json();

    // Validate total
    const calculatedTotal = (petik_lain || 0) + (kolase_putih || 0) + (kolase_berwarna || 0);
    if (Math.abs(calculatedTotal - (total || 0)) > 1) {
      return NextResponse.json({ error: 'Total tidak sesuai dengan rincian' }, { status: 400 });
    }

    const { data: kolekte, error } = await supabase
      .from('kolekte')
      .insert({
        tanggal,
        lingkungan_id,
        petik_lain: petik_lain || 0,
        kolase_putih: kolase_putih || 0,
        kolase_berwarna: kolase_berwarna || 0,
        total: calculatedTotal,
        recorded_by: user.id,
        verified: false,
      })
      .single();

    if (error) {
      console.error('Kolekte error:', error);
      return NextResponse.json({ error: 'Gagal input kolekte' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Kolekte berhasil diinput',
      data: kolekte,
    });
  } catch (error) {
    console.error('Kolekte error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}