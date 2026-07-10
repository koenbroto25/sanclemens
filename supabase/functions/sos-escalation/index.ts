import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';

// --- Helper Functions (Mock for now, replace with actual implementations) ---

// Function to send FCM critical notifications
async function sendFCMCritical(fcmTokens: string[], payload: any): Promise<void> {
  console.log('Sending FCM critical notification to:', fcmTokens, 'with payload:', payload);
  const FIREBASE_SERVER_KEY = Deno.env.get('FIREBASE_SERVER_KEY'); // Should be a secret
  if (!FIREBASE_SERVER_KEY) {
    console.error('FIREBASE_SERVER_KEY is not set');
    return;
  }
  if (fcmTokens.length === 0) {
    console.log('No FCM tokens provided. Skipping FCM notification.');
    return;
  }

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FIREBASE_SERVER_KEY}`,
      },
      body: JSON.stringify({
        registration_ids: fcmTokens,
        notification: {
          title: payload.title,
          body: payload.body,
          sound: 'sos.wav', // Custom sound for critical alerts
          priority: 'high',
        },
        data: payload.data,
      }),
    });
    const result = await response.json();
    console.log('FCM result:', result);
    if (result.failure > 0) {
      console.error('FCM failed for some tokens:', result);
    }
  } catch (error) {
    console.error('Error sending FCM notification:', error);
  }
}

// Function to send WhatsApp backup (using Fonnte or wa.me)
async function sendWhatsAppBackup(phoneNumbers: string[], message: string): Promise<void> {
  console.log('Sending WhatsApp backup to:', phoneNumbers, 'with message:', message);
  const FONNTE_API_URL = Deno.env.get('FONNTE_API_URL');
  const FONNTE_TOKEN = Deno.env.get('FONNTE_TOKEN');
  if (!FONNTE_API_URL || !FONNTE_TOKEN) {
    console.warn('Fonnte API credentials not set, skipping WhatsApp backup.');
    return;
  }
  if (phoneNumbers.length === 0) {
    console.log('No phone numbers provided. Skipping WhatsApp backup.');
    return;
  }

  for (const phone of phoneNumbers) {
    try {
      const formData = new FormData();
      formData.append('target', phone);
      formData.append('message', message);
      formData.append('countryCode', '62'); // Indonesia
      const response = await fetch(FONNTE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': FONNTE_TOKEN,
        },
        body: formData,
      });
      const result = await response.json();
      console.log(`WhatsApp to ${phone} result:`, result);
      if (!result.status || result.status === 'error') {
        console.error(`WhatsApp failed for ${phone}:`, result);
      }
    } catch (error) {
      console.error(`Error sending WhatsApp to ${phone}:`, error);
    }
  }
}

serve(async (req) => {
  if (req.method !== 'POST') { // Should ideally be triggered by a POST from pg_cron
    return new Response('Method Not Allowed', { status: 405 });
  }

  const supabase = createClient({
    supabaseUrl: Deno.env.get('SUPABASE_URL'),
    supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), // Use service role key
  });

  try {
    const now = new Date();

    // 1. Query for active escalation timers that are due
    const { data: dueTimers, error: timersError } = await supabase
      .from('sos_escalation_timers')
      .select('*')
      .lte('scheduled_at', now.toISOString())
      .is('executed_at', null)
      .is('cancelled_at', null)
      .order('scheduled_at', { ascending: true });

    if (timersError) {
      console.error('Error fetching due escalation timers:', timersError);
      throw timersError;
    }

    for (const timer of dueTimers) {
      // Check current SOS status
      const { data: sosRecord, error: sosError } = await supabase
        .from('pastoral_sos')
        .select('status, triggered_by, jenis_kedaruratan, deskripsi, location_address, kontak_keluarga')
        .eq('id', timer.sos_id)
        .single();

      if (sosError) {
        console.error(`Error fetching SOS record ${timer.sos_id}:`, sosError);
        continue;
      }

      // Only escalate if SOS is still 'triggered' or 'acknowledged' (not completed/cancelled)
      if (sosRecord && ['triggered', 'acknowledged', 'in_progress'].includes(sosRecord.status)) {
        let nextTargetId: string | null = null;
        let nextTargetRole: string | null = null;
        let nextPhone: string | null = null;
        let notificationMessage: string;

        // Get parish contact numbers
        const { data: parishProfile, error: profileError } = await supabase
          .from('parish_profile')
          .select('pastor_phone, vikaris_phone, wk1_phone, keuskupan_emergency_phone')
          .limit(1)
          .single();

        if (profileError) {
          console.error('Error fetching parish profile for escalation:', profileError);
          continue;
        }

        const sosTypeLabel = sosRecord.jenis_kedaruratan || 'Kedaruratan Pastoral';
        const notificationTitle = `🚨 ESKALASI SOS - ${sosTypeLabel} (Level ${timer.level})`;
        const notificationBodyBase = `Dari Umat: ${sosRecord.triggered_by}\nDeskripsi: ${sosRecord.deskripsi}\nLokasi: ${sosRecord.location_address || 'tidak disebutkan'}\nKontak: ${sosRecord.kontak_keluarga || '-'}`;


        // Determine next escalation target based on level
        switch (timer.level) {
          case 1: // Pastor (first 15 min) -> escalate to Vikaris (total 30 min)
            nextTargetRole = 'vikaris';
            nextPhone = parishProfile?.vikaris_phone;
            notificationMessage = `Eskalasi ke Vikaris: ${notificationBodyBase}`;
            
            // Get Vikaris ID for logging
            const { data: vikarisProfile } = await supabase.from('profiles').select('id').eq('role', 'vikaris').single();
            nextTargetId = vikarisProfile?.id || null;

            break;
          case 2: // Vikaris (next 15 min) -> escalate to Wakil Ketua I (total 60 min)
            nextTargetRole = 'wakil_ketua_i';
            nextPhone = parishProfile?.wk1_phone;
            notificationMessage = `Eskalasi ke Wakil Ketua I: ${notificationBodyBase}`;
            
            // Get WK1 ID for logging
            const { data: wk1Profile } = await supabase.from('profiles').select('id').eq('role', 'wakil_ketua_i').single();
            nextTargetId = wk1Profile?.id || null;

            break;
          case 3: // Wakil Ketua I (next 30 min) -> escalate to Keuskupan (total 120 min)
            nextTargetRole = 'keuskupan';
            nextPhone = parishProfile?.keuskupan_emergency_phone;
            notificationMessage = `🚨 ESKALASI AKHIR KEUSKUPAN - ${sosTypeLabel}: ${notificationBodyBase}`;
            break;
          default:
            console.warn(`Unknown escalation level: ${timer.level} for SOS ${timer.sos_id}`);
            continue;
        }

        if (nextTargetId || nextPhone) {
          // Send FCM to next target's FCM token (if available)
          if (nextTargetId) {
            const { data: targetProfile } = await supabase
              .from('profiles')
              .select('fcm_token')
              .eq('id', nextTargetId)
              .single();
            if (targetProfile?.fcm_token) {
              await sendFCMCritical([targetProfile.fcm_token], {
                title: notificationTitle,
                body: notificationMessage,
                data: { sosId: timer.sos_id, type: sosRecord.sos_type, userId: sosRecord.triggered_by, level: timer.level + 1 },
              });
              await supabase.from('sos_notification_log').insert({
                sos_id: timer.sos_id,
                channel: 'fcm',
                target_user_id: nextTargetId,
                target_role: nextTargetRole,
                status: 'sent',
              });
            }
          }

          // Send WhatsApp backup to next target
          if (nextPhone) {
            await sendWhatsAppBackup([nextPhone], notificationMessage);
             await supabase.from('sos_notification_log').insert({
              sos_id: timer.sos_id,
              channel: 'whatsapp',
              target_phone: nextPhone,
              target_role: nextTargetRole,
              status: 'sent',
            });
          }
        }
        
        // Update pastoral_sos record with escalation info
        await supabase
          .from('pastoral_sos')
          .update({ escalated_to: nextTargetId, status: 'in_progress' }) // 'in_progress' to indicate active escalation
          .eq('id', timer.sos_id);

        // Mark timer as executed
        await supabase
          .from('sos_escalation_timers')
          .update({ executed_at: now.toISOString(), escalated_to_user_id: nextTargetId })
          .eq('id', timer.id);

        // Schedule next escalation if applicable
        if (timer.level < 3) { // Max level is 4 (Keuskupan), so schedule up to level 3
            const nextDelay = timer.level === 1 ? 15 * 60 * 1000 : 30 * 60 * 1000; // 15 min for next to vikaris, 30 min for next to WK1
            let nextEscalatedToUserId: string | null = null;
            if (timer.level === 1) { // Current target was Pastor, next is Vikaris
                 const { data: vikarisProfile } = await supabase.from('profiles').select('id').eq('role', 'vikaris').single();
                 nextEscalatedToUserId = vikarisProfile?.id || null;
            } else if (timer.level === 2) { // Current target was Vikaris, next is WK1
                 const { data: wk1Profile } = await supabase.from('profiles').select('id').eq('role', 'wakil_ketua_i').single();
                 nextEscalatedToUserId = wk1Profile?.id || null;
            }
            await scheduleEscalation(supabase, timer.sos_id, timer.level, nextDelay, nextEscalatedToUserId);
        } else if (timer.level === 3) {
            // Final escalation to Keuskupan. No further app-side escalation.
            // Mark the SOS as CRITICAL if not handled by this point.
            await supabase
                .from('pastoral_sos')
                .update({ status: 'critical' }) // Final critical status
                .eq('id', timer.sos_id);
        }


      } else if (sosRecord && ['completed', 'cancelled'].includes(sosRecord.status)) {
        // If SOS is already completed or cancelled, cancel the timer
        await supabase
          .from('sos_escalation_timers')
          .update({ cancelled_at: now.toISOString() })
          .eq('id', timer.id);
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Escalation check completed.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in sos-escalation Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});