export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Registrasi: hanya field identitas dasar
    const { data: profile, error } = await serviceClient
      .from('profiles')
      .select('full_name, tanggal_lahir, tempat_lahir, jenis_kelamin')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[profile-data] profile error:', error, 'userId:', user.id);
      return NextResponse.json({ error: 'Gagal memuat profil' }, { status: 500 });
    }

    // Dari umat_staging: hanya field identitas dasar untuk konfirmasi
    const { data: umatData } = await serviceClient
      .from('umat_staging')
      .select('nama, nama_baptis, jenis_kelamin, tempat_tanggal_lahir, tanggal_lahir, hubungan_keluarga')
      .eq('nama', profile?.full_name)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ profile, umat_staging: umatData || null });
  } catch (error) {
    console.error('Profile data error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}