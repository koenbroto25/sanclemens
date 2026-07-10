// Edge Function: morning-check-lansia
// Cron job 06:00 WITA — cek status lansia & alert ke KL
// Ref: GDD BAB VIII.3, masterplan Sub-Fase 1.10

import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5'

serve(async (req) => {
  // This function runs on a cron schedule (06:00 WITA daily)
  // For testing, accept GET requests as well
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const today = new Date().toISOString().split('T')[0]
    console.log(`Morning check for: ${today}`)

    // 1. Get all lansia users (is_lansia = true, status = active)
    const { data: lansia, error: lansiaErr } = await supabase
      .from('profiles')
      .select('id, full_name, last_morning_check, lingkungan_id, lingkungan_slug')
      .eq('is_lansia', true)
      .eq('status', 'active')

    if (lansiaErr) {
      console.error('Error fetching lansia:', lansiaErr.message)
      return new Response(
        JSON.stringify({ error: lansiaErr.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${lansia.length} lansia profiles`)

    let notResponded = 0
    let alertedKL = 0

    for (const person of lansia) {
      // 2. Check if they already responded today
      const lastCheck = person.last_morning_check
        ? new Date(person.last_morning_check)
        : null

      const respondedToday = lastCheck &&
        lastCheck.toISOString().split('T')[0] === today

      if (respondedToday) continue

      notResponded++

      // 3. Check consecutive missed days
      let consecutiveMissed = 0
      if (lastCheck) {
        const daysSince = Math.floor(
          (Date.now() - lastCheck.getTime()) / (1000 * 60 * 60 * 24)
        )
        consecutiveMissed = daysSince
      } else {
        consecutiveMissed = 999 // Never responded
      }

      // 4. Alert KL if 2+ consecutive missed
      if (consecutiveMissed >= 2 && person.lingkungan_id) {
        // Find KL for this lingkungan
        const { data: kl } = await supabase
          .from('profiles')
          .select('id, full_name, fcm_token, phone')
          .eq('lingkungan_id', person.lingkungan_id)
          .eq('role', 'ketua_lingkungan')
          .eq('status', 'active')
          .limit(1)
          .single()

        if (kl) {
          // Insert notification
          await supabase.from('notifications').insert({
            user_id: kl.id,
            judul: '⚠️ Morning Check Lansia — Tidak Merespons',
            pesan: `${person.full_name} (${person.lingkungan_slug || 'unknown'}) belum merespons morning check selama ${consecutiveMissed} hari.`,
            tipe: 'warning',
            action_url: `/lansia/${person.id}`,
          })
          alertedKL++
        }
      }
    }

    return new Response(
      JSON.stringify({
        date: today,
        total_lansia: lansia.length,
        not_responded: notResponded,
        alerted_kl: alertedKL,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('morning-check-lansia error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})