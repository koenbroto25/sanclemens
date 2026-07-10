export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('warta_paroki')
      .select('id, judul, excerpt, tanggal, kategori, gambar_url, published_at')
      .eq('is_published', true)
      .order('tanggal', { ascending: false })
      .limit(5);

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Public warta error:', error);
    return NextResponse.json({ error: 'Gagal memuat warta paroki' }, { status: 500 });
  }
}