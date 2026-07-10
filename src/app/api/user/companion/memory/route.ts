import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { memory_encrypted, iv, last_updated_session_id } = await request.json();
        const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookies().getAll() }, setAll(cs) { cs.forEach(({ name, value, options }) => cookies().set(name, value, options)) } } });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized: User not authenticated' }, { status: 401 });
        }

        const { data, error } = await supabase.from('spiritual_memory').upsert({
            user_id: user.id,
            memory_encrypted, // This should be BYTEA data, ensure proper handling
            iv,
            last_updated_session_id,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' }).select().single();

        if (error) {
            console.error('Error saving spiritual memory:', error);
            return NextResponse.json({ error: 'Failed to save spiritual memory' }, { status: 500 });
        }

        return NextResponse.json({ success: true, spiritual_memory: data });

    } catch (error) {
        console.error('Server error in POST /api/user/companion/memory:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}