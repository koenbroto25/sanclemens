// Helper functions for admin WhatsApp notifications
// Ref: Masterplan v4.0 Fase 7.2

import { sendOTP } from './provider';

interface SendPasswordPayload {
  phone: string;
  fullName: string;
  roleRequested: string;
  tempPassword: string;
}

export async function sendAdminApprovalNotification(payload: SendPasswordPayload) {
  const message = `Halo ${payload.fullName},
Pendaftaran Anda sebagai ${payload.roleRequested} telah disetujui.
Password sementara: ${payload.tempPassword}
Silakan login di ${process.env.NEXT_PUBLIC_APP_URL}/admin/login dan ubah password Anda.`;

  return sendMessage(payload.phone, message);
}

export async function sendAdminRejectionNotification(phone: string, fullName: string, reason?: string) {
  const message = `Halo ${fullName},
Pendaftaran Anda sebagai admin telah ditolak${reason ? ` dengan alasan: ${reason}` : ''}.
Silakan hubungi Super Admin untuk informasi lebih lanjut.`;

  return sendMessage(phone, message);
}

export async function sendMessage(phone: string, message: string) {
  try {
    const provider = process.env.WHATSAPP_PROVIDER || 'wablas';
    const apiKey = process.env.WABLAS_API_KEY || '';

    // Use the same OTP sending mechanism for admin notifications
    // This reuses the existing sendOTP function with a custom message
    const result = await sendOTP(phone, message);

    return result;
  } catch (error) {
    console.error('Error sending admin WhatsApp notification:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}
