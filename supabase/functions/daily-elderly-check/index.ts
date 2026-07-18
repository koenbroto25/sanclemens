import { createClient } from '@supabase/supabase-js';
import { serve } from 'std/http';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables.');
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // This is a placeholder logic.
    // In a real scenario, you would query profiles for elderly users
    // and their contact information (e.g., based on age or a 'is_elderly' flag).
    // For now, let's assume we send a general reminder message.

    // Fetch all active users for demonstration.
    // In production, this query needs to be refined to target actual elderly users.
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('phone, full_name')
      .eq('status', 'active'); // Assuming active users are the target

    if (profilesError) {
      console.error('Error fetching profiles for daily check:', profilesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch profiles' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const notificationPromises = profiles
      .filter(profile => profile.phone) // Only send to profiles with phone numbers
      .map(async (profile) => {
        const message = `
*Daily Elderly Check - Paroki Santo Klemens*

Assalamualaikum ${profile.full_name || 'Umat'},

Semoga Anda selalu dalam keadaan sehat dan penuh berkat. Ingatlah untuk selalu menjaga kesehatan, beribadah, dan tetap semangat.

Jika Anda membutuhkan bantuan atau sekadar ingin bercerita, tim pastoral kami siap mendengarkan.

_Jesus is Lord._
Paroki Santo Klemens Sepinggan
        `.trim();

        const notificationPayload = {
          recipient_ids: [profile.phone],
          type: 'daily_elderly_check',
          message: message,
          data: {
            user_id: profile.id, // Assuming profile.id exists, or use user.id if fetching from auth
            check_type: 'daily',
          }
        };

        // Call the internal API route for notifications
        // This requires NEXT_PUBLIC_BASE_URL to be set in the Edge Function's environment
        const notificationRes = await fetch(`${Deno.env.get('NEXT_PUBLIC_BASE_URL') || 'http://localhost:3000'}/api/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notificationPayload),
        });

        if (!notificationRes.ok) {
          console.error(`Failed to send elderly check notification to ${profile.phone}:`, await notificationRes.text());
        } else {
          console.log('Elderly check notification sent successfully to:', profile.phone);
        }
      });

    await Promise.all(notificationPromises);

    return new Response(JSON.stringify({ success: true, message: 'Daily elderly check notifications initiated.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Daily elderly check Edge Function error:', error);
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan server saat menjalankan Daily Elderly Check' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});