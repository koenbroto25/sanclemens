import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for R/W access

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or Service Role Key is missing from environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const kategori = searchParams.get('kategori') || '';
  const lokasi = searchParams.get('lokasi') || '';

  try {
    let dbQuery = supabase
      .from('usaha_umat') // Assuming a table named 'usaha_umat' for businesses
      .select('*')
      .eq('is_active', true); // Only active businesses

    if (query) {
      dbQuery = dbQuery.or(`nama.ilike.%${query}%,deskripsi.ilike.%${query}%`);
    }
    if (kategori) {
      dbQuery = dbQuery.eq('kategori', kategori);
    }
    if (lokasi) {
      dbQuery = dbQuery.ilike('lokasi', `%${lokasi}%`);
    }

    // In a real AI-powered search, you might integrate semantic search here:
    // 1. Generate embeddings for the query
    // 2. Perform a vector similarity search on a 'business_embeddings' table
    // 3. Combine with keyword search for hybrid results

    const { data, error } = await dbQuery.limit(20); // Limit results for performance

    if (error) {
      console.error('Error fetching business listings:', error.message);
      return NextResponse.json({ error: 'Failed to fetch business listings', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ businesses: data });

  } catch (error: any) {
    console.error('Unhandled error in /api/ai/business/search:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}