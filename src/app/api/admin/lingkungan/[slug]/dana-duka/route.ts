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
      .select('access_layer, role, lingkungan_slug')
      .eq('id', user.id)
      .single();

    if (!adminProfile || adminProfile.access_layer < 4) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const slug = request.nextUrl.pathname.split('/')[3];
    
    // Verify the admin is accessing their own lingkungan
    if (adminProfile.lingkungan_slug !== slug) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses ke lingkungan ini' }, { status: 403 });
    }

    const { amount, recipient_id, purpose, notes } = await request.json();

    // Create Dana Duka transaction for this lingkungan
    const { data: transaction, error } = await supabase
      .from('dana_duka_transactions')
      .insert({
        amount,
        recipient_id,
        purpose,
        notes,
        category: 'lingkungan',
        status: 'pending',
        created_by: user.id,
        lingkungan_slug: slug,
      })
      .single();

    if (error) {
      console.error('Dana duka error:', error);
      return NextResponse.json({ error: 'Gagal membuat transaksi Dana Duka' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Transaksi Dana Duka berhasil dibuat',
      data: transaction,
    });
  } catch (error) {
    console.error('Dana duka error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}