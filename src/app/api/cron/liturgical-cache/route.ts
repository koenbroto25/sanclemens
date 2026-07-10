export const dynamic = 'force-dynamic'
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper function to format date to 'YYYY-MM-DD'
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // TODO: Implement actual fetching from ordo.or.id or backup from Google Calendar
  // For now, use placeholder data
  const liturgicalData = {
    season: 'Biasa',
    season_week: 11,
    day_name: 'Minggu Biasa XI',
    liturgical_rank: 'hari_biasa',
    color: 'hijau',
    readings_summary: 'Perumpamaan biji sesawi â€” Kerajaan Allah',
    source_url: 'placeholder_url',
  };

  const { data, error } = await supabase.from('liturgical_calendar_cache').upsert({
    date: formatDate(tomorrow),
    ...liturgicalData,
    fetched_at: new Date().toISOString(), // Use ISO string for TIMESTAMPTZ
  }, { onConflict: 'date' }); // Use onConflict to update if date already exists

  if (error) {
    console.error('Error upserting liturgical data:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}