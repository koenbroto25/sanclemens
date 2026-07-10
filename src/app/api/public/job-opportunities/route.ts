import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing from environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const tipePekerjaan = searchParams.get('tipe_pekerjaan') || '';
  const lokasi = searchParams.get('lokasi') || '';
  const searchQuery = searchParams.get('q') || '';

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('lowongan_kerja') // Assuming a table named 'lowongan_kerja' for job opportunities
      .select('id, judul, tipe_pekerjaan, lokasi, gaji_range, deskripsi_singkat, deadline, is_active', { count: 'exact' })
      .eq('is_active', true)
      .gte('deadline', new Date().toISOString()); // Only active and not expired jobs

    if (tipePekerjaan) {
      query = query.eq('tipe_pekerjaan', tipePekerjaan);
    }
    if (lokasi) {
      query = query.ilike('lokasi', `%${lokasi}%`);
    }
    if (searchQuery) {
      query = query.or(`judul.ilike.%${searchQuery}%,deskripsi_singkat.ilike.%${searchQuery}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false }) // Order by most recent
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching public job opportunities:', error.message);
      return NextResponse.json({ error: 'Failed to fetch job opportunities', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      jobOpportunities: data,
      currentPage: page,
      perPage: limit,
      totalItems: count,
      totalPages: count ? Math.ceil(count / limit) : 0,
    });

  } catch (error: any) {
    console.error('Unhandled error in /api/public/job-opportunities:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}