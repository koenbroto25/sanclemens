export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('kegiatan_paroki')
      .select('*')
      .eq('is_published', true)
      .gte('tanggal', new Date().toISOString().split('T')[0])
      .order('tanggal', { ascending: true })
      .limit(10);

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Public kegiatan error:', error);
    return NextResponse.json({ error: 'Gagal memuat kegiatan paroki' }, { status: 500 });
  }
}