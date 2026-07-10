import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';
import { sendWhatsAppMessage } from '../_shared/fonnte.ts'; // Menggunakan fonnte.ts dari _shared

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Pastikan hanya permintaan dengan Service Role Key yang valid yang bisa memanggil Edge Function ini
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response('Unauthorized - Missing or invalid Authorization header', { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        if (token !== Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
            return new Response('Unauthorized - Invalid Service Role Key', { status: 401 });
        }

        const { recipient_ids, type, message, data, sender_id, template_key } = await req.json();

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { global: { headers: { 'x-notifications-function': 'true' } } }
        );

        // 1. Simpan notifikasi ke database
        const notifications = recipient_ids.map((recipientId: string) => ({
            recipient_id: recipientId,
            sender_id: sender_id, // sender_id akan diteruskan dari Next.js API route
            type,
            message, // Pesan ini bisa berupa template atau pesan final
            data: data || {},
            status: 'pending',
        }));

        const { error: dbError } = await supabase
            .from('notifications')
            .insert(notifications);

        if (dbError) {
            console.error('Create notification error:', dbError);
            return new Response(JSON.stringify({ error: 'Failed to create notification in DB' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            });
        }

        // 2. Logika Pengiriman Notifikasi Aktif (Fonnte/WhatsApp)
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('phone_number') // Asumsi ada kolom phone_number di tabel profiles
            .in('id', recipient_ids);

        if (profileError) {
            console.error('Error fetching recipient profiles:', profileError);
            // Lanjutkan tanpa mengirim WA, tapi log error
        }

        if (profiles) {
            // Fetch template from database
            let finalMessageContent = message; // Default to message from payload
            if (template_key && type) {
                const { data: templateData, error: templateError } = await supabase
                    .from('notification_templates')
                    .select('pesan_template')
                    .eq('template_key', template_key)
                    .eq('tipe', type) // Filter by type as well, if needed
                    .single();

                if (templateData && !templateError) {
                    finalMessageContent = templateData.pesan_template;
                    // Simple placeholder replacement logic (e.g., {{key}})
                    for (const key in data) {
                        // Handle conditional blocks like {{#if maps_link}}
                        if (key === 'maps_link' && !data[key]) {
                            finalMessageContent = finalMessageContent.replace(/\{\{#if\s+maps_link\}\}.*?\{\{\/if\}\}/gs, '');
                        } else {
                            finalMessageContent = finalMessageContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), data[key]);
                        }
                    }
                } else if (templateError) {
                    console.warn(`Template for key "${template_key}" and type "${type}" not found or error:`, templateError);
                }
            }


            for (const profile of profiles) {
                if (profile.phone_number) {
                    await sendWhatsAppMessage(profile.phone_number, finalMessageContent, { priority: 'high' });
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Notifications stored and processed for ${recipient_ids.length} recipients`,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Notification Edge Function error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});