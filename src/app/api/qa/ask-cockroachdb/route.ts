export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/auth/get-current-user';
import { retrieveKnowledge } from '@/lib/ai/retriever-cockroachdb';
import { generateQueryEmbedding } from '@/lib/ai/retriever';
import { generateLLMResponse, buildPrompt } from '@/lib/ai/llm';

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

function classifyIntentSimple(message: string): {
  domain: string;
  question_type: string;
  confidence: number;
} {
  const lower = message.toLowerCase();
  
  if (lower.match(/sakramen|ekaristi|eukarist|krisma|baptis|nikah|doa|rohani|iman|gospel|alkitab|katekismus|kgk|khk|paus|vatican|tuhan|allah|yesus|kristus|gereja|dosa|surga|roh kudus|maria|santo|santa|aquinas|teolog|dogma|ajaran katolik/i)) {
    return { domain: 'theology', question_type: 'dogmatic_explanation', confidence: 0.8 };
  }
  
  if (lower.match(/cari|jual|beli|usaha|tukang|bengkel|katering|lowongan|kerja|karier|skill|keahlian/i)) {
    return { domain: 'business_work', question_type: 'business_search_query', confidence: 0.8 };
  }
  
  if (lower.match(/jadwal|misa|gereja|alamat|warta|kegiatan|profil|kontak|jam|hari raya|liturgi/i)) {
    return { domain: 'public_info', question_type: 'factual_parish_details', confidence: 0.8 };
  }
  
  return { domain: 'public_info', question_type: 'general_query', confidence: 0.5 };
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
    
    const { domain, question_type, confidence } = classifyIntentSimple(message);
    
    if (accessLayer < botConfig.access_level_min) {
      return NextResponse.json({
        answer: 'Maaf, Anda tidak memiliki akses untuk menggunakan bot ini.',
        source_references: [],
        confidence: 0,
        domain,
        question_type
      });
    }
    
    const queryEmbedding = await generateQueryEmbedding(message);
    
    let sources: Array<{ content: string; source_reference: string; score: number; is_approved_qa?: boolean; r2Key?: string }> = [];
    let retrievalPath: QAResponse['retrieval_path'] = 'llm_only';
    
    if (queryEmbedding) {
	const result = await retrieveKnowledge({
		query: message,
		embedding: queryEmbedding,
		domain,
		botId: bot_id,
		user_access_level: accessLayer
	});
      
      sources = result.sources.map(s => ({
        content: s.contentPreview,
        source_reference: s.sourceReference,
        score: s.score,
        is_approved_qa: s.isApprovedQA,
        r2Key: s.r2Key
      }));
      retrievalPath = result.retrieval_path;
    }

    // Fetch full-text from R2 for top K sources
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
    let llmConfidence: number = 0;
    
    if (contextText) {
      const geminiApiKey = process.env.GOOGLE_API_KEY_1;
      if (!geminiApiKey) {
        console.error('GOOGLE_API_KEY_1 is not set for LLM.');
        answer = 'Maaf, sistem AI sedang mengalami masalah konfigurasi. Mohon coba lagi nanti.';
        llmConfidence = 0;
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
            llmConfidence = 0;
          } else {
            const llmData = await llmResponse.json();
            answer = llmData.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, saya tidak dapat menghasilkan jawaban.';
            llmConfidence = sources.length > 0 ? sources[0].score : 0;
          }
        } catch (llmError) {
          console.error('Error calling Gemini Flash LLM:', llmError);
          answer = 'Maaf, terjadi kesalahan saat memproses permintaan Anda.';
          llmConfidence = 0;
        }
      }
    } else {
      answer = 'Maaf, saya tidak menemukan informasi yang relevan untuk pertanyaan Anda.';
      llmConfidence = 0;
    }
    
    if (user?.id) {
      const supabase = createClient();
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