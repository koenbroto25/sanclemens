export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();

    const [
      { count: umatCount, error: umatError },
      { count: keluargaCount, error: keluargaError },
      { count: lingkunganCount, error: lingkunganError },
      { count: kegiatanCount, error: kegiatanError },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('families').select('*', { count: 'exact', head: true }),
      supabase.from('lingkungan').select('*', { count: 'exact', head: true }),
      supabase
        .from('kegiatan')
        .select('*', { count: 'exact', head: true })
        .gte('tanggal_mulai', new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]),
    ]);

    if (umatError || keluargaError || lingkunganError || kegiatanError) {
      throw umatError || keluargaError || lingkunganError || kegiatanError;
    }

    const data = [
      { value: String(umatCount ?? 0), label: 'Umat Terdaftar' },
      { value: String(keluargaCount ?? 0), label: 'Keluarga' },
      { value: String(lingkunganCount ?? 0), label: 'Lingkungan' },
      { value: String(kegiatanCount ?? 0), label: 'Kegiatan Tahun Ini' },
    ];

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Public statistik error:', error);
    return NextResponse.json({ error: 'Gagal memuat statistik' }, { status: 500 });
  }
}
