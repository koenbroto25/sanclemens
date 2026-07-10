import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { user_id, message } = await request.json();
        const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookies().getAll() }, setAll(cs) { cs.forEach(({ name, value, options }) => cookies().set(name, value, options)) } } });

        // Placeholder for AI intent detection logic
        // In a real scenario, this would call an external AI model (e.g., OpenAI, Gemini)
        // to analyze the 'message' and return detected intents and entities.

        const detected_intents: ('cari_kerja' | 'tawarkan_keahlian' | 'butuh_bantuan' | 'tawarkan_donasi' | 'tidak_ada')[] = [];
        let entities = {};
        let overall_confidence = 0.0;
        const intents_with_confidence: { intent: string; confidence: number }[] = [];

        const lowerCaseMessage = message.toLowerCase();

        // Check for multiple intents
        if (lowerCaseMessage.includes('cari kerja') || lowerCaseMessage.includes('lowongan')) {
            detected_intents.push('cari_kerja');
            intents_with_confidence.push({ intent: 'cari_kerja', confidence: 0.8 });
        }
        if (lowerCaseMessage.includes('tawarkan keahlian') || lowerCaseMessage.includes('butuh pekerja')) {
            detected_intents.push('tawarkan_keahlian');
            intents_with_confidence.push({ intent: 'tawarkan_keahlian', confidence: 0.8 });
        }
        if (lowerCaseMessage.includes('butuh bantuan') || lowerCaseMessage.includes('darurat') || lowerCaseMessage.includes('perlu pertolongan')) {
            detected_intents.push('butuh_bantuan');
            intents_with_confidence.push({ intent: 'butuh_bantuan', confidence: 0.9 });
        }
        if (lowerCaseMessage.includes('tawarkan donasi') || lowerCaseMessage.includes('ingin membantu')) {
            detected_intents.push('tawarkan_donasi');
            intents_with_confidence.push({ intent: 'tawarkan_donasi', confidence: 0.8 });
        }

        if (detected_intents.length === 0) {
            detected_intents.push('tidak_ada');
            intents_with_confidence.push({ intent: 'tidak_ada', confidence: 0.5 });
        }

        // Calculate overall confidence (e.g., average or max of detected intents)
        overall_confidence = intents_with_confidence.reduce((sum, item) => sum + item.confidence, 0) / intents_with_confidence.length;


        // Update umat_needs table
        if (user_id) {
            const { data: existingNeeds, error: fetchError } = await supabase
                .from('umat_needs')
                .select('intent_history, need_type_array, urgency')
                .eq('user_id', user_id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
                console.error('Error fetching existing umat_needs:', fetchError);
            }

            const currentIntentHistory = existingNeeds?.intent_history || [];
            const updatedIntentHistory = [...currentIntentHistory, { intents: detected_intents, message, timestamp: new Date().toISOString(), confidence: overall_confidence }];

            // Placeholder for extracting/updating need_type_array and urgency
            let updatedNeedTypeArray = existingNeeds?.need_type_array || [];
            let updatedUrgency = existingNeeds?.urgency || 'low';

            if (detected_intents.includes('butuh_bantuan')) {
                // Example: simple logic to infer need_type_array and urgency
                if (lowerCaseMessage.includes('sembako')) {
                    if (!updatedNeedTypeArray.includes('sembako')) updatedNeedTypeArray.push('sembako');
                }
                if (lowerCaseMessage.includes('medis')) {
                    if (!updatedNeedTypeArray.includes('medis')) updatedNeedTypeArray.push('medis');
                }
                if (lowerCaseMessage.includes('mendesak') || lowerCaseMessage.includes('segera')) {
                    updatedUrgency = 'high';
                }
                if (lowerCaseMessage.includes('darurat')) {
                    updatedUrgency = 'critical';
                }
            }


            const { error: updateError } = await supabase
                .from('umat_needs')
                .upsert({
                    user_id: user_id,
                    last_ai_interaction: new Date().toISOString(),
                    intent_history: updatedIntentHistory,
                    need_type_array: updatedNeedTypeArray, // Update based on detected intents
                    urgency: updatedUrgency, // Update based on detected intents
                }, { onConflict: 'user_id' });

            if (updateError) {
                console.error('Error updating umat_needs:', updateError);
            }
        }

        return NextResponse.json({
            success: true,
            detected_intents,
            confidence: overall_confidence,
            entities,
            message: 'Intent detection processed with multi-intent handling.',
        });

    } catch (error) {
        console.error('Server error in POST /api/ai/umat-needs/detect:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}