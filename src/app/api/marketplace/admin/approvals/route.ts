import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/marketplace/admin/approvals
// Get all pending seller and ojek registrations
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user (admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pending sellers
    const { data: pendingSellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, lingkungan_slug, store_name, store_category, created_at')
      .eq('role', 'seller')
      .eq('seller_status', 'pending_approval')
      .order('created_at', { ascending: false });

    // Get pending ojek
    const { data: pendingOjek, error: ojekError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, lingkungan_slug, ojek_vehicle_type, ojek_vehicle_plate, ojek_max_capacity, created_at')
      .eq('role', 'ojek_solidaritas')
      .eq('ojek_status', 'pending_approval')
      .order('created_at', { ascending: false });

    if (sellersError || ojekError) {
      console.error('Error fetching approvals:', sellersError || ojekError);
      return NextResponse.json({ error: 'Gagal mengambil data pending approvals' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        sellers: pendingSellers || [],
        ojek: pendingOjek || [],
      },
    });
  } catch (error) {
    console.error('Get approvals error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/marketplace/admin/approvals
// Approve or reject seller/ojek registration
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user (admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, type, user_id, reason } = body;

    // Validate input
    if (!action || !type || !user_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: action, type, user_id' 
      }, { status: 400 });
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ 
        error: 'Invalid action. Must be "approve" or "reject"' 
      }, { status: 400 });
    }

    if (type !== 'seller' && type !== 'ojek') {
      return NextResponse.json({ 
        error: 'Invalid type. Must be "seller" or "ojek"' 
      }, { status: 400 });
    }

    // Determine status and fields based on type
    const isSeller = type === 'seller';
    
    let updateData: any = {};
    let logAction = '';

    if (action === 'approve') {
      updateData = {
        ...(isSeller ? {
          role: 'seller',
          seller_status: 'active',
        } : {
          role: 'ojek_solidaritas',
          ojek_status: 'active',
        }),
      };
      logAction = 'approve';
    } else {
      updateData = {
        ...(isSeller ? {
          seller_status: 'rejected',
          seller_rejection_reason: reason || 'Tidak ada alasan diberikan',
        } : {
          ojek_status: 'rejected',
          ojek_rejection_reason: reason || 'Tidak ada alasan diberikan',
        }),
      };
      logAction = 'reject';
    }

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ 
        error: 'Gagal memperbarui status profil' 
      }, { status: 500 });
    }

    // Log approval action
    const { error: logError } = await supabase
      .from('marketplace_approval_logs')
      .insert({
        user_id,
        approval_type: type,
        action: logAction,
        performed_by: user.id,
        notes: reason || (action === 'approve' ? 'Disetujui' : 'Ditolak'),
      });

    if (logError) {
      console.error('Error logging approval:', logError);
      // Don't fail the request, just log the error
    }

    // Send notification to user (TODO: Implement Fonnte notification)
    // TODO: Send WhatsApp notification via Fonnte

    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? `${type === 'seller' ? 'Seller' : 'Ojek'} berhasil di-approve` 
        : `${type === 'seller' ? 'Seller' : 'Ojek'} berhasil di-reject`,
      data: updatedProfile,
    });
  } catch (error) {
    console.error('Approval action error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}