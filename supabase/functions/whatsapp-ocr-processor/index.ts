import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.24.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    )

    // Parse request body
    const body = await req.json()
    const { phone_number, message_type, media_url, media_type, message_body, sender_name } = body

    if (!phone_number || !message_type || message_type !== 'image') {
      return new Response(
        JSON.stringify({ error: 'Only image messages are supported for OCR processing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Find user by phone number
    const { data: user, error: userError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, role')
      .eq('phone', phone_number)
      .single()

    if (userError || !user) {
      console.error('User not found for phone:', phone_number)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Download image from media_url
    const imageResponse = await fetch(media_url)
    if (!imageResponse.ok) {
      throw new Error('Failed to download image from WhatsApp')
    }
    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBytes = new Uint8Array(imageBuffer)

    // Initialize Gemini AI for OCR
    const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_GEMINI_API_KEY') || '')
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' })

    // Convert image to base64
    const base64Image = btoa(String.fromCharCode.apply(null, Array.from(imageBytes)))

    // Call Gemini Vision API
    const result = await model.generateContent([
      'Extract all text from this Indonesian document image. Return only the extracted text, preserving the structure as much as possible.',
      { inlineData: { mimeType: media_type || 'image/jpeg', data: base64Image } }
    ])

    const extractedText = result.response.text()

    if (!extractedText || extractedText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'No text detected in image' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Determine document type from keywords
    const docType = detectDocumentType(extractedText)

    // Upload image to Cloudflare R2
    const r2Bucket = Deno.env.get('R2_BUCKET_NAME') || 'paroki-documents'
    const r2Key = `documents/${user.id}/${Date.now()}_whatsapp_ocr.${getFileExtension(media_type)}`
    
    const r2UploadUrl = `${Deno.env.get('R2_ENDPOINT')}/${r2Bucket}/${r2Key}`
    
    await fetch(r2UploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('R2_API_TOKEN')}`,
        'Content-Type': media_type || 'image/jpeg',
      },
      body: imageBytes,
    })

    const r2PublicUrl = `${Deno.env.get('R2_PUBLIC_URL')}/${r2Key}`

    // Save document record to database
    const { data: document, error: dbError } = await supabaseClient
      .from('documents')
      .insert({
        user_id: user.id,
        document_type: docType,
        file_name: `WhatsApp_OCR_${Date.now()}.jpg`,
        file_size: imageBytes.length,
        file_url: r2PublicUrl,
        r2_key: r2Key,
        extracted_text: extractedText,
        extracted_data: { source: 'whatsapp', sender_name },
        ocr_confidence: 0.9, // Placeholder - actual confidence from OCR
        status: 'pending_user_verification',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up R2 file
      await fetch(r2UploadUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('R2_API_TOKEN')}`,
        },
      })
      throw dbError
    }

    // Send notification back to user via Fonnte
    const notificationMessage = `
Assalamualaikum ${sender_name || user.full_name || 'Umat'},

Dokumen Anda berhasil diproses! Berikut adalah data yang diekstrak:

📄 *Tipe Dokumen*: ${docType}

📝 *Isi Dokumen*:
${extractedText.substring(0, 500)}${extractedText.length > 500 ? '...' : ''}

✅ Silakan verifikasi data ini di Digital Vault: 
${Deno.env.get('NEXT_PUBLIC_BASE_URL')}/user/digital-vault

_Jesus is Lord._
Paroki Santo Klemens Sepinggan
    `.trim()

    const notificationPayload = {
      recipient_ids: [phone_number],
      type: 'whatsapp_ocr_result',
      message: notificationMessage,
      data: {
        document_id: document.id,
        document_type: docType,
        extracted_text: extractedText,
      },
    }

    // Send notification via internal API
    const notificationRes = await fetch(`${Deno.env.get('NEXT_PUBLIC_BASE_URL')}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
      body: JSON.stringify(notificationPayload),
    })

    if (!notificationRes.ok) {
      console.error('Failed to send notification:', await notificationRes.text())
    }

    return new Response(
      JSON.stringify({ success: true, document_id: document.id, extracted_text: extractedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('WhatsApp OCR processor error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process OCR', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

/**
 * Detect document type from extracted text
 */
function detectDocumentType(text: string): string {
  const lowerText = text.toLowerCase()
  
  if (lowerText.includes('nik') || lowerText.includes('nama') && lowerText.includes('alamat')) {
    return 'ktp'
  }
  if (lowerText.includes('kartu keluarga') || lowerText.includes('kk') || lowerText.includes('kepala keluarga')) {
    return 'kk'
  }
  if (lowerText.includes('surat izin mengemudi') || lowerText.includes('sim')) {
    return 'sim'
  }
  if (lowerText.includes('akte') || lowerText.includes('kelahiran')) {
    return 'akte'
  }
  
  return 'unknown'
}

/**
 * Get file extension from media type
 */
function getFileExtension(mediaType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }
  return extensions[mediaType] || 'jpg'
}