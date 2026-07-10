// Document notification system
// Integrates WhatsApp + FCM for document lifecycle events

import { sendMessage } from '@/lib/whatsapp/admin-notifications';
import { createClient } from '@/lib/supabase/server';

export type NotificationType = 
  | 'verification_request'
  | 'approval_request'
  | 'issued_notification'
  | 'revoked_notification'
  | 'custom';

interface DocumentNotificationPayload {
  documentId: string;
  documentCode: string;
  documentType: string;
  recipientId: string;
  recipientPhone?: string;
  recipientFcmToken?: string;
  notificationType: NotificationType;
  customMessage?: string;
  metadata?: Record<string, any>;
}

export async function sendDocumentNotification(payload: DocumentNotificationPayload) {
  const supabase = createClient();
  
  // Get recipient profile
  const { data: recipient } = await supabase
    .from('profiles')
    .select('full_name, phone, fcm_token')
    .eq('id', payload.recipientId)
    .single();

  if (!recipient) {
    return { success: false, error: 'Recipient not found' };
  }

  const phone = payload.recipientPhone || recipient.phone;
  const fcmToken = payload.recipientFcmToken || recipient.fcm_token;

  // Generate message based on type
  const message = generateMessage(payload);
  const title = getTitle(payload.notificationType);

  // Send via WhatsApp
  let whatsappResult = { success: false };
  if (phone) {
    whatsappResult = await sendMessage(phone, message);
  }

  // Send via FCM (push notification)
  let fcmResult = { success: false };
  if (fcmToken) {
    fcmResult = await sendFCMNotification(fcmToken, title, message, payload.metadata);
  }

  // Log notification to database
  await supabase.from('document_notifications').insert({
    document_id: payload.documentId,
    recipient_id: payload.recipientId,
    notification_type: payload.notificationType,
    channel: (phone ? 'whatsapp' : '') + (fcmToken ? (phone ? '+fcm' : 'fcm') : ''),
    message,
    sent_at: new Date().toISOString(),
    status: (whatsappResult.success || fcmResult.success) ? 'sent' : 'failed',
    metadata: payload.metadata,
  });

  return {
    success: whatsappResult.success || fcmResult.success,
    whatsapp: whatsappResult,
    fcm: fcmResult,
  };
}

async function sendFCMNotification(
  token: string,
  title: string,
  body: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean }> {
  try {
    const serverKey = process.env.FCM_SERVER_KEY;
    if (!serverKey) {
      console.warn('FCM_SERVER_KEY not configured, skipping FCM notification');
      return { success: false };
    }

    const message = {
      notification: { title, body },
      data: metadata || {},
      token,
    };

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${serverKey}`,
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    return { success: result.success === 1 };
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    return { success: false };
  }
}

function generateMessage(payload: DocumentNotificationPayload): string {
  switch (payload.notificationType) {
    case 'verification_request':
      return `Verifikasi dokumen ${payload.documentCode} (${payload.documentType}) memerlukan konfirmasi Anda. Silakan cek Digital Vault Anda.`;
    
    case 'approval_request':
      return `Dokumen ${payload.documentCode} (${payload.documentType}) menunggu persetujuan Anda. Segera lakukan approval di sistem Digital Vault.`;
    
    case 'issued_notification':
      return `Dokumen ${payload.documentCode} (${payload.documentType}) telah resmi diterbitkan dan tersedia di Digital Vault Anda.`;
    
    case 'revoked_notification':
      return `Dokumen ${payload.documentCode} (${payload.documentType}) telah dicabut. Silakan hubungi admin untuk informasi lebih lanjut.`;
    
    case 'custom':
      return payload.customMessage || `Notifikasi terkait dokumen ${payload.documentCode}.`;
    
    default:
      return `Notifikasi terkait dokumen ${payload.documentCode}.`;
  }
}

function getTitle(type: NotificationType): string {
  switch (type) {
    case 'verification_request':
      return 'Verifikasi Dokumen Diperlukan';
    case 'approval_request':
      return 'Persetujuan Dokumen';
    case 'issued_notification':
      return 'Dokumen Telah Diterbitkan';
    case 'revoked_notification':
      return 'Dokumen Dibatalkan';
    default:
      return 'Notifikasi Dokumen';
  }
}

export async function notifyDocumentIssued(
  documentId: string,
  documentCode: string,
  documentType: string,
  ownerId: string
) {
  return sendDocumentNotification({
    documentId,
    documentCode,
    documentType,
    recipientId: ownerId,
    notificationType: 'issued_notification',
    metadata: { event: 'document_issued' },
  });
}

export async function notifyApprovalRequired(
  documentId: string,
  documentCode: string,
  documentType: string,
  approverId: string
) {
  return sendDocumentNotification({
    documentId,
    documentCode,
    documentType,
    recipientId: approverId,
    notificationType: 'approval_request',
    metadata: { event: 'approval_required' },
  });
}

export async function notifyVerificationRequired(
  documentId: string,
  documentCode: string,
  documentType: string,
  verifierId: string
) {
  return sendDocumentNotification({
    documentId,
    documentCode,
    documentType,
    recipientId: verifierId,
    notificationType: 'verification_request',
    metadata: { event: 'verification_required' },
  });
}