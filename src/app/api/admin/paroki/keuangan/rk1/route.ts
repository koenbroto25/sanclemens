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
      return NextResponse.json({ error: 'Forbidden - Bendahara only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const periode = searchParams.get('periode'); // e.g., "2026-06"

    let query = supabase
      .from('keuangan_rk1')
      .select('*')
      .order('tanggal', { ascending: false });

    if (periode) {
      query = query.like('periode', `%${periode}%`);
    }

    const { data: laporan, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Gagal mengambil laporan RK1' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: laporan });
  } catch (error) {
    console.error('Get RK1 error:', error);
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

    if (!adminProfile || adminProfile.access_layer < 6) {
      return NextResponse.json({ error: 'Forbidden - Bendahara only' }, { status: 403 });
    }

    const { tanggal, kategori, deskripsi, pemasukan, pengeluaran, verifikasi } = await request.json();

    const { data: laporan, error } = await supabase
      .from('keuangan_rk1')
      .insert({
        tanggal,
        kategori,
        deskripsi,
        pemasukan: pemasukan || 0,
        pengeluaran: pengeluaran || 0,
        verifikasi: verifikasi || false,
        created_by: user.id,
      })
      .single();

    if (error) {
      console.error('Create RK1 error:', error);
      return NextResponse.json({ error: 'Gagal membuat laporan RK1' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Laporan RK1 berhasil dibuat',
      data: laporan,
    });
  } catch (error) {
    console.error('Create RK1 error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}