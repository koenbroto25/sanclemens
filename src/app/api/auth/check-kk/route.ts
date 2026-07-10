export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Accept both nomor_kk (API) and nomor_kk_gereja (frontend payload)
    const body = await request.json();
    const nomor_kk = body.nomor_kk || body.nomor_kk_gereja;
    const nama_lengkap = body.nama_lengkap;

    // If no KK provided, search by name instead
    if (!nomor_kk) {
      const supabase = createClient();
      
      // Search by name with fuzzy matching using pg_trgm
      const { data: byName, error: nameError } = await supabase
        .from('umat_staging')
        .select(`
          id, nama, nama_baptis, jenis_kelamin, hubungan_keluarga,
          keluarga_id, status, registered_profile_id,
          assigned_role, assigned_access_layer,
          tempat_tanggal_lahir, tanggal_lahir, alamat
        `)
        .ilike('nama', `%${nama_lengkap || ''}%`)
        .limit(10);

      // If exact-ish matches found, return them as suggestions
      if (byName && byName.length > 0) {
        return NextResponse.json({
          found: false,
          families: [],
          suggestions: byName.map(item => ({
            id: item.id, // ID umat_staging untuk verifikasi
            nama: item.nama,
            nama_baptis: item.nama_baptis,
            jenis_kelamin: item.jenis_kelamin,
            hubungan_keluarga: item.hubungan_keluarga,
            keluarga_id: item.keluarga_id,
            registered_profile_id: item.registered_profile_id,
            assigned_role: item.assigned_role,
            assigned_access_layer: item.assigned_access_layer,
            tempat_lahir_dan_tanggal: item.tempat_tanggal_lahir || (item.tanggal_lahir ? new Date(item.tanggal_lahir).toLocaleDateString('id-ID') : ''), // Corrected: removed item.tempat_lahir
            alamat: item.alamat,
            _tanggal_lahir_verif: item.tanggal_lahir, // Tanggal lahir untuk verifikasi, tidak ditampilkan
          })),
          message: `Ditemukan ${byName.length} kemungkinan data. Apakah salah satu ini Anda?`,
        });
      }

      return NextResponse.json({
        found: false,
        families: [],
        suggestions: [],
        message: 'Silakan daftar sebagai pengguna baru'
      });
    }

    const supabase = createClient();

    // Cari keluarga + anggota di umat_staging
    const { data: keluarga, error: keluargaError } = await supabase
      .from('keluarga')
      .select(`
        id,
        kepala_keluarga_nama,
        alamat_lengkap,
        lingkungan_id,
        lingkungan:lingkungan_id(nama, slug)
      `)
      .ilike('no_kk', `%${nomor_kk}%`)
      .limit(1)
      .maybeSingle();

    if (keluargaError || !keluarga) {
      return NextResponse.json({
        found: false,
        keluarga: null,
        anggota: [],
        message: 'Nomor KK tidak ditemukan'
      });
    }

    // Ambil anggota keluarga dari umat_staging
    const { data: anggota, error: anggotaError } = await supabase
      .from('umat_staging')
      .select(`
        id,
        nama,
        nama_baptis,
        jenis_kelamin,
        hubungan_keluarga,
        umur,
        status,
        registered_profile_id,
        assigned_role,
        assigned_access_layer
      `)
      .eq('keluarga_id', keluarga.id)
      .order('hubungan_keluarga', { ascending: true })
      .order('umur', { ascending: false });

    if (anggotaError) {
      console.error('Error fetching anggota:', anggotaError);
    }

    // Transform anggota to include assigned_role info
    const anggotaWithAssignment = (anggota || []).map((item: any) => ({
      id: item.id,
      nama: item.nama,
      nama_baptis: item.nama_baptis,
      jenis_kelamin: item.jenis_kelamin,
      hubungan_keluarga: item.hubungan_keluarga,
      umur: item.umur,
      status: item.status,
      registered_profile_id: item.registered_profile_id,
      assigned_role: item.assigned_role,
      assigned_access_layer: item.assigned_access_layer,
      has_assigned_role: !!item.assigned_role,
      _tanggal_lahir_verif: item.tanggal_lahir, // Include for secondary verification
    }));

    return NextResponse.json({
      found: true,
      keluarga,
      anggota: anggotaWithAssignment,
      message: 'Kartu Keluarga ditemukan'
    });

  } catch (error) {
    console.error('Check KK error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}