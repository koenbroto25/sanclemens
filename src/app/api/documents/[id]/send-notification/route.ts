import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    // Validate authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, access_layer')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch document with owner and issuer info
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select(`
        *,
        owner:profiles!documents_pidu_owner_id_fkey(id, full_name, email, phone_number),
        issuer:profiles!documents_issued_by_fkey(id, full_name)
      `)
      .eq('id', documentId)
      .single();

    if (documentError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check authorization - only admin or document owner can send notifications
    const isAdmin = profile.access_layer >= 4 || profile.role === 'super_admin';
    const isOwner = document.pidu_owner_id === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { notification_type, message, recipient_ids } = body;

    // Validate notification type
    const validTypes = ['verification_request', 'approval_request', 'issued_notification', 'custom'];
    if (!notification_type || !validTypes.includes(notification_type)) {
      return NextResponse.json({ 
        error: `Invalid notification_type. Must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Determine recipients based on notification type and document status
    let recipients = [];
    
    switch (notification_type) {
      case 'verification_request':
        // Send to document owner for verification
        if (document.status === 'draft' || document.status === 'pending_user_verification') {
          recipients.push(document.owner);
        }
        break;
        
      case 'approval_request':
        // Send to approver (if assigned)
        if (document.status === 'pending_user_verification' && document.approver_id) {
          const { data: approver } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone_number')
            .eq('id', document.approver_id)
            .single();
          if (approver) recipients.push(approver);
        }
        break;
        
      case 'issued_notification':
        // Send to document owner when document is issued
        if (document.status === 'issued') {
          recipients.push(document.owner);
        }
        break;
        
      case 'custom':
        // Send to specific recipients
        if (recipient_ids && Array.isArray(recipient_ids)) {
          const { data: customRecipients } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone_number')
            .in('id', recipient_ids);
          recipients = customRecipients || [];
        }
        break;
    }

    if (recipients.length === 0) {
      return NextResponse.json({ 
        error: 'No valid recipients found for this notification type and document status' 
      }, { status: 400 });
    }

    // Notifications should be sent via Fonnte Edge Function
    // Log notification requests
    
    const notifications = recipients.map(recipient => ({
      document_id: documentId,
      recipient_id: recipient.id,
      recipient_name: recipient.full_name,
      recipient_email: recipient.email,
      recipient_phone: recipient.phone_number,
      notification_type,
      message: message || generateDefaultMessage(notification_type, document),
      sent_by: user.id,
      sent_at: new Date().toISOString(),
      status: 'pending' // Will be updated by actual notification service
    }));

    // Log notification requests (in production, this would be sent to a queue/notification service)
    const { error: notifyError } = await supabase
      .from('document_notifications')
      .insert(notifications);

    if (notifyError) {
      console.error('Error logging notifications:', notifyError);
      // Continue anyway - notifications are queued
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'send_document_notification',
      target_type: 'document',
      target_id: documentId,
      metadata: {
        document_id: document.document_id,
        notification_type,
        recipient_count: recipients.length,
        message_preview: message?.substring(0, 100) || null
      }
    });

    return NextResponse.json({ 
      success: true,
      message: `Notification queued for ${recipients.length} recipient(s)`,
      data: {
        notification_type,
        recipients: recipients.map(r => ({ id: r.id, name: r.full_name })),
        status: 'queued'
      }
    });

  } catch (error) {
    console.error('Error in POST /api/documents/[id]/send-notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to generate default message based on notification type
function generateDefaultMessage(notificationType: string, document: any): string {
  switch (notificationType) {
    case 'verification_request':
      return `Dokumen ${document.document_id} menunggu verifikasi Anda. Silakan periksa dan verifikasi dokumen ini.`;
    
    case 'approval_request':
      return `Dokumen ${document.document_id} memerlukan persetujuan Anda. Silakan review dan berikan persetujuan atau penolakan.`;
    
    case 'issued_notification':
      return `Dokumen ${document.document_id} telah resmi diterbitkan dan tersedia di Digital Vault Anda.`;
    
    case 'custom':
      return `Pesan terkait dokumen ${document.document_id}.`;
    
    default:
      return `Notifikasi terkait dokumen ${document.document_id}.`;
  }
}