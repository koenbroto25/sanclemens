import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { user_id, related_match_id, match_type, feedback_status, outcome, rating, comments } = await request.json();
        const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookies().getAll() }, setAll(cs) { cs.forEach(({ name, value, options }) => cookies().set(name, value, options)) } } });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.id !== user_id) { // Ensure user can only submit feedback for themselves
            return NextResponse.json({ error: 'Unauthorized: Invalid user or not authenticated' }, { status: 401 });
        }

        const { data, error } = await supabase.from('match_feedback').insert({
            user_id: user.id,
            related_match_id,
            match_type,
            feedback_status,
            outcome,
            rating,
            comments,
        }).select().single();

        if (error) {
            console.error('Error saving match feedback:', error);
            return NextResponse.json({ error: 'Failed to save match feedback' }, { status: 500 });
        }

        // TODO: Trigger a background job or a database function to feed this feedback
        // into the "success learning algorithm" for future match score optimization.

        return NextResponse.json({ success: true, feedback: data });

    } catch (error) {
        console.error('Server error in POST /api/ai/matching/feedback:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}