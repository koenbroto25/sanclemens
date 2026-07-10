export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Get orders based on role
    let query = supabase
      .from('marketplace_orders')
      .select('*, marketplace_products(*), profiles!marketplace_orders_buyer_id_fkey(full_name, phone)');

    if (profile?.role === 'seller') {
      query = query.eq('seller_id', user.id);
    } else if (profile?.role === 'ojek_solidaritas') {
      query = query.eq('ojek_id', user.id);
    } else {
      // Buyer - see their own orders
      query = query.eq('buyer_id', user.id);
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Gagal mengambil pesanan' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { product_id, quantity, delivery_address, notes } = await request.json();

    // Get product details
    const { data: product } = await supabase
      .from('marketplace_products')
      .select('*, profiles!seller_id(full_name, phone)')
      .eq('id', product_id)
      .single();

    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    // Create order
    const { data: order, error } = await supabase
      .from('marketplace_orders')
      .insert({
        product_id,
        buyer_id: user.id,
        seller_id: product.seller_id,
        quantity: quantity || 1,
        total_price: product.price * (quantity || 1),
        delivery_address,
        notes,
        status: 'pending',
      })
      .single();

    if (error) {
      console.error('Create order error:', error);
      return NextResponse.json({ error: 'Gagal membuat pesanan' }, { status: 500 });
    }

    // Notify seller via Fonnte
    // If ojek delivery requested, notify available ojek via Fonnte

    return NextResponse.json({
      success: true,
      message: 'Pesanan berhasil dibuat',
      data: order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}