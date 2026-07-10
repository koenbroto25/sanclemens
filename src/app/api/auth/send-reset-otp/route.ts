export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
// Simple in-memory rate limiter (per server instance)
const rateLimitMap = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Nomor WhatsApp harus diisi' }, { status: 400 });
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

    // Check if user exists
    const supabase = createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('phone', cleaned)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Nomor WhatsApp tidak terdaftar dalam sistem' }, { status: 404 });
    }

    // Generate OTP 6 digit
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Save OTP to database with type 'reset_password'
    const { error: insertError } = await supabase
      .from('auth_otps')
      .insert({
        phone: cleaned,
        otp_code: otp,
        expires_at: expiresAt,
        is_used: false,
        attempts: 0,
        type: 'reset_password',
        metadata: { userId: profile.id }
      });

    if (insertError) {
      console.error('Failed to save reset OTP:', insertError);
      return NextResponse.json({ error: 'Gagal menyimpan OTP' }, { status: 500 });
    }

    // Send notification via the new /api/notifications/send route
    const notificationMessage = `Kode OTP untuk reset kata sandi Anda:\n\n${otp}\n\nKode ini berlaku 5 menit. Jangan berikan kode ini kepada siapapun.`;
    const notificationPayload = {
      recipient_ids: [cleaned], // Kirim ke nomor telepon
      type: 'otp',
      message: notificationMessage,
      data: { otp_code: otp, type: 'reset_password', userId: profile.id },
    };

    try {
      const response = await fetch(`${request.url.split('/api/')[0]}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPayload),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        console.error('Failed to send reset OTP via notification service:', errorResult.error);
        return NextResponse.json({ error: 'Gagal mengirim OTP WhatsApp: ' + (errorResult.error || 'Unknown error') }, { status: 500 });
      }
    } catch (notificationError) {
      console.error('Error calling notification service for reset OTP:', notificationError);
      return NextResponse.json({ error: 'Terjadi kesalahan server saat mengirim OTP reset password' }, { status: 500 });
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
      message: 'OTP reset password berhasil dikirim',
      expires_in: 300 // 5 minutes
    });
  } catch (error) {
    console.error('Send reset OTP error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}