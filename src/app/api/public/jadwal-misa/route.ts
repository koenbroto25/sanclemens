export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('jadwal_misa')
      .select('*')
      .eq('is_active', true)
      .order('hari', { ascending: true })
      .order('jam', { ascending: true });

    if (error) throw error;

    // Group by tipe untuk frontend
    const grouped = {
      harian: data?.filter(m => m.tipe === 'harian') || [],
      hari_besar: data?.filter(m => m.tipe === 'hari_besar') || [],
      khusus: data?.filter(m => m.tipe === 'khusus') || [],
    };

    return NextResponse.json({ data, grouped });
  } catch (error) {
    console.error('Public jadwal misa error:', error);
    return NextResponse.json({ error: 'Gagal memuat jadwal misa' }, { status: 500 });
  }
}