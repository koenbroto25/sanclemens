const FONNTE_API_URL = 'https://api.fonnte.com/send';
const FONNTE_TOKEN = Deno.env.get('FONNTE_TOKEN'); // Access from Deno.env in Edge Functions

export async function sendWhatsAppMessage(
  target: string,
  message: string,
  options?: {
    url?: string;
    filename?: string;
    delay?: string;
    typing?: boolean;
    priority?: string;
  }
): Promise<{ success: boolean; requestId?: number; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('target', target);
    formData.append('message', message);

    if (options?.url) formData.append('url', options.url);
    if (options?.filename) formData.append('filename', options.filename);
    if (options?.delay) formData.append('delay', options.delay);
    if (options?.typing) formData.append('typing', 'true');
    if (options?.priority) formData.append('priority', options.priority);

    const response = await fetch(FONNTE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN || '',
      },
      body: formData,
    });

    const result = await response.json();

    if (result.status) {
      return { success: true, requestId: result.requestid };
    } else {
      return { success: false, error: result.reason || 'Unknown error' };
    }
  } catch (error) {
    console.error('Fonnte API error:', error);
    return { success: false, error: 'Failed to send WhatsApp message' };
  }
}

export async function sendOTP(targetPhone: string, otp: string): Promise<boolean> {
  const message = `Kode OTP Paroki Santo Klemens: ${otp}\n\nKode ini berlaku 5 menit. Jangan bagikan ke siapapun.`;
  const result = await sendWhatsAppMessage(targetPhone, message, { typing: true });
  return result.success;
}

export async function sendSOSNotification(
  targets: string[],
  data: {
    nama: string;
    phone: string;
    lingkungan: string;
    jenis_sos: string;
    kondisi: string;
    waktu: string;
    maps_link?: string;
  }
): Promise<boolean> {
  const message = `SOS DARURAT\n\nNama: ${data.nama}\nNo WA: ${data.phone}\nLingkungan: ${data.lingkungan}\nJenis: ${data.jenis_sos}\nKondisi: ${data.kondisi}\nWaktu: ${data.waktu}\n${data.maps_link ? 'Lokasi: ' + data.maps_link : ''}\n\nSegera tindaklanjuti!`;

  const targetString = targets.join(',');
  const result = await sendWhatsAppMessage(targetString, message, { typing: true, priority: 'high' });
  return result.success;
}