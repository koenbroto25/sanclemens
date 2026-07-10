import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getLiturgiHarian } from '@/lib/liturgi/liturgi-service';
import { format } from 'date-fns';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing from environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    const today = new Date();
    const formattedDate = format(today, 'yyyy-MM-dd');

    // Fetch liturgical data for today
    const liturgiData = await getLiturgiHarian(today);

    // Fetch published renungan for today
    const { data: renungan, error: renunganError } = await supabase
      .from('renungan_harian')
      .select('*')
      .eq('tanggal', formattedDate)
      .eq('status', 'published')
      .single();

    if (renunganError && renunganError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching renungan for today:', renunganError.message);
      // Continue without renungan if there's a DB error, but log it
    }

    return NextResponse.json({
      liturgi: liturgiData,
      renungan: renungan || null, // Will be null if no published renungan found
    });

  } catch (error: any) {
    console.error('Unhandled error in /api/renungan/today:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}