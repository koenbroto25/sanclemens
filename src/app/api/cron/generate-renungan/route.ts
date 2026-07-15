import { NextResponse } from 'next/server';
import { POST as generateRenunganPost } from '@/app/api/renungan/generate/route';
import { supabaseServer } from '@/lib/supabase/server';

// Initialize Supabase client for sending notifications

// Placeholder for WhatsApp sending function
async function sendWhatsAppNotification(phoneNumber: string, message: string): Promise<boolean> {
  console.log(`Sending WhatsApp to ${phoneNumber}: ${message}`);
  // In a real implementation, you would call your Fonnte/WhatsApp API integration here.
  // Example:
  // const { data, error } = await supabaseServer.from('notifications').insert({
  //   user_id: pastorUserId, // You'd need to fetch this
  //   type: 'whatsapp',
  //   message_title: 'Renungan Harian Paroki',
  //   message_body: message,
  //   status: 'pending',
  //   target_phone: phoneNumber
  // });
  // if (error) {
  //   console.error("Error logging WhatsApp notification:", error);
  //   return false;
  // }
  return true; // Assume success for now
}

export async function POST(request: Request) {
  // Validate CRON_SECRET from incoming request headers
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden: Invalid CRON_SECRET' }, { status: 403 });
  }

  try {
    console.log('Cron job for renungan generation triggered.');

    // Simulate calling the internal /api/renungan/generate API
    // We construct a mock Request object for this purpose.
    const mockRequest = new Request(new URL('/api/renungan/generate', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, // Authenticate internal call
      },
      // No body needed for this generate API
    });

    const generateResponse = await generateRenunganPost(mockRequest);
    const generateResult = await generateResponse.json();

    if (!generateResponse.ok) {
      console.error('Renungan generation failed:', generateResult.details || generateResult.error);
      return NextResponse.json({
        message: 'Renungan generation failed',
        details: generateResult.details || generateResult.error
      }, { status: 500 });
    }

    console.log('Renungan generation successful:', generateResult);

    // --- Send WhatsApp Notification to Pastor ---
    // You would fetch the Pastor's phone number from your database here.
    // For now, using a placeholder.
    const pastorPhoneNumber = process.env.PASTOR_PHONE_NUMBER || '+6281234567890'; // Placeholder
    // CATATAN (diperbaiki 15 Juli 2026): teks asli di sini sempat mojibake
    // parah (beberapa lapis salah-decode), tidak bisa direparasi otomatis
    // dengan pasti. Diganti teks bersih di bawah -- SILAKAN SESUAIKAN kalau
    // Anda ingat redaksi/emoji aslinya berbeda.
    const whatsappMessage = `Renungan Harian Paroki
Batch renungan minggu depan (${generateResult.generated_dates[0]} s/d ${generateResult.generated_dates[generateResult.generated_dates.length - 1]}) sudah siap dikurasi.
Silakan cek Dashboard Pastor untuk review dan persetujuan.
--------------------
Paroki Santo Klemens Sepinggan`;

    const waSent = await sendWhatsAppNotification(pastorPhoneNumber, whatsappMessage);
    if (!waSent) {
      console.warn('Failed to send WhatsApp notification to Pastor.');
    } else {
      console.log('WhatsApp notification sent to Pastor.');
    }

    return NextResponse.json({
      message: 'Cron job executed successfully.',
      generation_status: generateResult,
      whatsapp_notification_sent: waSent,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Unhandled error in cron generate-renungan:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
