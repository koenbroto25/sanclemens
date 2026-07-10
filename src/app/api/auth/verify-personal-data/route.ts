export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const body = await request.json();
    const {
      full_name,
      tanggal_lahir,
      alamat_lengkap,
      tempat_lahir,
      status_perkawinan,
      agama,
      nik,
      jenis_kelamin,
    } = body;

    // Build update payload from provided fields
    const updatePayload: any = {};
    if (full_name !== undefined) updatePayload.full_name = full_name;
    if (tanggal_lahir !== undefined) updatePayload.tanggal_lahir = tanggal_lahir || null;
    if (alamat_lengkap !== undefined) updatePayload.alamat_lengkap = alamat_lengkap || null;
    if (tempat_lahir !== undefined) updatePayload.tempat_lahir = tempat_lahir || null;
    if (status_perkawinan !== undefined) updatePayload.status_perkawinan = status_perkawinan || null;
    if (agama !== undefined) updatePayload.agama = agama || null;
    if (nik !== undefined) updatePayload.nik = nik || null;
    if (jenis_kelamin !== undefined) updatePayload.jenis_kelamin = jenis_kelamin || null;

    updatePayload.is_personal_data_verified = true;

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to verify personal data:', updateError);
      return NextResponse.json({ error: 'Gagal menyimpan verifikasi data pribadi' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Data pribadi terverifikasi' });
  } catch (error) {
    console.error('Verify personal data error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}