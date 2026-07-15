export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const FONNTE_API_URL = 'https://api.fonnte.com/send';

async function sendViaFonnte(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string }> {
    const fonnteToken = process.env.FONNTE_TOKEN;
    if (!fonnteToken) {
        return { success: false, error: 'FONNTE_TOKEN not configured' };
    }

    try {
        const formData = new URLSearchParams();
        formData.append('target', phoneNumber);
        formData.append('message', message);
        formData.append('typing', 'true');

        const response = await fetch(FONNTE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': fonnteToken,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        const result = await response.json();
        console.log('[notifications/send] Fonnte API response:', {
            status: response.status,
            body: result,
            phone: phoneNumber,
        });

        if (result.status) {
            return { success: true };
        } else {
            return { success: false, error: result.reason || 'Fonnte API error' };
        }
    } catch (error) {
        console.error('[notifications/send] Fonnte network error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function POST(request: NextRequest) {
    try {
        const { recipient_ids, type, message, data } = await request.json();

        // Bypass auth untuk OTP (registrasi) — user belum login
        let senderId = 'system';
        if (type !== 'otp') {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('[notifications/send] Unauthorized — type:', type, 'requires auth');
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            senderId = user.id;
        }

        // Kirim langsung ke Fonnte API (tanpa Edge Function)
        if (!recipient_ids || recipient_ids.length === 0) {
            return NextResponse.json({ error: 'No recipients specified' }, { status: 400 });
        }

        let allSuccess = true;
        let lastError = '';

        for (const recipient of recipient_ids) {
            const result = await sendViaFonnte(recipient, message);
            if (!result.success) {
                allSuccess = false;
                lastError = result.error || 'Unknown error';
                console.error('[notifications/send] Failed to send to:', { recipient, error: result.error });
            }
        }

        if (!allSuccess) {
            return NextResponse.json({
                error: `Gagal mengirim notifikasi: ${lastError}`
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Notification sent to ${recipient_ids.length} recipient(s)`,
        });
    } catch (error) {
        console.error('[notifications/send] API route error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
