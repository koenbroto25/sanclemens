import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { session_date, mode_sequence, message_count, messages_encrypted, iv, has_emergency_flag } = await request.json();
        const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookies().getAll() }, setAll(cs) { cs.forEach(({ name, value, options }) => cookies().set(name, value, options)) } } });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized: User not authenticated' }, { status: 401 });
        }

        const { data, error } = await supabase.from('chat_sessions').insert({
            user_id: user.id,
            session_date,
            mode_sequence,
            message_count,
            messages_encrypted, // This should be BYTEA data, ensure proper handling
            iv,
            has_emergency_flag: has_emergency_flag ?? false,
        }).select().single();

        if (error) {
            console.error('Error saving chat session:', error);
            return NextResponse.json({ error: 'Failed to save chat session' }, { status: 500 });
        }

        return NextResponse.json({ success: true, session: data });

    } catch (error) {
        console.error('Server error in POST /api/user/companion/sessions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}