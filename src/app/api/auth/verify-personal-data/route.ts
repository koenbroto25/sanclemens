export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // SSR client untuk auth check
    const ssrClient = createClient();
    const { data: { user }, error: authError } = await ssrClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const body = await request.json();
    const { full_name, nama_baptis, tanggal_lahir, jenis_kelamin } = body;

    // Build update payload dari field yang diverifikasi user
    const updatePayload: any = {
      is_personal_data_verified: true,
      updated_at: new Date().toISOString(),
    };
    if (full_name !== undefined) updatePayload.full_name = full_name;
    if (nama_baptis !== undefined) updatePayload.nama_baptis = nama_baptis;
    if (tanggal_lahir !== undefined) updatePayload.tanggal_lahir = tanggal_lahir || null;
    if (jenis_kelamin !== undefined) updatePayload.jenis_kelamin = jenis_kelamin || null;

    // Jika ada data di umat_staging yang belum di-transfer, ambil dan transfer sekaligus
    const { data: stagingData } = await serviceClient
      .from('umat_staging')
      .select('id, nama_baptis, tempat_tanggal_lahir, tanggal_lahir, alamat, hubungan_keluarga, status_perkawinan, pendidikan_terakhir, pekerjaan, keterampilan, kondisi_tubuh')
      .eq('nama', full_name || '')
      .limit(1)
      .maybeSingle();

    if (stagingData) {
      // Transfer field non-kritis dari staging (tidak override field yang sudah diverifikasi user)
      if (!updatePayload.nama_baptis && stagingData.nama_baptis) {
        updatePayload.nama_baptis = stagingData.nama_baptis;
      }
      if (stagingData.tempat_tanggal_lahir) {
        updatePayload.tempat_lahir = stagingData.tempat_tanggal_lahir.split(',')[0]?.trim() || null;
      }
      if (stagingData.alamat) updatePayload.alamat_lengkap = stagingData.alamat;
      if (stagingData.status_perkawinan) updatePayload.status_perkawinan = stagingData.status_perkawinan;
      if (stagingData.pendidikan_terakhir) updatePayload.pendidikan_terakhir = stagingData.pendidikan_terakhir;
      if (stagingData.pekerjaan) updatePayload.pekerjaan = stagingData.pekerjaan;
      if (stagingData.keterampilan) updatePayload.keterampilan = stagingData.keterampilan;
      if (stagingData.kondisi_tubuh) updatePayload.kondisi_tubuh = stagingData.kondisi_tubuh;

      // Mark staging as registered
      await serviceClient
        .from('umat_staging')
        .update({ status: 'registered', registered_profile_id: user.id })
        .eq('id', stagingData.id);
    }

    const { error: updateError } = await serviceClient
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id);

    if (updateError) {
      console.error('[verify-personal-data] update error:', updateError);
      return NextResponse.json({ error: 'Gagal menyimpan verifikasi data pribadi' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Data pribadi terverifikasi' });
  } catch (error) {
    console.error('Verify personal data error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}