export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get parish profile
    const { data: parish, error: parishError } = await supabase
      .from('parish_profile')
      .select('*')
      .single();

    if (parishError) {
      return NextResponse.json({ error: 'Gagal mengambil data paroki' }, { status: 500 });
    }

    // Get all lingkungan/stasi
    const { data: lingkungan, error: lingkunganError } = await supabase
      .from('lingkungan')
      .select('*')
      .order('nama', { ascending: true });

    if (lingkunganError) {
      return NextResponse.json({ error: 'Gagal mengambil data lingkungan' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        parish,
        lingkungan,
      }
    });
  } catch (error) {
    console.error('Get profil paroki error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}