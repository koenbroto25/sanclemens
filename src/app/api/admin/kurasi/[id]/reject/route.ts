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
  const { rejectionReason } = await request.json(); // Expect a rejectionReason in the body

  // Authentication: Only allow authenticated admin users with Pastor role (Layer 9)
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Placeholder for user role verification.
  const isPastor = true; // Placeholder: assume token is from a Pastor

  if (!isPastor) {
    return NextResponse.json({ error: 'Forbidden: Only Pastor can reject renungan' }, { status: 403 });
  }

  if (!rejectionReason) {
    return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('renungan_harian')
      .update({
        status: 'rejected',
        status_kurasi: 'ditolak',
        catatan_kurator: rejectionReason, // New column for rejection reason
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error rejecting renungan ${id}:`, error.message);
      return NextResponse.json({ error: 'Failed to reject renungan', details: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Renungan not found' }, { status: 404 });
    }

    // Optionally, update the batch_kurasi status if all renungan in the batch are now processed (approved/rejected)
    if (data.batch_id) {
        const { data: batchRenungan, error: batchError } = await supabase
          .from('renungan_harian')
          .select('id, status_kurasi')
          .eq('batch_id', data.batch_id);
  
        if (batchError) {
          console.error('Error fetching batch renungan for status check:', batchError.message);
        } else {
          const allProcessed = batchRenungan.every(r => ['disetujui', 'ditolak'].includes(r.status_kurasi));
          if (allProcessed) {
            await supabase
              .from('batch_kurasi')
              .update({ status_batch: 'selesai', updated_at: new Date().toISOString() })
              .eq('id', data.batch_id);
            console.log(`Batch ${data.batch_id} marked as selesai (all processed).`);
          }
        }
      }

    return NextResponse.json({
      message: 'Renungan rejected successfully',
      renungan: data,
    });

  } catch (error: any) {
    console.error(`Unhandled error in /api/admin/kurasi/${id}/reject:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}