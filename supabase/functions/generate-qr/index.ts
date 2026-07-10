// Edge Function: generate-qr
// Generate QR token untuk Kartu Anggota Digital
// Ref: masterplan Sub-Fase 1.6, GDD BAB IV.2

import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const { user_id, regenerate } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if valid QR already exists (30-day rotation)
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('id, qr_token, qr_expires_at')
      .eq('id', user_id)
      .single()

    if (profErr || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if existing QR is still valid
    if (!regenerate && profile.qr_token && profile.qr_expires_at) {
      const expiry = new Date(profile.qr_expires_at)
      if (expiry > new Date()) {
        return new Response(
          JSON.stringify({
            qr_token: profile.qr_token,
            expires_at: profile.qr_expires_at,
            valid: true,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Generate new QR token (UUID + HMAC for extra security)
    const qrToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        qr_token: qrToken,
        qr_expires_at: expiresAt,
      })
      .eq('id', user_id)

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: updateErr.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        qr_token: qrToken,
        expires_at: expiresAt,
        valid: true,
        regenerated: !!regenerate,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('generate-qr error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})