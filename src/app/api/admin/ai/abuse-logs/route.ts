import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

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

        // Query ai_abuse_logs table
        const { data: abuseLogs, error } = await supabase
            .from('ai_abuse_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching AI abuse logs:', error);
            return NextResponse.json({ error: 'Failed to fetch abuse logs' }, { status: 500 });
        }

        return NextResponse.json({ success: true, abuse_logs: abuseLogs });

    } catch (error) {
        console.error('Server error in GET /api/admin/ai/abuse-logs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}