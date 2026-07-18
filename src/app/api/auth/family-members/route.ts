export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { familyId } = await request.json();
    if (!familyId) {
      return NextResponse.json({ error: 'Family ID harus diisi' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Ambil anggota dari umat_staging berdasarkan keluarga_id
    const { data: stagingMembers, error: stagingError } = await supabase
      .from('umat_staging')
      .select('id, nama, nama_baptis, jenis_kelamin, hubungan_keluarga, tanggal_lahir, registered_profile_id')
      .eq('keluarga_id', familyId)
      .order('hubungan_keluarga', { ascending: true });

    if (stagingError) {
      console.error('Failed to fetch staging members:', stagingError);
      return NextResponse.json({ error: 'Gagal mengambil data anggota keluarga' }, { status: 500 });
    }

    // Juga ambil dari anggota_keluarga jika sudah ada
    const { data: registeredMembers } = await supabase
      .from('anggota_keluarga')
      .select('id, profile_id, hubungan, profiles:profile_id(id, full_name, phone, role, status)')
      .eq('keluarga_id', familyId);

    // Merge: prioritas data dari staging, tambahkan info registered jika ada
    const members = (stagingMembers || []).map(s => ({
      id: s.id,
      staging_id: s.id,
      nama: s.nama,
      nama_baptis: s.nama_baptis,
      jenis_kelamin: s.jenis_kelamin,
      hubungan: s.hubungan_keluarga,
      tanggal_lahir: s.tanggal_lahir,
      registered_profile_id: s.registered_profile_id,
      is_registered: !!s.registered_profile_id,
    }));

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Family members error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}