import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET: Retrieve user's AI profile preferences
export async function GET(request: Request) {
    try {
        const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookies().getAll() }, setAll(cs) { cs.forEach(({ name, value, options }) => cookies().set(name, value, options)) } } });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized: User not authenticated' }, { status: 401 });
        }

        const { data: aiProfile, error } = await supabase
            .from('ai_user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // No rows found
                return NextResponse.json({ message: 'AI profile not found for this user.' }, { status: 404 });
            }
            console.error('Error fetching AI user profile:', error);
            return NextResponse.json({ error: 'Failed to fetch AI profile' }, { status: 500 });
        }

        return NextResponse.json({ success: true, ai_profile: aiProfile });

    } catch (error) {
        console.error('Server error in GET /api/user/ai-profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Update user's AI profile preferences
export async function POST(request: Request) {
    try {
        const updates = await request.json(); // Contains fields to update for ai_user_profiles
        const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookies().getAll() }, setAll(cs) { cs.forEach(({ name, value, options }) => cookies().set(name, value, options)) } } });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized: User not authenticated' }, { status: 401 });
        }

        const { data, error } = await supabase.from('ai_user_profiles').upsert(
            {
                user_id: user.id,
                ...updates,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
        ).select().single();

        if (error) {
            console.error('Error updating AI user profile:', error);
            return NextResponse.json({ error: 'Failed to update AI profile' }, { status: 500 });
        }

        return NextResponse.json({ success: true, ai_profile: data });

    } catch (error) {
        console.error('Server error in POST /api/user/ai-profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}