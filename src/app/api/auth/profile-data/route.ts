export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, nik, tanggal_lahir, tempat_lahir, alamat_lengkap, jenis_kelamin, status_perkawinan, agama')
      .eq('id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Gagal memuat profil' }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile data error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}