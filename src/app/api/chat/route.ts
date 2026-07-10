export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { spiritualCompanionPrompt, bot1PublicInfoPrompt, intentClassifierPrompt, matchMakerPrompt } from '@/data/prompts/spiritualCompanionPrompt';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // 1. AUTHENTICATION
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. GET USER PROFILE & CONTEXT
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 3. GET USER SETTINGS (AI PREFERENCES)
    const { data: settings } = await supabase
      .from('user_ai_settings')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    // 4. GET AI CREDENTIALS (system key or user key)
    const envApiKey = process.env.OPENROUTER_API_KEY;
    const useOwnKey = settings?.is_using_own_api && settings?.openrouter_api_key;
    const apiKey = useOwnKey ? settings.openrouter_api_key : envApiKey;

    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    // 5. PARSE REQUEST
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 6. INTENT CLASSIFICATION (using LLM)
    const intentResult = await classifyIntent(message, apiKey);
    
    // 7. ROUTING BASED ON INTENT
    let systemPrompt: string;
    let botName: string;
    let requiresSOS = false;

    switch (intentResult.intent) {
      case 'spiritual':
      case 'pastoral':
        systemPrompt = `${spiritualCompanionPrompt}\n\nUSER CONTEXT:\n- Nama: ${profile.nama_baptis || profile.full_name}\n- Lingkungan: ${profile.lingkungan_slug || 'N/A'}\n- Role: ${profile.role}`;
        botName = 'Klemen';
        break;
      
      case 'sos_emergency':
        requiresSOS = true;
        systemPrompt = `${spiritualCompanionPrompt}\n\n!!! EMERGENCY SOS DETECTED !!!\nActivate immediate SOS protocol.`;
        botName = 'Klemen (SOS)';
        break;
      
      case 'ekonomi':
        systemPrompt = `${matchMakerPrompt}\n\nUSER CONTEXT:\n- ID: ${profile.id}\n- Role: ${profile.role}\n\nMATCHING REQUEST:\n${message}`;
        botName = 'AI Matcher';
        break;
      
      case 'administratif':
      case 'info_paroki':
      default:
        systemPrompt = `${bot1PublicInfoPrompt}\n\nUSER CONTEXT:\n- Nama: ${profile.nama_baptis || profile.full_name}\n- Lingkungan: ${profile.lingkungan_slug || 'N/A'}`;
        botName = 'ParokiBot';
        break;
    }

    // 8. CALL LLM (OpenRouter API)
    const llmResponse = await callLLM({
      apiKey,
      systemPrompt,
      message,
      conversationHistory,
      botName
    });

    // 9. IF SOS, TRIGGER SOS API
    if (requiresSOS) {
      // Trigger SOS in background (fire & forget)
      fetch(`${request.url.split('/api/')[0]}/api/sos/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenis_sos: intentResult.intent,
          kondisi: message,
          priority: 'emergency'
        })
      }).catch(err => console.error('SOS trigger failed:', err));
    }

    // 10. LOG INTERACTION
    await supabase.from('ai_interaction_logs').insert({
      user_id: profile.id,
      bot_name: botName,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      user_message: message,
      bot_response: llmResponse.response,
      requires_sos: requiresSOS,
      metadata: {
        emotional_signal: detectEmotionalSignal(message),
        entities: intentResult.entities
      }
    });

    // 11. UPDATE EMOTIONAL SIGNAL IN PROFILE
    const emotionalSignal = detectEmotionalSignal(message);
    await supabase
      .from('profiles')
      .update({
        emotional_signal_last_session: emotionalSignal,
        emotional_signal_updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    // 12. RETURN RESPONSE
    return NextResponse.json({
      response: llmResponse.response,
      bot: botName,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      emotional_signal: emotionalSignal,
      sos_triggered: requiresSOS
    });

  } catch (error) {
    console.error('Error in POST /api/chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function classifyIntent(message: string, apiKey: string): Promise<any> {
  const prompt = `${intentClassifierPrompt}\n\nClassify this message:\n"${message}"\n\nRespond ONLY with JSON, no markdown.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-precision',
        messages: [
          { role: 'system', content: intentClassifierPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 200,
        temperature: 0.3
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { intent: 'general', confidence: 0.5 };
  } catch (error) {
    console.error('Intent classification failed:', error);
    return { intent: 'general', confidence: 0.5 };
  }
}

async function callLLM({
  apiKey,
  systemPrompt,
  message,
  conversationHistory,
  botName
}: any): Promise<{ response: string }> {
  try {
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Last 10 messages for context
      { role: 'user', content: message }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-precision',
        messages,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    const data = await response.json();
    return {
      response: data.choices?.[0]?.message?.content || 'Maaf, saya tidak dapat merespons saat ini.'
    };
  } catch (error) {
    console.error('LLM call failed:', error);
    return { response: 'Maaf, terjadi kesalahan sistem. Silakan coba lagi.' };
  }
}

function detectEmotionalSignal(message: string): string {
  const lower = message.toLowerCase();
  
  // Emergency keywords
  if (lower.match(/bunuh diri|mati|tidak ingin hidup|darurat|tolong banget|benta/)) {
    return 'emergency';
  }
  
  // Moderate distress
  if (lower.match(/putus asa|depresi|sangat sedih|gak ada harapan|payah/)) {
    return 'distress_moderate';
  }
  
  // Mild distress
  if (lower.match(/sedih|khawatir|cuma|galau|stress|pusing/)) {
    return 'distress_mild';
  }
  
  // Positive
  if (lower.match(/syukur|bahagia|alhamdulillah|senang|bersyukur/)) {
    return 'positive';
  }
  
  return 'neutral';
}