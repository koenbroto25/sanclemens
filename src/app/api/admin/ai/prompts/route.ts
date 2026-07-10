import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET: Retrieve all AI prompts
export async function GET(request: Request) {
    try {
        const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookies().getAll() }, setAll(cs) { cs.forEach(({ name, value, options }) => cookies().set(name, value, options)) } } });
        const { data: { user } } = await supabase.auth.getUser();

        // Ensure user is authenticated and has admin privileges (access_layer >= 6)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized: User not authenticated' }, { status: 401 });
        }
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('access_layer')
            .eq('id', user.id)
            .single();

        if (profileError || !profile || profile.access_layer < 6) {
            return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
        }

        const { data: prompts, error } = await supabase
            .from('ai_prompts')
            .select('*')
            .order('bot_type', { ascending: true })
            .order('version', { ascending: false });

        if (error) {
            console.error('Error fetching AI prompts:', error);
            return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
        }

        return NextResponse.json({ success: true, prompts });

    } catch (error) {
        console.error('Server error in GET /api/admin/ai/prompts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Add or update an AI prompt
export async function POST(request: Request) {
    try {
        const { id, bot_type, prompt_text, description, version, is_active, is_ab_test, ab_test_percentage, change_notes, performance_notes } = await request.json();
        const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookies().getAll() }, setAll(cs) { cs.forEach(({ name, value, options }) => cookies().set(name, value, options)) } } });
        const { data: { user } } = await supabase.auth.getUser();

        // Ensure user is authenticated and has admin privileges (access_layer >= 6)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized: User not authenticated' }, { status: 401 });
        }
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, access_layer')
            .eq('id', user.id)
            .single();

        if (profileError || !profile || profile.access_layer < 6) {
            return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
        }

        const promptData = {
            bot_type,
            prompt_text,
            description,
            version: version || 1,
            is_active: is_active ?? false,
            is_ab_test: is_ab_test ?? false,
            ab_test_percentage: ab_test_percentage ?? 0,
            change_notes,
            approved_by: profile.id, // User who is updating/creating the prompt
            approved_at: new Date().toISOString(),
            performance_notes,
            updated_at: new Date().toISOString()
        };

        let result;
        let upsertError;

        if (id) {
            // Update existing prompt
            const { data, error } = await supabase
                .from('ai_prompts')
                .update(promptData)
                .eq('id', id)
                .select()
                .single();
            result = data;
            upsertError = error;
        } else {
            // Insert new prompt
            const { data, error } = await supabase
                .from('ai_prompts')
                .insert(promptData)
                .select()
                .single();
            result = data;
            upsertError = error;
        }

        if (upsertError) {
            console.error('Error upserting AI prompt:', upsertError);
            return NextResponse.json({ error: 'Failed to save prompt' }, { status: 500 });
        }

        return NextResponse.json({ success: true, prompt: result });

    } catch (error) {
        console.error('Server error in POST /api/admin/ai/prompts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}