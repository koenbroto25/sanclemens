import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { input_text, user_id, bot_type } = await request.json();
        const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookies().getAll() }, setAll(cs) { cs.forEach(({ name, value, options }) => cookies().set(name, value, options)) } } });

        // Implementasi 4-layer input filter
        // Layer 1: Basic profanity/hate speech filter
        // Layer 2: Contextual relevance filter (based on bot_type)
        // Layer 3: Security vulnerability filter (e.g., SQL injection attempts)
        // Layer 4: Emotional signal detection (if user_id is provided)

        let filtered_text = input_text;
        let filter_action = 'pass';
        let filter_reason = '';
        let emergency_sos = false;

        // Layer 1: Simple keyword-based profanity filter (contoh)
        const profaneWords = ['badword1', 'badword2']; // Contoh kata-kata kotor
        if (profaneWords.some(word => input_text.toLowerCase().includes(word))) {
            filter_action = 'block';
            filter_reason = 'Profanity detected';
            filtered_text = 'Filtered due to inappropriate content.';
        }

        // Layer 2: (Placeholder) Contextual relevance - can be integrated with AI model later
        // if (bot_type === 'learn_catholic' && !input_text.toLowerCase().includes('iman')) {
        //     filter_action = 'suggest_rephrase';
        //     filter_reason = 'Input not relevant to learning Catholic content';
        //     filtered_text = 'Mohon ajukan pertanyaan yang relevan dengan pembelajaran iman Katolik.';
        // }

        // Layer 3: (Placeholder) Security filter - more robust regex or library would be used
        // if (input_text.toLowerCase().includes('select * from')) {
        //     filter_action = 'block';
        //     filter_reason = 'Potential SQL injection attempt';
        //     filtered_text = 'Input blocked due to security concerns.';
        // }

        // Layer 4: (Placeholder) Emotional signal detection - integrate with dedicated AI model or NLP library
        // if (input_text.toLowerCase().includes('darurat') || input_text.toLowerCase().includes('tolong')) {
        //     emergency_sos = true;
        //     filter_action = 'pass_with_flag';
        //     filter_reason = 'Emergency keyword detected';
        // }

        // Log abuse if filtered or emergency flag
        if (filter_action !== 'pass' || emergency_sos) {
            await supabase.from('ai_abuse_logs').insert({
                bot_type: bot_type || 'unknown',
                user_id: user_id || null,
                original_input: input_text,
                filter_action: filter_action,
                filter_reason: filter_reason,
                response_given: filtered_text,
                emergency_sos: emergency_sos,
            });
        }

        return NextResponse.json({
            success: true,
            filtered_text,
            filter_action,
            filter_reason,
            emergency_sos,
        });

    } catch (error) {
        console.error('Server error in POST /api/ai/filter-input:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}