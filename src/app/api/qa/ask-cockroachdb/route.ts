export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/auth/get-current-user';
import { retrieveKnowledge } from '@/lib/ai/retriever-cockroachdb';
import { generateQueryEmbedding } from '@/lib/ai/retriever';
import { analyzeIntent } from '@/lib/ai/orchestrator/step3-intent-analysis';

// Types
interface QARequest {
  message: string;
  bot_id: string;
  user_context?: {
    user_id?: string;
    access_layer?: number;
    current_page?: string;
    session_id?: string;
    chat_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  };
}

interface QAResponse {
  answer: string;
  source_references: string[];
  confidence: number;
  domain: string;
  retrieval_path: "direct_qa" | "rag" | "tool_use" | "llm_only" | "fallback" | "clarification";
  is_approved_qa?: boolean;
  redirect_to_bot?: {
    bot_id: string;
    bot_name: string;
    message: string;
  };
  clarification_prompt?: string;
  interaction_id: string;
  question_type?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: QARequest = await request.json();
    const { message, bot_id, user_context } = body;

    if (!message || !bot_id) {
      return NextResponse.json(
        { error: 'Missing required fields: message, bot_id' },
        { status: 400 }
      );
    }

    const user = await getCurrentUserProfile();
    const accessLayer = user?.access_layer ?? 0;

    const supabase = createClient();
    const { data: botConfig, error: botConfigError } = await supabase
        .from('bot_configs')
        .select('*')
        .eq('bot_id', bot_id)
        .single();

    if (botConfigError || !botConfig) {
      console.error('Error fetching bot config:', botConfigError?.message);
      return NextResponse.json(
        { error: `Failed to retrieve bot configuration for bot_id: ${bot_id}` },
        { status: 400 }
      );
    }

    // STEP 3: Intent Analysis + Formalisasi Bilingual (menggantikan classifyIntentSimple)
    const intentResult = await analyzeIntent(
      message,
      user_context?.chat_history ?? [],
      user_context?.current_page ?? '',
      bot_id
    );
    const domain = intentResult.domain_predicted;
    const question_type = intentResult.question_type_classified;
    const confidence = intentResult.routing_confidence;

    if (accessLayer < botConfig.access_level_min) {
      return NextResponse.json({
        answer: 'Maaf, Anda tidak memiliki akses untuk menggunakan bot ini.',
        source_references: [],
        confidence: 0,
        domain,
        question_type
      });
    }

    // STEP 5: Embedding ganda -- ID asli + EN hasil formalisasi STEP 3, paralel
    const [queryEmbedding, queryEmbeddingEn] = await Promise.all([
      generateQueryEmbedding(message),
      intentResult.formalized_query_en
        ? generateQueryEmbedding(intentResult.formalized_query_en)
        : Promise.resolve(null),
    ]);

    let sources: Array<{ content: string; source_reference: string; score: number; is_approved_qa?: boolean; r2Key?: string }> = [];
    let retrievalPath: QAResponse['retrieval_path'] = 'llm_only';
    let retrievalConfidence = 0;

    if (queryEmbedding) {
      const result = await retrieveKnowledge({
        query: message,
        embedding: queryEmbedding,
        embeddingEn: queryEmbeddingEn,
        domain,
        botId: bot_id,
        user_access_level: accessLayer,
        minConfidenceThreshold: botConfig.min_confidence_threshold ?? 0.70,
      });

      sources = result.sources.map(s => ({
        content: s.contentPreview,
        source_reference: s.sourceReference,
        score: s.score,
        is_approved_qa: s.isApprovedQA,
        r2Key: s.r2Key
      }));
      retrievalPath = result.retrieval_path;
      retrievalConfidence = result.confidence;
    }

    // STEP 6 confidence gate: kalau confidence di bawah ambang, LLM TIDAK dipanggil
    // sama sekali (qna_hub_r2.md Prinsip #3) -- pakai fallback_response_template langsung.
    if (retrievalPath === 'fallback') {
      const response: QAResponse = {
        answer: botConfig.fallback_response_template,
        source_references: [],
        confidence: retrievalConfidence,
        domain,
        question_type,
        retrieval_path: 'fallback',
        is_approved_qa: false,
        interaction_id: crypto.randomUUID()
      };

      if (user?.id) {
        supabase.from('ai_interaction_logs').insert({
          user_id: user.id,
          bot_id,
          query: message,
          domain,
          question_type,
          sources_used: [],
          confidence: retrievalConfidence,
          retrieval_path: 'fallback',
          bot_served: botConfig.bot_name || 'AI Assistant',
          was_redirected: false,
          was_refused: false,
          injection_attempt: false,
          created_at: new Date().toISOString()
        }).then(({ error }) => { if (error) console.error('Failed to log interaction:', error); });
      }

      return NextResponse.json(response);
    }

    // STEP 7B: Fetch full-text from R2 for top K sources
    const TOP_K_FULLTEXT = 6;
    const topSources = sources.slice(0, TOP_K_FULLTEXT);
    const fullTexts: string[] = [];

    for (const source of topSources) {
      if (source.r2Key) {
        try {
          const { fetchFullTextFromR2 } = await import('@/lib/r2/fetch-content');
          const fullText = await fetchFullTextFromR2(source.r2Key);
          fullTexts.push(fullText);
        } catch (error) {
          console.error(`Failed to fetch full-text for ${source.r2Key}:`, error);
          fullTexts.push(source.content); // fallback to preview
        }
      } else {
        fullTexts.push(source.content); // no R2 key, use preview
      }
    }

    const contextText = topSources
      .map((s, i) => `[${i + 1}] ${s.source_reference}: ${fullTexts[i]}`)
      .join('\n\n');

    const sourceReferences = sources.map(s => s.source_reference);

    const botName = botConfig.bot_name || 'AI Assistant';

    const answerPrompt = `Kamu adalah ${botName}, asisten AI paroki. Jawab pertanyaan berikut berdasarkan konteks yang tersedia.

Konteks:
${contextText}

Pertanyaan: ${message}

Berikan jawaban yang akurat, ringkas, dan helpful dalam Bahasa Indonesia.`;

    let answer: string;

    if (contextText) {
      const geminiApiKey = process.env.GOOGLE_API_KEY_1;
      if (!geminiApiKey) {
        console.error('GOOGLE_API_KEY_1 is not set for LLM.');
        answer = 'Maaf, sistem AI sedang mengalami masalah konfigurasi. Mohon coba lagi nanti.';
      } else {
        try {
          const llmResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{ text: answerPrompt }]
                }]
              })
            }
          );

          if (!llmResponse.ok) {
            const errorBody = await llmResponse.text();
            console.error(`LLM API error: ${llmResponse.status} - ${errorBody}`);
            answer = 'Maaf, saya tidak dapat menghasilkan jawaban saat ini. Terjadi masalah dengan layanan AI.';
          } else {
            const llmData = await llmResponse.json();
            answer = llmData.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, saya tidak dapat menghasilkan jawaban.';
          }
        } catch (llmError) {
          console.error('Error calling Gemini Flash LLM:', llmError);
          answer = 'Maaf, terjadi kesalahan saat memproses permintaan Anda.';
        }
      }
    } else {
      answer = 'Maaf, saya tidak menemukan informasi yang relevan untuk pertanyaan Anda.';
    }

    if (user?.id) {
      supabase.from('ai_interaction_logs').insert({
        user_id: user.id,
        bot_id,
        query: message,
        domain,
        question_type,
        sources_used: sourceReferences,
        confidence: confidence,
        retrieval_path: retrievalPath,
        bot_served: botName,
        was_redirected: false,
        was_refused: false,
        injection_attempt: false,
        created_at: new Date().toISOString()
      }).then(({ error }) => { if (error) console.error('Failed to log interaction:', error); });
    }

    const response: QAResponse = {
      answer,
      source_references: sourceReferences,
      confidence: sources.length > 0 ? sources[0].score : 0,
      domain,
      question_type,
      retrieval_path: retrievalPath,
      is_approved_qa: sources.length > 0 ? sources[0].is_approved_qa : false,
      interaction_id: crypto.randomUUID()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in /api/qa/ask-cockroachdb:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
