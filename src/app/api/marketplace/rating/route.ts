export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/marketplace/rating
// Submit rating for seller or ojek after order completion
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id, rating_type, rating_value, review } = await request.json();

    // Validate input
    if (!order_id || !rating_type || !rating_value) {
      return NextResponse.json({ 
        error: 'Missing required fields: order_id, rating_type, rating_value' 
      }, { status: 400 });
    }

    if (rating_type !== 'seller' && rating_type !== 'ojek') {
      return NextResponse.json({ 
        error: 'rating_type must be "seller" or "ojek"' 
      }, { status: 400 });
    }

    if (rating_value < 1 || rating_value > 5) {
      return NextResponse.json({ 
        error: 'rating_value must be between 1 and 5' 
      }, { status: 400 });
    }

    // Get the order to verify it belongs to the user
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
    }

    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Anda bukan pembeli order ini' }, { status: 403 });
    }

    if (order.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Order harus selesai (completed) sebelum memberi rating' 
      }, { status: 400 });
    }

    // Check if already rated
    const checkField = rating_type === 'seller' ? 'seller_rating_given' : 'ojek_rating_given';
    const { data: existing } = await supabase
      .from('marketplace_orders')
      .select(checkField)
      .eq('id', order_id)
      .single();

    if (existing && existing[checkField]) {
      return NextResponse.json({ error: 'Anda sudah memberi rating untuk order ini' }, { status: 400 });
    }

    // Mark order as rated
    const updateField = rating_type === 'seller' ? 'seller_rating_given' : 'ojek_rating_given';
    await supabase
      .from('marketplace_orders')
      .update({ [updateField]: true })
      .eq('id', order_id);

    if (rating_type === 'seller') {
      // Update seller's rating
      const targetId = order.seller_id;
      
      // Get current seller stats
      const { data: seller } = await supabase
        .from('profiles')
        .select('seller_rating, total_sales')
        .eq('id', targetId)
        .single();

      const currentRating = seller?.seller_rating || 0;
      const totalSales = seller?.total_sales || 0;

      // Calculate new weighted average
      const newRating = totalSales > 0 
        ? ((currentRating * totalSales) + rating_value) / (totalSales + 1)
        : rating_value;

      // Update seller profile
      await supabase
        .from('profiles')
        .update({
          seller_rating: Math.round(newRating * 100) / 100, // Round to 2 decimal places
        })
        .eq('id', targetId);

      return NextResponse.json({
        success: true,
        message: 'Rating untuk seller berhasil dikirim',
        data: {
          seller_id: targetId,
          new_rating: Math.round(newRating * 100) / 100,
          review: review || null,
        },
      });
    } else {
      // Update ojek's rating
      const targetId = order.ojek_id;
      if (!targetId) {
        return NextResponse.json({ error: 'Tidak ada ojek untuk order ini' }, { status: 400 });
      }

      // Get current ojek stats
      const { data: ojek } = await supabase
        .from('profiles')
        .select('ojek_rating, total_deliveries')
        .eq('id', targetId)
        .single();

      const currentRating = ojek?.ojek_rating || 0;
      const totalDeliveries = ojek?.total_deliveries || 0;

      // Calculate new weighted average
      const newRating = totalDeliveries > 0 
        ? ((currentRating * totalDeliveries) + rating_value) / (totalDeliveries + 1)
        : rating_value;

      // Update ojek profile
      await supabase
        .from('profiles')
        .update({
          ojek_rating: Math.round(newRating * 100) / 100, // Round to 2 decimal places
        })
        .eq('id', targetId);

      return NextResponse.json({
        success: true,
        message: 'Rating untuk ojek berhasil dikirim',
        data: {
          ojek_id: targetId,
          new_rating: Math.round(newRating * 100) / 100,
          review: review || null,
        },
      });
    }
  } catch (error) {
    console.error('Rating error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// GET /api/marketplace/rating?type=seller&id=uuid
// Get rating for a seller or ojek
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Missing type or id parameter' }, { status: 400 });
    }

    if (type === 'seller') {
      const { data: seller } = await supabase
        .from('profiles')
        .select('id, full_name, store_name, seller_rating, total_sales')
        .eq('id', id)
        .single();

      if (!seller) {
        return NextResponse.json({ error: 'Seller tidak ditemukan' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          id: seller.id,
          name: seller.store_name || seller.full_name,
          rating: seller.seller_rating || 0,
          total_sales: seller.total_sales || 0,
        },
      });
    } else if (type === 'ojek') {
      const { data: ojek } = await supabase
        .from('profiles')
        .select('id, full_name, ojek_rating, total_deliveries')
        .eq('id', id)
        .single();

      if (!ojek) {
        return NextResponse.json({ error: 'Ojek tidak ditemukan' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          id: ojek.id,
          name: ojek.full_name,
          rating: ojek.ojek_rating || 0,
          total_deliveries: ojek.total_deliveries || 0,
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid type. Must be "seller" or "ojek"' }, { status: 400 });
    }
  } catch (error) {
    console.error('Get rating error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PATCH /api/marketplace/rating
// Mark order as complete so it can be rated
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id } = await request.json();

    if (!order_id) {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
    }

    // Verify the order belongs to the seller
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
    }

    if (order.seller_id !== user.id && order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (order.status !== 'delivered') {
      return NextResponse.json({ error: 'Order harus di-deliver terlebih dahulu' }, { status: 400 });
    }

    // Update order to completed
    await supabase
      .from('marketplace_orders')
      .update({ status: 'completed' })
      .eq('id', order_id);

    // Increment seller's total_sales
    await supabase.rpc('increment_total_sales', { seller_id: order.seller_id });

    // If ojek was assigned, increment their total_deliveries
    if (order.ojek_id) {
      await supabase.rpc('increment_total_deliveries', { ojek_id: order.ojek_id });
    }

    return NextResponse.json({
      success: true,
      message: 'Pesanan selesai. Silakan beri rating.',
      data: { order_id },
    });
  } catch (error) {
    console.error('Complete order error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}