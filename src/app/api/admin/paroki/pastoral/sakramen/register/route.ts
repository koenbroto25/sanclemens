export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get admin profile
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('access_layer, role')
      .eq('id', user.id)
      .single();

    if (!adminProfile || adminProfile.access_layer < 5) {
      return NextResponse.json({ error: 'Forbidden - Sekretaris or above only' }, { status: 403 });
    }

    const { userId, sakramen_type, tanggal_sakramen, tempat_sakramen, petugas } = await request.json();

    // Map sakramen_type to column
    const sakramenColumn: string | undefined = ({
      'baptis': 'sakramen_baptis',
      'komuni': 'sakramen_komuni',
      'krisma': 'sakramen_krisma',
      'perkawinan': 'sakramen_perkawinan',
      'pengurapan': 'sakramen_pengurapan',
    } as Record<string, string>)[sakramen_type];

    if (!sakramenColumn) {
      return NextResponse.json({ error: 'Jenis sakramen tidak valid' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        [sakramenColumn]: true,
        sakramen_baptis_tanggal: sakramen_type === 'baptis' ? tanggal_sakramen : undefined,
      })
      .eq('id', userId);

    if (error) {
      console.error('Register sakramen error:', error);
      return NextResponse.json({ error: 'Gagal mendaftarkan sakramen' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Sakramen ${sakramen_type} berhasil didaftarkan`,
    });
  } catch (error) {
    console.error('Sakramen register error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
