import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { notifySystemError } from '@/lib/utils/error-notifier'; // Import the error notifier

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const serviceClient = createServiceClient();

    // Get current user (admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for role check
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const allowedPublisherRoles = ['pastor', 'admin_paroki', 'super_admin'];
    if (profileError || !profile || !allowedPublisherRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient role to publish pastoral letters' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, is_e2e_encrypted } = body; // Assume content is already encrypted if is_e2e_encrypted is true

    if (!title || !content) {
      return NextResponse.json({ error: 'Missing required fields: title, content' }, { status: 400 });
    }

    // Insert new pastoral letter into the database
    const { data: newLetter, error: insertError } = await serviceClient
      .from('surat_pastoral')
      .insert({
        title,
        content, // Content should be encrypted before being sent here if E2E is true
        is_e2e_encrypted: is_e2e_encrypted || false,
        published_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting pastoral letter:', insertError);
      notifySystemError(insertError, 'Pastoral Letter Publish - Insert Error', { userId: user.id, title });
      return NextResponse.json({ error: 'Failed to publish pastoral letter' }, { status: 500 });
    }

    // Fetch all active users to send notifications
    const { data: activeUsers, error: usersError } = await serviceClient
      .from('profiles')
      .select('phone, full_name')
      .eq('status', 'active');

    if (usersError) {
      console.error('Error fetching active users for notification:', usersError);
      notifySystemError(usersError, 'Pastoral Letter Publish - Fetch Users Error', { letterId: newLetter.id });
      // Proceed without sending notifications if fetching users fails
    }

    if (activeUsers && activeUsers.length > 0) {
      const recipientPhones = activeUsers.map(u => u.phone).filter(Boolean) as string[];
      if (recipientPhones.length > 0) {
        const notificationMessage = `
*Surat Pastoral Baru Telah Diterbitkan!*

Assalamualaikum Umat,

Sebuah surat pastoral baru berjudul "${title}" telah diterbitkan oleh Pastor Paroki. Segera baca di aplikasi Paroki Digital Anda.

Akses sekarang: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/user/pastoral-letters

_Jesus is Lord._
Paroki Santo Klemens Sepinggan
        `.trim();

        const notificationPayload = {
          recipient_ids: recipientPhones,
          type: 'new_pastoral_letter',
          message: notificationMessage,
          data: {
            letter_id: newLetter.id,
            title: newLetter.title,
          }
        };

        // Call the internal API route for notifications
        const notificationRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notificationPayload),
        });

        if (!notificationRes.ok) {
          console.error('Failed to send new pastoral letter notification:', await notificationRes.text());
          notifySystemError(new Error('Failed to send notifications'), 'Pastoral Letter Publish - Notification Error', { letterId: newLetter.id });
        } else {
          console.log(`New pastoral letter notification sent to ${recipientPhones.length} users.`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Surat pastoral berhasil diterbitkan dan notifikasi dikirim.',
      data: newLetter,
    });

  } catch (error) {
    console.error('Pastoral letter publish error:', error);
    notifySystemError(error, 'Pastoral Letter Publish - General Error');
    return NextResponse.json({ error: 'Terjadi kesalahan server saat menerbitkan surat pastoral' }, { status: 500 });
  }
}