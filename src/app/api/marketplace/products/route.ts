export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const seller_id = searchParams.get('seller_id');
    const status = searchParams.get('status') || 'active';

    let query = supabase
      .from('marketplace_products')
      .select('*, profiles(full_name, phone, lingkungan_slug)')
      .eq('status', status);

    if (category) {
      query = query.eq('category', category);
    }

    if (seller_id) {
      query = query.eq('seller_id', seller_id);
    }

    const { data: products, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Gagal mengambil produk' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('Get products error:', error);
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

    const { name, description, price, category, images, stock } = await request.json();

    const { data: product, error } = await supabase
      .from('marketplace_products')
      .insert({
        seller_id: user.id,
        name,
        description,
        price,
        category,
        images: images || [],
        stock: stock || 0,
        status: 'pending_approval',
      })
      .single();

    if (error) {
      console.error('Create product error:', error);
      return NextResponse.json({ error: 'Gagal membuat produk' }, { status: 500 });
    }

    // Notify marketplace admin for moderation via Fonnte

    return NextResponse.json({
      success: true,
      message: 'Produk berhasil diajukan, menunggu moderasi',
      data: product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}