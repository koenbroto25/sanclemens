export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { recipient_ids, type, message, data } = await request.json();

        // Panggil Supabase Edge Function
        const edgeFunctionUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/send-notification'; 
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

        if (!serviceRoleKey) {
            throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured.');
        }

        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${serviceRoleKey}`, // Menggunakan Service Role Key untuk otentikasi ke Edge Function dari server Next.js
            },
            body: JSON.stringify({ recipient_ids, type, message, data, sender_id: user.id }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Edge Function error:', result.error);
            return NextResponse.json({ error: result.error || 'Failed to send notification via Edge Function' }, { status: response.status });
        }

        return NextResponse.json({
            success: true,
            message: 'Notification request forwarded to Edge Function',
            edgeFunctionResponse: result,
        });
    } catch (error) {
        console.error('Notification API route error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}