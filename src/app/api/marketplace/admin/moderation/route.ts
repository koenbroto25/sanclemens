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

    // Check if user is marketplace manager or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('access_layer, role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.access_layer < 6) {
      return NextResponse.json({ error: 'Forbidden - Marketplace Manager only' }, { status: 403 });
    }

    const { product_id, action, reason } = await request.json();

    if (action === 'approve') {
      const { error } = await supabase
        .from('marketplace_products')
        .update({ status: 'active' })
        .eq('id', product_id);

      if (error) {
        return NextResponse.json({ error: 'Gagal menyetujui produk' }, { status: 500 });
      }

      // Notify seller that product is approved via Fonnte
      return NextResponse.json({ success: true, message: 'Produk berhasil disetujui' });
    } else if (action === 'reject') {
      const { error } = await supabase
        .from('marketplace_products')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', product_id);

      if (error) {
        return NextResponse.json({ error: 'Gagal menolak produk' }, { status: 500 });
      }

      // Notify seller with reason via Fonnte
      return NextResponse.json({ success: true, message: 'Produk ditolak' });
    }

    return NextResponse.json({ error: 'Action tidak dikenali' }, { status: 400 });
  } catch (error) {
    console.error('Moderation error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}