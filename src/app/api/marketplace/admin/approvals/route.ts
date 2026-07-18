import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server'; // Add createServiceClient
// import { sendWhatsAppMessage } from '@/supabase/functions/_shared/fonnte'; // Will be called via internal API route

export const dynamic = 'force-dynamic';

// GET /api/marketplace/admin/approvals
// Get all pending seller and ojek registrations
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const serviceClient = createServiceClient(); // Use serviceClient for direct table access

    // Get current user (admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for role check
    const { data: profile, error: profileError } = await serviceClient // Use serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Check if user has admin_marketplace, admin_paroki, or super_admin role
    const allowedRoles = ['admin_marketplace', 'admin_paroki', 'super_admin'];
    if (profileError || !profile?.role || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get pending sellers
    const { data: pendingSellers, error: sellersError } = await serviceClient // Use serviceClient
      .from('profiles')
      .select('id, full_name, phone, lingkungan_slug, store_name, store_category, created_at')
      // .eq('role', 'seller') // Role filter is not necessary here as it's filtered by status and covered by post check
      .eq('seller_status', 'pending_approval')
      .order('created_at', { ascending: false });

    // Get pending ojek
    const { data: pendingOjek, error: ojekError } = await serviceClient // Use serviceClient
      .from('profiles')
      .select('id, full_name, phone, lingkungan_slug, ojek_vehicle_type, ojek_vehicle_plate, ojek_max_capacity, created_at')
      // .eq('role', 'ojek_solidaritas') // Role filter is not necessary here as it's filtered by status and covered by post check
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
    const serviceClient = createServiceClient(); // Use serviceClient for direct table access

    // Get current user (admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for role check
    const { data: profile, error: profileError } = await serviceClient // Use serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Check if user has admin_marketplace, admin_paroki, or super_admin role
    const allowedRoles = ['admin_marketplace', 'admin_paroki', 'super_admin'];
    if (profileError || !profile?.role || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, type, action, reason } = body;

    // Validate input
    if (!userId || !type || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['seller', 'ojek'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
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
    const { data: updatedProfile, error: updateError } = await serviceClient // Use serviceClient
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select('phone, full_name') // Select phone and full_name for notification
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({
        error: 'Gagal memperbarui status profil'
      }, { status: 500 });
    }

    // Log approval action
    const { error: logError } = await serviceClient // Use serviceClient
      .from('marketplace_approval_logs')
      .insert({
        user_id: userId,
        approval_type: type,
        action: logAction,
        performed_by: user.id,
        notes: reason || (action === 'approve' ? 'Disetujui' : 'Ditolak'),
      });

    if (logError) {
      console.error('Error logging approval:', logError);
      // Don't fail the request, just log the error
    }

    // Send WhatsApp notification to user
    try {
      const { data: targetProfile } = await serviceClient // Use serviceClient
        .from('profiles')
        .select('phone, full_name')
        .eq('id', userId)
        .single();

      if (targetProfile?.phone) {
        const statusMessage = action === 'approve'
          ? `Alhamdulillah! Pendaftaran Anda sebagai ${type === 'seller' ? 'Seller' : 'Ojek Solidaritas'} di Pasar Kasih Paroki Santo Klemens telah DISETUJUI. Anda sekarang dapat mengakses dashboard ${type === 'seller' ? 'seller' : 'ojek'} dan mulai bertransaksi.`
          : `Mohon maaf, pendaftaran Anda sebagai ${type === 'seller' ? 'Seller' : 'Ojek Solidaritas'} ditolak.${reason ? ` Alasan: ${reason}` : ''} Hubungi admin paroki untuk informasi lebih lanjut.`;

        const notificationPayload = {
          recipient_ids: [targetProfile.phone],
          type: 'marketplace_approval',
          message: `
*Pasar Kasih - Status Pendaftaran*

Assalamualaikum ${targetProfile.full_name || 'Umat'},

${statusMessage}

_Jesus is Lord._
Paroki Santo Klemens Sepinggan
          `.trim(),
          data: {
            user_id: userId,
            approval_type: type,
            action,
            reason: reason || null,
          },
        };

        const notificationRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notificationPayload),
        });

        if (!notificationRes.ok) {
          console.error('Failed to send approval notification:', await notificationRes.text());
        } else {
          console.log('Approval notification sent successfully to:', targetProfile.phone);
        }
      }
    } catch (notificationError) {
      console.error('Error sending approval notification:', notificationError);
      // Don't fail the approval process if notification fails
    }

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
