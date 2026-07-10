import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getLiturgiHarian } from '@/lib/liturgi/liturgi-service';
import { isValid, parseISO, format } from 'date-fns';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing from environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');

  if (!dateParam) {
    return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 });
  }

  const queryDate = parseISO(dateParam);
  if (!isValid(queryDate)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 });
  }

  const formattedDate = format(queryDate, 'yyyy-MM-dd');

  try {
    // Fetch liturgical data for the specified date
    const liturgiData = await getLiturgiHarian(queryDate);

    // Fetch published renungan for the specified date
    const { data: renungan, error: renunganError } = await supabase
      .from('renungan_harian')
      .select('*')
      .eq('tanggal', formattedDate)
      .eq('status', 'published')
      .single();

    if (renunganError && renunganError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error(`Error fetching renungan for ${formattedDate}:`, renunganError.message);
      // Continue without renungan if there's a DB error, but log it
    }

    return NextResponse.json({
      liturgi: liturgiData,
      renungan: renungan || null, // Will be null if no published renungan found
    });

  } catch (error: any) {
    console.error(`Unhandled error in /api/renungan/by-date for ${formattedDate}:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}