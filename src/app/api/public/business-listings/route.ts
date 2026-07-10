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
  const kategori = searchParams.get('kategori') || '';
  const searchQuery = searchParams.get('q') || '';

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('usaha_umat') // Assuming 'usaha_umat' table for businesses
      .select('id, nama, kategori, lokasi, rating, gambar, deskripsi_singkat, is_verified, is_active', { count: 'exact' })
      .eq('is_active', true); // Only active businesses

    if (kategori) {
      query = query.eq('kategori', kategori);
    }
    if (searchQuery) {
      query = query.or(`nama.ilike.%${searchQuery}%,deskripsi_singkat.ilike.%${searchQuery}%`);
    }

    const { data, error, count } = await query
      .order('nama', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching public business listings:', error.message);
      return NextResponse.json({ error: 'Failed to fetch business listings', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      businesses: data,
      currentPage: page,
      perPage: limit,
      totalItems: count,
      totalPages: count ? Math.ceil(count / limit) : 0,
    });

  } catch (error: any) {
    console.error('Unhandled error in /api/public/business-listings:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}