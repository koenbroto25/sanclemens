import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const supabase = createClient();

    // Fetch liturgical data for today
    const { data: liturgicalData, error: liturgicalError } = await supabase
      .from('liturgical_calendar_cache')
      .select('*')
      .eq('date', date)
      .single();

    if (liturgicalError || !liturgicalData) {
      // Fallback: return basic info if not in cache
      return NextResponse.json({
        date,
        season: 'Unknown',
        season_week: 0,
        day_name: 'Hari Biasa',
        liturgical_rank: 'hari_biasa',
        color: 'hijau',
        readings_summary: 'Data liturgi belum tersedia untuk tanggal ini.',
        special_notes: null,
        bacaan_1: { sumber: '-', teks: 'Data liturgi belum tersedia untuk tanggal ini.' },
        bacaan_injil: { sumber: '-', teks: 'Data liturgi belum tersedia untuk tanggal ini.' },
        source: 'fallback'
      });
    }

    // Fetch saints for today
    const { data: saintsData } = await supabase
      .from('theology.prayers')
      .select('prayer_name, category')
      .eq('category', 'other')
      .limit(5);

    return NextResponse.json({
      date: liturgicalData.date,
      season: liturgicalData.season,
      season_week: liturgicalData.season_week,
      day_name: liturgicalData.day_name,
      liturgical_rank: liturgicalData.liturgical_rank,
      color: liturgicalData.color,
      readings_first: liturgicalData.readings_first,
      readings_psalm: liturgicalData.readings_psalm,
      readings_second: liturgicalData.readings_second,
      readings_gospel: liturgicalData.readings_gospel,
      readings_summary: liturgicalData.readings_summary,
      special_notes: liturgicalData.special_notes,
      bacaan_1: {
        sumber: liturgicalData.readings_first_source || liturgicalData.day_name || '-',
        teks: liturgicalData.readings_first || 'Bacaan belum tersedia.'
      },
      bacaan_injil: {
        sumber: liturgicalData.readings_gospel_source || liturgicalData.day_name || '-',
        teks: liturgicalData.readings_gospel || 'Bacaan Injil belum tersedia.'
      },
      saints_today: saintsData?.map(s => s.prayer_name) || [],
      source: 'cache'
    });

  } catch (error) {
    console.error('Error in /api/liturgi/daily-info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}