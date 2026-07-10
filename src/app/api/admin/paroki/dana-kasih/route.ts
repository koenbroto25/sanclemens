export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get admin profile
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('access_layer, lingkungan_id')
      .eq('id', user.id)
      .single();

    if (!adminProfile || adminProfile.access_layer < 5) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { amount, recipient_id, purpose, notes } = await request.json();

    // Create Dana Kasih transaction with escrow
    const { data: transaction, error } = await supabase
      .from('dana_kasih_transactions')
      .insert({
        amount,
        recipient_id,
        purpose,
        notes,
        status: 'pending_escrow',
        created_by: user.id,
        verified_by: null,
        created_at: new Date().toISOString(),
      })
      .single();

    if (error) {
      console.error('Dana kasih error:', error);
      return NextResponse.json({ error: 'Gagal membuat transaksi Dana Kasih' }, { status: 500 });
    }

    // TODO: Trigger escrow logic (hold funds)
    // TODO: Notify Bendahara for verification

    return NextResponse.json({
      success: true,
      message: 'Transaksi Dana Kasih berhasil dibuat (menunggu escrow)',
      data: transaction,
    });
  } catch (error) {
    console.error('Dana kasih error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}