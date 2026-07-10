export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/auth/get-current-user';
import { retrieveKnowledge, generateQueryEmbedding, RetrievalContext, searchDirectQA, searchRAGChunks } from '@/lib/ai/retriever';
import { generateLLMResponse, buildPrompt } from '@/lib/ai/llm';

// Types
// Types (aligned with qna_hub_v6.md)
interface QARequest {
  message: string;
  bot_id: string;
  user_context?: {
    user_id?: string;
    access_layer?: number;
    current_page?: string;
    session_id?: string; // New in v6.0
    chat_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  };
}

interface QAResponse {
  answer: string;
  source_references: string[];
  confidence: number;
  domain: string;
  retrieval_path: "direct_qa" | "rag" | "tool_use" | "llm_only" | "fallback" | "clarification"; // New in v6.0
  is_approved_qa?: boolean; // New in v6.0
  redirect_to_bot?: { // New in v6.0
    bot_id: string;
    bot_name: string;
    message: string;
  };
  clarification_prompt?: string; // New in v6.0
  interaction_id: string; // New in v6.0
  question_type?: string;
}

// Intent classification using simple keyword matching (fallback if LLM unavailable)
function classifyIntentSimple(message: string): {
  domain: string;
  question_type: string;
  confidence: number;
} {
  const lower = message.toLowerCase();
  
  // Theology keywords
  if (lower.match(/sakramen|eukarist|krisma|baptis|nikah|doa|rohani|iman|gospel|alkitab|katekismus|kgk|khk|paus|vatican/i)) {
    return { domain: 'theology', question_type: 'dogmatic_explanation', confidence: 0.8 };
  }
  
  // Business/work keywords
  if (lower.match(/cari|jual|beli|usaha|tukang|bengkel|katering|lowongan|kerja|karier|skill|keahlian/i)) {
    return { domain: 'business_work', question_type: 'business_search_query', confidence: 0.8 };
  }
  
  // Public info keywords
  if (lower.match(/jadwal|misa|gereja|alamat|warta|kegiatan|profil|kontak|jam|hari raya|liturgi/i)) {
    return { domain: 'public_info', question_type: 'factual_parish_details', confidence: 0.8 };
  }
  
  // Default
  return { domain: 'public_info', question_type: 'general_query', confidence: 0.5 };
}

export async function POST(request: NextRequest) {
  try {
    const body: QARequest = await request.json();
    const { message, bot_id, user_context } = body;
    
    // Validate input
    if (!message || !bot_id) {
      return NextResponse.json(
        { error: 'Missing required fields: message, bot_id' },
        { status: 400 }
      );
    }
    
    // Get user session
    const user = await getCurrentUserProfile();
    const accessLayer = user?.access_layer ?? 0;
    
    // Get bot configuration
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
    
    // Classify intent
    const { domain, question_type, confidence } = classifyIntentSimple(message);
    
    // Check access level
    if (accessLayer < botConfig.access_level_min) {
      return NextResponse.json({
        answer: 'Maaf, Anda tidak memiliki akses untuk menggunakan bot ini.',
        source_references: [],
        confidence: 0,
        domain,
        question_type
      });
    }
    
    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(message);
    
    let sources: Array<{ content: string; source_reference: string; score: number; is_approved_qa?: boolean }> = [];
    let retrievalPath: QAResponse['retrieval_path'] = 'llm_only';
    
    if (queryEmbedding) {
      // P1: Search approved QAs first
      const approvedQAs = await searchDirectQA(
        supabase,
        queryEmbedding,
        domain,
        botConfig.bot_access,
        accessLayer,
        5
      );
      
      if (approvedQAs.length > 0 && approvedQAs[0].similarity_score > 0.85) {
        // High confidence match from approved QAs
        sources = approvedQAs.map(qa => ({
          content: qa.content_preview,
          source_reference: qa.source_reference || 'Approved Q&A',
          score: qa.similarity_score,
          is_approved_qa: true
        }));
        retrievalPath = 'direct_qa';
      } else {
        // P2: Search RAG chunks if no approved QA match
        const ragChunks = await searchRAGChunks(
          supabase,
          queryEmbedding,
          domain,
          botConfig.bot_access,
          accessLayer,
          20
        );
        
        if (ragChunks.length > 0) {
          sources = ragChunks.map(chunk => ({
            content: chunk.content_preview,
            source_reference: chunk.source_reference,
            score: chunk.similarity_score,
            is_approved_qa: false
          }));
          retrievalPath = 'rag';
        }
      }
    }
    
    // Build context from top chunks
    const contextText = sources
      .map((s, i) => `[${i + 1}] ${s.source_reference}: ${s.content}`)
      .join('\n\n');
    
    const sourceReferences = sources.map(s => s.source_reference);
    
    // Generate answer (simplified - in production, call LLM API)
    const botName = botConfig.bot_name || 'AI Assistant'; // Use fetched bot_name
    
    const answerPrompt = `Kamu adalah ${botName}, asisten AI paroki. Jawab pertanyaan berikut berdasarkan konteks yang tersedia.

Konteks:
${contextText}

Pertanyaan: ${message}

Berikan jawaban yang akurat, ringkas, dan helpful dalam Bahasa Indonesia.`;
    
    let answer: string;
    let llmConfidence: number = 0; // Placeholder for actual LLM confidence if available
    
    if (contextText) {
      const geminiApiKey = process.env.GOOGLE_API_KEY_1; // Use one of the API keys for LLM
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
            llmConfidence = sources.length > 0 ? sources[0].score : 0; // Use top source score as a proxy
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
    
    // Log interaction (async, don't block)
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
    console.error('Error in /api/ai/qa/ask:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
