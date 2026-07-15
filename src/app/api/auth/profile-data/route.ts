export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

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

    const { data: umatData } = await supabase
      .from('umat_staging')
      .select('nama, nama_baptis, jenis_kelamin, tempat_tanggal_lahir, tanggal_lahir, umur, alamat, hubungan_keluarga, status_perkawinan, pendidikan_terakhir, pekerjaan, keterampilan, kondisi_tubuh, medical_history, economic_details, sakramen_records')
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
