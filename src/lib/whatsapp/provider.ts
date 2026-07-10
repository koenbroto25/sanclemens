// WhatsApp Provider Abstraction v4.0
// Mendukung Wablas, Fonnte, Whacenter — bisa switch via env var
// Ref: GDD v4.0 BAB VI §6.2-6.3

interface WhatsAppConfig {
  apiKey: string
  baseUrl: string
}

interface SendOTPParams {
  phone: string
  code: string
  expiryMinutes: number
}

interface SendMessageParams {
  phone: string
  message: string
}

interface WhatsAppResponse {
  success: boolean
  messageId?: string
  error?: string
}

// ─── Provider Implementations ───

const Wablas = {
  getConfig(): WhatsAppConfig {
    return {
      apiKey: process.env.WABLAS_API_KEY || '',
      baseUrl: 'https://patner.wablas.com/api',
    }
  },

  async sendOTP({ phone, code, expiryMinutes }: SendOTPParams): Promise<WhatsAppResponse> {
    const { apiKey, baseUrl } = this.getConfig()
    const res = await fetch(`${baseUrl}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({
        phone,
        message: `Kode verifikasi Anda: ${code}\n\nKode berlaku ${expiryMinutes} menit.\nJangan berikan kode ini ke siapapun, termasuk yang mengaku dari Paroki.\n\n— Sistem Digital Paroki Santo Klemens`,
        isTemplate: true,
      }),
    })
    const data = await res.json()
    return {
      success: data.status === 'success' || data.status === true,
      messageId: data.data?.message_id || data.messageId,
      error: data.message || data.error,
    }
  },

  async sendMessage({ phone, message }: SendMessageParams): Promise<WhatsAppResponse> {
    const { apiKey, baseUrl } = this.getConfig()
    const res = await fetch(`${baseUrl}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({ phone, message }),
    })
    const data = await res.json()
    return {
      success: data.status === 'success' || data.status === true,
      messageId: data.data?.message_id || data.messageId,
      error: data.message || data.error,
    }
  },
}

const Fonnte = {
  getConfig(): WhatsAppConfig {
    return {
      apiKey: process.env.FONNTE_API_KEY || '',
      baseUrl: 'https://api.fonnte.com',
    }
  },

  async sendOTP({ phone, code, expiryMinutes }: SendOTPParams): Promise<WhatsAppResponse> {
    const { apiKey, baseUrl } = this.getConfig()
    const res = await fetch(`${baseUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({
        target: phone,
        message: `Kode verifikasi Anda: *${code}*\n\nKode berlaku ${expiryMinutes} menit.\nJangan berikan kode ini ke siapapun.\n\n— Sistem Digital Paroki Santo Klemens`,
        delay: 0,
      }),
    })
    const data = await res.json()
    return {
      success: data.status === 'success' || data.status === true,
      messageId: data.id,
      error: data.reason || data.error,
    }
  },

  async sendMessage({ phone, message }: SendMessageParams): Promise<WhatsAppResponse> {
    const { apiKey, baseUrl } = this.getConfig()
    const res = await fetch(`${baseUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({ target: phone, message }),
    })
    const data = await res.json()
    return {
      success: data.status === 'success' || data.status === true,
      messageId: data.id,
      error: data.reason || data.error,
    }
  },
}

// ─── Provider Selector ───

function getProvider() {
  const providerName = process.env.WHATSAPP_PROVIDER || 'wablas'
  switch (providerName) {
    case 'fonnte':
      return Fonnte
    case 'whacenter':
      // TODO: Implementasi Whacenter jika diperlukan
      console.warn('Whacenter belum diimplementasi, fallback ke Wablas')
      return Wablas
    case 'wablas':
    default:
      return Wablas
  }
}

// ─── Public API ───

export async function sendOTP(phone: string, code: string): Promise<WhatsAppResponse> {
  const provider = getProvider()
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5')
  return provider.sendOTP({ phone, code, expiryMinutes })
}

export async function sendWhatsApp(phone: string, message: string): Promise<WhatsAppResponse> {
  const provider = getProvider()
  return provider.sendMessage({ phone, message })
}

export function generateOTP(length: number = 6): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)]
  }
  return otp
}
