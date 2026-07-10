export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { umatStagingId, tanggalLahir } = await request.json();

    if (!umatStagingId || !tanggalLahir) {
      return NextResponse.json({ error: 'ID data profil dan tanggal lahir harus diisi' }, { status: 400 });
    }

    const supabase = createClient();

    // Fetch umat_staging record
    const { data: umatStaging, error: umatError } = await supabase
      .from('umat_staging')
      .select('tanggal_lahir')
      .eq('id', umatStagingId)
      .single();

    if (umatError || !umatStaging) {
      console.error('Umat staging not found:', umatError);
      return NextResponse.json({ error: 'Data profil tidak ditemukan' }, { status: 404 });
    }

    // Compare birth dates
    const storedTanggalLahir = umatStaging.tanggal_lahir;
    
    if (!storedTanggalLahir) {
      return NextResponse.json({ error: 'Tanggal lahir tidak tersedia di database untuk data ini' }, { status: 400 });
    }

    // Normalize dates for comparison (YYYY-MM-DD)
    const normalizedStoredDate = new Date(storedTanggalLahir).toISOString().split('T')[0];
    const normalizedInputDate = new Date(tanggalLahir).toISOString().split('T')[0];

    if (normalizedStoredDate === normalizedInputDate) {
      return NextResponse.json({ success: true, message: 'Verifikasi tanggal lahir berhasil' });
    } else {
      return NextResponse.json({ success: false, error: 'Tanggal lahir tidak cocok' }, { status: 401 });
    }

  } catch (error) {
    console.error('Verify profile data error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}