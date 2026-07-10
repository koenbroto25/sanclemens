import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/auth/get-current-user';
import { retrieveKnowledge, generateQueryEmbedding, RetrievalContext } from '@/lib/ai/retriever';
import { generateLLMResponse } from '@/lib/ai/llm';

export const dynamic = 'force-dynamic';

interface BotChatRequest {
  bot_id: string;
  message: string;
  session_id?: string;
  chat_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface BotChatResponse {
  success: boolean;
  bot_id: string;
  bot_name: string;
  response: string;
  sources: Array<{ content: string; source_reference: string }>;
  retrieval_path: string;
  is_guest: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: BotChatRequest = await request.json();
    const { bot_id, message, session_id, chat_history = [] } = body;

    if (!bot_id || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: bot_id, message' },
        { status: 400 }
      );
    }

    // Get user session
    const user = await getCurrentUserProfile();
    const accessLayer = user?.access_layer ?? 0;

    // Get bot configuration from DB
    const supabase = createClient();
    const { data: botConfig, error: botConfigError } = await supabase
      .from('bot_configs')
      .select('*')
      .eq('bot_id', bot_id)
      .single();

    if (botConfigError || !botConfig) {
      return NextResponse.json(
        { error: `Bot configuration not found for bot_id: ${bot_id}` },
        { status: 404 }
      );
    }

    // Check access level
    if (accessLayer < botConfig.access_level_min) {
      return NextResponse.json({
        success: false,
        bot_id,
        bot_name: botConfig.bot_name || 'Unknown Bot',
        response: 'Maaf, Anda tidak memiliki akses untuk menggunakan bot ini.',
        sources: [],
        retrieval_path: 'access_denied',
        is_guest: !user
      });
    }

    // Classify intent (simple fallback)
    const domain = botConfig.primary_domain || 'general';
    
    // Generate embedding
    const queryEmbedding = await generateQueryEmbedding(message);

    // Retrieve knowledge using v6.0 retrieval
    const retrievalContext: RetrievalContext = {
      query: message,
      embedding: queryEmbedding,
      domain,
      bot_id,
      user_access_level: accessLayer
    };

    const retrievalResult = await retrieveKnowledge(retrievalContext, botConfig.bot_access || []);

    // Build context from sources
    const contextText = retrievalResult.sources
      .map((s, i) => `[${i + 1}] ${s.sourceReference}: ${s.contentPreview}`)
      .join('\n\n');

    // Generate response using LLM
    const botName = botConfig.bot_name || 'AI Assistant';
    const prompt = `Kamu adalah ${botName}, asisten AI untuk Paroki Santo Klemens.

Konteks dari basis pengetahuan:
${contextText || 'Tidak ada konteks yang tersedia.'}

Pertanyaan pengguna: ${message}

Jawablah berdasarkan konteks yang diberikan. Jika konteks tidak cukup, katakan "Maaf, saya tidak memiliki informasi yang cukup untuk menjawab pertanyaan ini." Jangan berhalusinasi.`;

    let responseText: string;
    try {
      const llmResult = await generateLLMResponse({
        prompt,
        temperature: 0.7,
        maxTokens: 1024
        // apiKey can be added if needed
      });
      responseText = llmResult.text;
    } catch (llmError) {
      console.error('LLM error:', llmError);
      responseText = 'Maaf, sistem AI sedang mengalami masalah. Mohon coba lagi nanti.';
    }

    // Log interaction
    if (user?.id) {
      await supabase.from('ai_interaction_logs').insert({
        user_id: user.id,
        bot_id,
        query: message,
        domain,
        question_type: 'bot_chat',
        sources_used: retrievalResult.sources.map(s => s.sourceReference),
        confidence: retrievalResult.confidence,
        retrieval_path: retrievalResult.retrieval_path,
        bot_served: botName,
        was_redirected: false,
        was_refused: false,
        injection_attempt: false,
        created_at: new Date().toISOString()
      }).then(({ error }) => { if (error) console.error('Failed to log interaction:', error); });
    }

    const response: BotChatResponse = {
      success: true,
      bot_id,
      bot_name: botName,
      response: responseText,
      sources: retrievalResult.sources.map(s => ({
        content: s.contentPreview,
        source_reference: s.sourceReference
      })),
      retrieval_path: retrievalResult.retrieval_path,
      is_guest: !user
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Server error in POST /api/ai/bot/chat:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
