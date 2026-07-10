import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or Service Role Key is missing from environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(request: Request) {
  // Authentication: Only allow service role or authenticated admin users (Pastor, Super Admin)
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  // In a real app, you'd verify the token against Supabase auth.
  // For simplicity, let's assume valid token means authenticated user for this example.

  // Fetch user role/access level to determine what they can see/do
  // This is a placeholder. You'd typically get this from user's session or a profiles table.
  const isServiceRole = token === supabaseServiceRoleKey;
  const isPastorOrSuperAdmin = true; // Placeholder: assume token is from authenticated Pastor/SuperAdmin

  if (!isServiceRole && !isPastorOrSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status'); // e.g., 'draft', 'published', 'rejected'
  const mode = searchParams.get('mode'); // 'pastor' or 'super_admin'

  try {
    let query = supabase
      .from('renungan_harian')
      .select(`
        id,
        tanggal,
        mode_persona,
        judul,
        konten,
        bacaan_utama,
        musim_liturgi,
        tema_renungan,
        status,
        status_kurasi,
        created_at,
        updated_at,
        batch_id,
        profiles(
          nama_depan,
          nama_belakang
        )
      `);
    
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    if (mode === 'pastor') {
      // Pastor primarily sees renungan awaiting their review
      query = query.in('status_kurasi', ['menunggu', 'revisi']);
    } else if (mode === 'super_admin') {
      // Super Admin sees all statuses for monitoring
      // No additional filter needed based on status for super_admin
    } else {
      // Default to showing all if mode is not specified or invalid
    }

    const { data, error } = await query.order('tanggal', { ascending: true });

    if (error) {
      console.error('Error fetching renungan list:', error.message);
      return NextResponse.json({ error: 'Failed to fetch renungan list', details: error.message }, { status: 500 });
    }

    // Transform data to include disetujui_oleh
    const renunganList = data.map(item => {
      const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
      return {
        ...item,
        disetujui_oleh: profile ? `${profile.nama_depan} ${profile.nama_belakang}` : null,
        profiles: undefined // Remove original profiles object
      };
    });

    // For Super Admin mode, also provide a summary of batches
    let batchSummary = null;
    if (mode === 'super_admin') {
      const { data: batches, error: batchError } = await supabase
        .from('batch_kurasi')
        .select('*')
        .order('tanggal_mulai', { ascending: false })
        .limit(5); // Get recent batches

      if (batchError) {
        console.error('Error fetching batch summary:', batchError.message);
      } else {
        batchSummary = batches;
      }
    }

    return NextResponse.json({ renungan: renunganList, batchSummary });

  } catch (error: any) {
    console.error('Unhandled error in /api/admin/kurasi/list:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}