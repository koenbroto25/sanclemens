export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
// Simple in-memory rate limiter (per server instance)
const rateLimitMap = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const { phone, fullName, password, familyId, noKkGereja } = await request.json();

    if (!phone || !fullName || !password) {
      return NextResponse.json({ error: 'Nomor WhatsApp, nama, dan password harus diisi' }, { status: 400 });
    }

    // Normalize phone to Indonesia format (62xxx)
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }

    // Rate limit: 60 seconds per phone
    const now = Date.now();
    const lastSent = rateLimitMap.get(cleaned);
    if (lastSent && now - lastSent < 60_000) {
      const remaining = Math.ceil((60_000 - (now - lastSent)) / 1000);
      return NextResponse.json({ 
        error: `Terlalu banyak request. Coba lagi dalam ${remaining} detik.`,
        remaining 
      }, { status: 429 });
    }

    const supabase = createServiceClient();

    // Hourly rate limit: 3 OTPs per phone per hour
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    const { count: hourlyOtpCount, error: countError } = await supabase
      .from('auth_otps')
      .select('phone', { count: 'exact' })
      .eq('phone', cleaned)
      .gt('created_at', oneHourAgo);

    if (countError) {
      console.error('Error fetching hourly OTP count:', countError);
      return NextResponse.json({ error: 'Terjadi kesalahan server saat memeriksa batas permintaan' }, { status: 500 });
    }

    if (hourlyOtpCount !== null && hourlyOtpCount >= 3) {
      return NextResponse.json({ 
        error: 'Anda telah mencapai batas maksimal permintaan OTP (3x per jam). Silakan coba lagi nanti.',
      }, { status: 429 });
    }

    // Check if phone already registered
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', cleaned)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'No WhatsApp sudah terdaftar' }, { status: 409 });
    }

    // Generate OTP 6 digit
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Save OTP to database with registration metadata
    const { error: insertError } = await supabase
      .from('auth_otps')
      .insert({
        phone: cleaned,
        otp_code: otp,
        expires_at: expiresAt,
        is_used: false,
        attempts: 0,
        metadata: {
          fullName,
          password,
          familyId,
          noKkGereja,
        },
      });

    if (insertError) {
      console.error('Failed to save OTP:', insertError);
      return NextResponse.json({ error: 'Gagal menyimpan OTP' }, { status: 500 });
    }

    // Send notification via the new /api/notifications/send route
    const notificationMessage = `Kode OTP Paroki Santo Klemens: ${otp}\n\nKode ini berlaku 5 menit. Jangan bagikan ke siapapun.`;
    const notificationPayload = {
      recipient_ids: [cleaned], // Kirim ke nomor telepon
      type: 'otp',
      message: notificationMessage,
      data: { otp_code: otp, type: 'registration' }, // Tambahkan metadata jika perlu
    };

    let notificationStatus = 'unknown';
    let notificationDetail = '';

    try {
      const notificationUrl = `${request.url.split('/api/')[0]}/api/notifications/send`;
      console.log('[send-registration-otp] Calling notification service:', {
        url: notificationUrl,
        phone: cleaned,
        type: 'otp',
      });

      const response = await fetch(notificationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPayload),
      });

      const responseData = await response.json().catch(() => ({}));
      console.log('[send-registration-otp] Notification service response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseData,
        phone: cleaned,
      });

      if (!response.ok) {
        notificationStatus = 'failed';
        notificationDetail = responseData.error || `HTTP ${response.status}`;
        console.error('[send-registration-otp] Failed to send registration OTP:', {
          status: response.status,
          statusText: response.statusText,
          error: responseData.error,
          fullResponse: responseData,
          phone: cleaned,
          otp,
        });
        return NextResponse.json({ 
          error: `Gagal mengirim OTP WhatsApp: ${notificationDetail}. Pastikan nomor WhatsApp aktif dan tidak ada bug di Fonnte.`
        }, { status: 500 });
      }

      notificationStatus = 'sent';
      console.log('[send-registration-otp] Registration OTP sent successfully:', { phone: cleaned, otp });
    } catch (notificationError) {
      notificationStatus = 'error';
      notificationDetail = notificationError instanceof Error ? notificationError.message : 'Unknown network error';
      console.error('[send-registration-otp] Network error calling notification service:', {
        error: notificationDetail,
        stack: notificationError instanceof Error ? notificationError.stack : undefined,
        phone: cleaned,
        otp,
      });
      return NextResponse.json({ 
        error: `Terjadi kesalahan server saat mengirim OTP: ${notificationDetail}. Coba lagi dalam beberapa menit.`
      }, { status: 500 });
    }

    // Update rate limit
    rateLimitMap.set(cleaned, now);

    // Auto-cleanup old entries (keep map small)
    if (rateLimitMap.size > 1000) {
      for (const [key, value] of rateLimitMap.entries()) {
        if (now - value > 60_000) rateLimitMap.delete(key);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'OTP berhasil dikirim',
      expires_in: 300 // 5 minutes
    });
  } catch (error) {
    console.error('Send registration OTP error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}