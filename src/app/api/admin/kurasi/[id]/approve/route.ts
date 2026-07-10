import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or Service Role Key is missing from environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  // Authentication: Only allow authenticated admin users with Pastor role (Layer 9)
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Placeholder for user role verification.
  // In a real app, you'd decode the token and verify the user's role/access_layer.
  // For this example, we assume a valid token from a Pastor is provided.
  const isPastor = true; // Placeholder: assume token is from a Pastor
  const pastorName = "Pastor Yohanes"; // Placeholder: actual Pastor's name

  if (!isPastor) {
    return NextResponse.json({ error: 'Forbidden: Only Pastor can approve renungan' }, { status: 403 });
  }

  try {
    const { data, error } = await supabase
      .from('renungan_harian')
      .update({
        status: 'published',
        status_kurasi: 'disetujui',
        disetujui_oleh: pastorName,
        waktu_kurasi: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error approving renungan ${id}:`, error.message);
      return NextResponse.json({ error: 'Failed to approve renungan', details: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Renungan not found or already approved' }, { status: 404 });
    }

    // Optionally, update the batch_kurasi status if all renungan in the batch are now approved
    if (data.batch_id) {
      const { data: batchRenungan, error: batchError } = await supabase
        .from('renungan_harian')
        .select('id, status_kurasi')
        .eq('batch_id', data.batch_id);

      if (batchError) {
        console.error('Error fetching batch renungan for status check:', batchError.message);
      } else {
        const allApproved = batchRenungan.every(r => r.status_kurasi === 'disetujui');
        if (allApproved) {
          await supabase
            .from('batch_kurasi')
            .update({ status_batch: 'selesai', updated_at: new Date().toISOString() })
            .eq('id', data.batch_id);
          console.log(`Batch ${data.batch_id} marked as selesai.`);
        }
      }
    }

    return NextResponse.json({
      message: 'Renungan approved successfully',
      renungan: data,
    });

  } catch (error: any) {
    console.error(`Unhandled error in /api/admin/kurasi/${id}/approve:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}