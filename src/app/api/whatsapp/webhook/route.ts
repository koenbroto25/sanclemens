export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWhatsApp } from '@/lib/whatsapp/provider'; // Assuming this exists

import { normalizePhone } from '@/app/auth/register/types';

// GET handler for Fonnte webhook validation (ping)
export async function GET(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Fonnte webhook endpoint is active.' });
}

// POST handler for Fonnte webhook events
export async function POST(request: NextRequest) {
  const supabase = createClient();
  let payload: any;

  try {
    payload = await request.json();
    console.log('Fonnte Webhook Payload:', payload);

    const { device, sender, message, name, url, filename, extension } = payload;

    if (!sender || !message) {
      // This might be a 'connect', 'message_status', or 'chaining' event
      console.log('Fonnte Non-Message Webhook Event:', payload);
      // For now, just acknowledge. Further logic can be added here if needed.
      return NextResponse.json({ success: true, message: 'Non-message event received' });
    }

    const normalizedSender = normalizePhone(sender);

    // Try to find an auto-reply rule based on keyword
    const { data: autoReplyRules, error: dbError } = await supabase
      .from('auto_replies')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false }); // Higher priority rules first

    if (dbError) {
      console.error('Error fetching auto-reply rules:', dbError);
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }

    let replyMessage = "Maaf, saya tidak mengerti pesan Anda. Silakan coba kata kunci lain atau hubungi admin paroki.";
    let replyType = 'text';
    let replyFileUrl = '';
    let replyFilename = '';
    let replyButtonOptions: any = null;

    for (const rule of autoReplyRules || []) {
      if (message.toLowerCase().includes(rule.keyword.toLowerCase())) {
        replyMessage = rule.response_message;
        replyType = rule.response_type || 'text';
        replyFileUrl = rule.file_url || '';
        replyFilename = rule.file_filename || '';
        replyButtonOptions = rule.button_options || null;
        break; // Use the first matching rule (highest priority)
      }
    }

    // Send the reply using sendWhatsApp provider
    const sendResult = await sendWhatsApp(normalizedSender, replyMessage);

    if (!sendResult.success) {
      console.error('Failed to send WhatsApp reply:', sendResult.error);
      // It's crucial to still return 200 OK to Fonnte,
      // otherwise, Fonnte might retry sending the webhook
      return NextResponse.json({ success: true, warning: 'Failed to send reply to user.' });
    }

    return NextResponse.json({ success: true, message: 'Webhook processed and reply sent.' });

  } catch (error) {
    console.error('Fonnte Webhook processing error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}