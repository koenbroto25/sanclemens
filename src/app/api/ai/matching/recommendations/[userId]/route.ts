import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
    try {
        const { userId } = params;
        const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookies().getAll() }, setAll(cs) { cs.forEach(({ name, value, options }) => cookies().set(name, value, options)) } } });

        // Fetch recommendations from the cache table
        const { data: recommendations, error } = await supabase
            .from('user_ai_recommendations')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // No rows found
                return NextResponse.json({ message: 'No recommendations found for this user.' }, { status: 404 });
            }
            console.error('Error fetching user recommendations:', error);
            return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            recommendations: recommendations.recommendations_data,
            generated_at: recommendations.generated_at,
            next_refresh: recommendations.next_refresh,
        });

    } catch (error) {
        console.error('Server error in GET /api/ai/matching/recommendations/[userId]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}