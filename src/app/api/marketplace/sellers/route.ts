export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const lingkungan = searchParams.get('lingkungan');

    let query = supabase
      .from('profiles')
      .select('id, full_name, phone, lingkungan_slug, seller_rating, total_sales')
      .eq('role', 'seller')
      .not('seller_rating', 'is', null);

    if (lingkungan) {
      query = query.eq('lingkungan_slug', lingkungan);
    }

    const { data: sellers, error } = await query.order('seller_rating', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Gagal mengambil data seller' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: sellers });
  } catch (error) {
    console.error('Get sellers error:', error);
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

    const { store_name, description, category } = await request.json();

    // Update profile to become seller
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        role: 'seller',
        store_name,
        store_description: description,
        store_category: category,
        seller_rating: 0,
        total_sales: 0,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Register seller error:', error);
      return NextResponse.json({ error: 'Gagal mendaftar sebagai seller' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Berhasil mendaftar sebagai seller',
      data: profile,
    });
  } catch (error) {
    console.error('Register seller error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}