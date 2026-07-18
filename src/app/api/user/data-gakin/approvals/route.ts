import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const serviceClient = createServiceClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('role, full_name, phone')
      .eq('id', user.id)
      .single();

    const allowedApproverRoles = ['pastor', 'admin_paroki', 'wakil_ketua', 'koordinator_bidang', 'sekretaris_lingkungan', 'ketua_lingkungan'];
    if (profileError || !profile || !allowedApproverRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient role to approve GAKIN requests' }, { status: 403 });
    }

    const body = await request.json();
    const { gakin_id, action, reason } = body;

    if (!gakin_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['approve', 'reject', 'process'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    let updateData: any = {};
    let notificationMessage = '';
    let gakinStatus = '';

    const { data: gakinRequest, error: gakinFetchError } = await serviceClient
      .from('data_gakin')
      .select('status, family_id, profiles(phone, full_name)')
      .eq('id', gakin_id)
      .single();

    if (gakinFetchError || !gakinRequest) {
      console.error('Error fetching GAKIN request:', gakinFetchError);
      return NextResponse.json({ error: 'Gagal menemukan pengajuan GAKIN' }, { status: 404 });
    }

    const primaryProfile = gakinRequest.profiles && gakinRequest.profiles.length > 0 ? gakinRequest.profiles[0] : null;
    const recipientPhone = primaryProfile?.phone;
    const recipientName = primaryProfile?.full_name || 'Umat';

    switch (action) {
      case 'approve':
        updateData = { status: 'approved' };
        gakinStatus = 'DISETUJUI';
        notificationMessage = `Selamat ${recipientName}! Pengajuan bantuan GAKIN Anda telah DISETUJUI.`;
        break;
      case 'reject':
        updateData = { status: 'rejected', rejection_reason: reason || 'Tidak ada alasan diberikan' };
        gakinStatus = 'DITOLAK';
        notificationMessage = `Mohon maaf ${recipientName}, pengajuan bantuan GAKIN Anda telah DITOLAK. Alasan: ${reason || 'Tidak ada alasan diberikan'}.`;
        break;
      case 'process':
        updateData = { status: 'in_process' };
        gakinStatus = 'DALAM PROSES';
        notificationMessage = `Halo ${recipientName}, pengajuan bantuan GAKIN Anda sedang DALAM PROSES verifikasi dan review.`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data: updatedGakin, error: updateError } = await serviceClient
      .from('data_gakin')
      .update(updateData)
      .eq('id', gakin_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating GAKIN status:', updateError);
      return NextResponse.json({ error: 'Gagal memperbarui status pengajuan GAKIN' }, { status: 500 });
    }

    // Log approval action (assuming marketplace_approval_logs can also log GAKIN approvals)
    // Or create a new table for gakin_approval_logs if schema differentiation is needed.
    // For now, let's just log directly to avoid unnecessary schema changes if marketplace_approval_logs is general enough
    await serviceClient.from('marketplace_approval_logs').insert({ // Reusing for simplicity, consider dedicated table
      user_id: user.id, // The approver
      approval_type: 'gakin',
      action: action,
      performed_by: user.id,
      notes: reason || notificationMessage,
      target_id: gakin_id, // Target GAKIN request ID
    });

    // Send WhatsApp notification to the user who made the GAKIN request
    if (recipientPhone) {
      const notificationPayload = {
        recipient_ids: [recipientPhone],
        type: 'gakin_status_update',
        message: `
*Pembaruan Status Pengajuan Bantuan GAKIN*

Assalamualaikum ${recipientName},

${notificationMessage}

Terima kasih atas kesabaran Anda.
_Jesus is Lord._
Paroki Santo Klemens Sepinggan
        `.trim(),
        data: {
          gakin_id: gakin_id,
          status: gakinStatus,
          action: action,
          reason: reason || null,
        }
      };

      const notificationRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationPayload),
      });

      if (!notificationRes.ok) {
        console.error('Failed to send GAKIN status notification:', await notificationRes.text());
      } else {
        console.log('GAKIN status notification sent successfully to:', recipientPhone);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Pengajuan GAKIN berhasil diperbarui menjadi ${gakinStatus}`,
      data: updatedGakin,
    });

  } catch (error) {
    console.error('GAKIN approval action error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}