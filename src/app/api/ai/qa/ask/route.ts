import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserProfile } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/ai/embedding';
import { retrieveKnowledge, type RetrievalContext } from '@/lib/ai/retriever';
import {
  rerankWithCrossEncoder,
  rerankWithApprovedQAPriority,
  shouldUseCrossEncoder,
  type RerankCandidate,
} from '@/lib/ai/cross-encoder-reranker';
import { hydrateTopKWithContent } from '@/lib/rag-content-fetcher';
import { checkBotRedirection, getBotDisplayName } from '@/hooks/useBotRedirection';

export const dynamic = 'force-dynamic';

// ============================================================
// TYPES
// ============================================================

interface QARequest {
  query: string;
  bot_id: string;
  chat_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  current_page?: string;
}

interface QAResponse {
  answer: string;
  retrieval_path: 'direct_qa' | 'rag' | 'llm_only' | 'fallback' | 'redirect' | 'refused' | 'clarification';
  confidence: number;
  sources?: Array<{
    sourceReference: string;
    score: number;
    isApprovedQA: boolean;
  }>;
  was_redirected?: boolean;
  was_refused?: boolean;
  redirect_target?: string;
}

// ============================================================
// REFUSAL & REDIRECT TEMPLATES
// ============================================================

const REFUSAL_TEMPLATES = {
  sensitive_data: () =>
    'Maaf, saya tidak dapat memberikan data pribadi umat lain. Jika Anda perlu menghubungi seseorang, silakan hubungi Sekretariat Paroki.',
  financial_data: () =>
    'Informasi keuangan paroki tidak dapat saya akses melalui chat ini. Silakan hubungi Bendahara DPP secara langsung.',
  outside_scope: (botName: string) =>
    `Pertanyaan ini berada di luar area layanan ${botName}. Saya hanya dapat membantu sesuai dengan domain bot ini.`,
  sacramental_authority: () =>
    'Keputusan yang menyangkut Sakramen atau hukum kanonik hanya dapat diberikan oleh Pastor. Saya menyarankan Anda untuk membuat janji dengan Pastor.',
  needs_login: () =>
    'Fitur ini memerlukan login. Silakan daftar atau masuk untuk mengaksesnya.',
  needs_higher_access: () =>
    'Informasi ini hanya tersedia untuk pengurus paroki yang berwenang.',
};

const REDIRECT_TEMPLATES = {
  to_theology: (botName: string) =>
    `Pertanyaan ini menyangkut ajaran iman Katolik. ${botName} akan senang membantu! Klik "Learn Catholic" di menu utama.`,
  to_bisnis: () =>
    'Untuk mencari usaha atau lowongan kerja, silakan gunakan fitur Pasar Kasih kami.',
  to_companion: () =>
    'Untuk pendampingan rohani yang lebih personal, silakan login dan gunakan fitur Companion Rohani di dashboard Anda.',
  to_bot_specific: (targetBotName: string, action: string) =>
    `Untuk ${action}, Anda dapat menggunakan ${targetBotName} di menu yang tersedia.`,
};

// ============================================================
// HELPER: Load bot config from DB
// ============================================================

async function getBotConfig(supabase: ReturnType<typeof createClient>, botId: string) {
  const { data, error } = await supabase
    .from('bot_configs')
    .select('*')
    .eq('bot_id', botId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    // Fallback config
    return {
      bot_id: botId,
      allowed_domains: ['public_info'],
      allowed_cross_domains: [],
      access_level_required: 0,
      min_confidence_threshold: 0.70,
      rag_top_k_initial: 20,
      rag_top_k_final: 5,
      use_cross_encoder: false,
      config_data: {},
    };
  }

  const cfg = data.config_data || {};
  return {
    bot_id: botId,
    allowed_domains: cfg.allowed_domains || ['public_info'],
    allowed_cross_domains: cfg.allowed_cross_domains || [],
    access_level_required: cfg.access_level_required ?? 0,
    min_confidence_threshold: cfg.min_confidence_threshold ?? 0.70,
    rag_top_k_initial: cfg.rag_top_k_initial ?? 20,
    rag_top_k_final: cfg.rag_top_k_final ?? 5,
    use_cross_encoder: cfg.use_cross_encoder ?? false,
    config_data: cfg,
  };
}

// ============================================================
// HELPER: Log interaction
// ============================================================

async function logInteraction(
  supabase: ReturnType<typeof createClient>,
  data: {
    bot_id: string;
    user_id?: string;
    query: string;
    retrieval_path: string;
    confidence_score: number;
    was_redirected: boolean;
    was_refused: boolean;
    retrieval_context?: object;
  }
) {
  try {
    await supabase.from('ai_interaction_logs').insert({
      bot_id: data.bot_id,
      user_id: data.user_id,
      query: data.query,
      retrieval_path: data.retrieval_path,
      confidence_score: data.confidence_score,
      was_redirected: data.was_redirected,
      was_refused: data.was_refused,
      retrieval_context: data.retrieval_context || {},
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to log interaction:', err);
  }
}

// ============================================================
// HELPER: Authority-Tier Prompt Injection (§2.5)
// ============================================================

function getAuthorityTierInstruction(
  sources: Array<{ content: string; sourceReference: string; authorityLevel?: string }>
): string | null {
  // Cari authority_level tertinggi di seluruh sources
  const authorityOrder = ['highest', 'high', 'medium', 'reference', 'devotional'];
  let highestTier: string | null = null;
  let highestIndex = Infinity;

  for (const source of sources) {
    if (source.authorityLevel) {
      const idx = authorityOrder.indexOf(source.authorityLevel);
      if (idx !== -1 && idx < highestIndex) {
        highestIndex = idx;
        highestTier = source.authorityLevel;
      }
    }
  }

  // Jika tidak ada authority_level (semua NULL), tidak ada instruksi
  if (!highestTier) {
    return null;
  }

  // Deterministic instruction berdasarkan tier tertinggi
  switch (highestTier) {
    case 'highest':
      return 'Sumber yang Anda gunakan berotoritas tertinggi (dogma/katekismus resmi). Parafrase harus ketat mengikuti makna asli sumber — jangan menambah nuansa, contoh, atau pelunakan yang tidak eksplisit ada di sumber yang diberikan.';
    case 'high':
      return 'Sumber yang Anda gunakan otoritatif. Boleh disederhanakan bahasanya agar mudah dipahami, tapi substansi ajaran tidak boleh berubah.';
    case 'medium':
      return 'Sumber yang Anda gunakan bersifat penjelasan umum. Boleh disampaikan dengan gaya percakapan, tetap merujuk isi sumber, bukan interpretasi bebas Anda.';
    case 'reference':
    case 'devotional':
      return 'Sumber yang Anda gunakan bersifat pendukung/renungan. Boleh dipersonalisasi nadanya untuk pendampingan, tapi tetap berbasis isi sumber yang diberikan, bukan improvisasi.';
    default:
      return null;
  }
}

// ============================================================
// HELPER: Compose LLM prompt and call
// ============================================================

async function callLLM(
  query: string,
  sources: Array<{ content: string; sourceReference: string }>,
  chatHistory: Array<{ role: string; content: string }>,
  botConfig: ReturnType<typeof getBotConfig> extends Promise<infer T> ? T : never,
  systemPrompt?: string,
  authorityTierInstruction?: string | null
): Promise<string> {
  const apiKey = process.env.AI_API_KEY || process.env.GOOGLE_API_KEY_1;
  if (!apiKey) throw new Error('No AI API key available');

  const sourcesText = sources
    .map((s, i) => `[${i + 1}] ${s.sourceReference}:\n${s.content}`)
    .join('\n\n');

  const defaultSystemPrompt = `Anda adalah asisten AI Paroki Santo Klemens. Jawab berdasarkan sumber yang diberikan saja. Jika tidak ada sumber, katakan tidak tahu. Gunakan bahasa Indonesia yang sopan dan ramah.`;

  // Compose prompt dengan Authority-Tier Instruction jika ada
  // Order: Base Policy Prompt + Authority-Tier (jika applicable) + Bot Persona + Liturgical Context + User Profile + Retrieved Chunks + Chat History + Redirection/Refusal Instructions
  const promptParts = [
    systemPrompt || defaultSystemPrompt,
    authorityTierInstruction, // BARU: disisipkan SEBELUM Bot Persona
    `\n\nSumber:\n${sourcesText}\n\nPertanyaan: ${query}`
  ].filter(Boolean); // Filter out null/undefined

  const messages = [
    {
      role: 'user' as const,
      content: promptParts.join('\n\n'),
    },
  ];

  const model = process.env.AI_COMPANION_MODEL || 'z-ai/glm-4.5-air:free';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1024,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Maaf, tidak dapat menghasilkan jawaban saat ini.';
}

// ============================================================
// MAIN HANDLER
// ============================================================

export async function POST(request: NextRequest) {
  const supabase = createClient();

  try {
    // Parse request
    const body: QARequest = await request.json();
    const { query, bot_id, chat_history = [], current_page } = body;

    if (!query?.trim() || !bot_id) {
      return NextResponse.json({ error: 'query and bot_id are required' }, { status: 400 });
    }

    // STEP 1: LOAD CONTEXT
    const profile = await getCurrentUserProfile();
    const userId = profile?.id;
    const userAccessLayer = profile?.access_layer ?? 0;

    const botConfig = await getBotConfig(supabase, bot_id);
    const botName = getBotDisplayName(bot_id);

    // STEP 4A: Access level check (before embedding generation)
    if (userAccessLayer < botConfig.access_level_required) {
      await logInteraction(supabase, {
        bot_id, user_id: userId, query,
        retrieval_path: 'refused', confidence_score: 0,
        was_redirected: false, was_refused: true,
      });

      const answer = userAccessLayer === 0
        ? REFUSAL_TEMPLATES.needs_login()
        : REFUSAL_TEMPLATES.needs_higher_access();

      return NextResponse.json({
        answer,
        retrieval_path: 'refused',
        confidence: 0,
        was_refused: true,
      } satisfies QAResponse);
    }

    // STEP 4B: Bot redirection check
    const redirection = checkBotRedirection(bot_id, query, userAccessLayer);
    if (redirection) {
      const targetName = getBotDisplayName(redirection.botId);
      await logInteraction(supabase, {
        bot_id, user_id: userId, query,
        retrieval_path: 'redirect', confidence_score: 0,
        was_redirected: true, was_refused: false,
        retrieval_context: { target_bot: redirection.botId },
      });

      return NextResponse.json({
        answer: redirection.message || REDIRECT_TEMPLATES.to_bot_specific(targetName, 'ini'),
        retrieval_path: 'redirect',
        confidence: 0,
        was_redirected: true,
        redirect_target: redirection.botId,
      } satisfies QAResponse);
    }

    // STEP 5: EMBEDDING GENERATION
    const apiKey = process.env.GOOGLE_API_KEY_1 || '';
    const embedding = await generateEmbedding(query, apiKey, {
      taskType: 'RETRIEVAL_QUERY',
      outputDimensionality: 768,
    });

    // STEP 6: DYNAMIC KNOWLEDGE RETRIEVAL
    const domain = botConfig.allowed_domains[0] || 'public_info';
    const botAccess = [bot_id, ...botConfig.allowed_cross_domains];

    const retrievalContext: RetrievalContext = {
      query,
      embedding,
      domain,
      bot_id,
      user_access_level: userAccessLayer,
    };

    const retrievalResult = await retrieveKnowledge(retrievalContext, botAccess);

    // STEP 4C: Confidence threshold check
    if (
      retrievalResult.retrieval_path !== 'llm_only' &&
      retrievalResult.confidence < botConfig.min_confidence_threshold
    ) {
      await logInteraction(supabase, {
        bot_id, user_id: userId, query,
        retrieval_path: 'fallback', confidence_score: retrievalResult.confidence,
        was_redirected: false, was_refused: false,
      });

      return NextResponse.json({
        answer: `Maaf, saya tidak menemukan informasi yang cukup akurat untuk menjawab pertanyaan ini. Silakan hubungi Sekretariat Paroki untuk informasi lebih lanjut.`,
        retrieval_path: 'fallback',
        confidence: retrievalResult.confidence,
      } satisfies QAResponse);
    }

    // LLM only path
    if (retrievalResult.retrieval_path === 'llm_only') {
      const answer = await callLLM(query, [], chat_history, botConfig);
      await logInteraction(supabase, {
        bot_id, user_id: userId, query,
        retrieval_path: 'llm_only', confidence_score: 0,
        was_redirected: false, was_refused: false,
      });

      return NextResponse.json({
        answer,
        retrieval_path: 'llm_only',
        confidence: 0,
      } satisfies QAResponse);
    }

    // STEP 7: RE-RANKING
    const rerankCandidates: RerankCandidate[] = retrievalResult.sources.map((source) => ({
      chunkId: source.chunkId,
      r2Key: source.r2Key,
      content: source.contentPreview,
      sourceReference: source.sourceReference,
      similarityScore: source.score,
      domain: source.domain,
      chunkTable: source.chunkTable || 'qa_pairs',
      chunkQualityScore: source.chunkQualityScore || 3,
      questionTypeClassification: source.questionTypeClassification || 'general_query',
      isApprovedQA: source.isApprovedQA,
      authorityLevel: source.authorityLevel, // BARU: untuk Authority-Tier injection
    }));

    let rerankedSources;
    if (shouldUseCrossEncoder(bot_id) && botConfig.use_cross_encoder) {
      rerankedSources = await rerankWithCrossEncoder(
        rerankCandidates,
        query,
        botConfig.rag_top_k_final
      );
    } else {
      rerankedSources = rerankWithApprovedQAPriority(
        rerankCandidates,
        botConfig.rag_top_k_final
      );
    }

    // STEP 7B: CONTENT HYDRATION (v6.1 — fetch full text from R2 for top-K only)
    // Pertahankan authority_level dari rerankedSources ke hydratedSources
    const chunksToHydrate = rerankedSources.map((rs) => ({
      chunkId: rs.chunkId,
      r2Key: rs.r2Key,
      contentPreview: rs.content,
      sourceReference: rs.sourceReference,
      similarityScore: rs.relevanceScore,
      domain: rs.domain,
      chunkTable: rs.chunkTable,
      chunkQualityScore: rs.chunkQualityScore,
      questionTypeClassification: rs.questionTypeClassification,
      isApprovedQA: rs.isApprovedQA,
      authorityLevel: (rs as any).authorityLevel, // pertahankan untuk Authority-Tier injection
    }));
    const hydratedSources = await hydrateTopKWithContent(chunksToHydrate);

    // Check if hydration succeeded
    if (!hydratedSources || hydratedSources.length === 0) {
      await logInteraction(supabase, {
        bot_id, user_id: userId, query,
        retrieval_path: 'fallback', confidence_score: retrievalResult.confidence,
        was_redirected: false, was_refused: false,
        retrieval_context: { hydration_failed: true },
      });

      return NextResponse.json({
        answer: 'Maaf, terjadi kesalahan saat mengambil konten. Silakan coba lagi.',
        retrieval_path: 'fallback',
        confidence: retrievalResult.confidence,
      } satisfies QAResponse);
    }

    // STEP 8: LLM COMPOSITION — dengan Authority-Tier Prompt Injection
    const llmSources = hydratedSources.map((s) => ({
      content: s.fullContent || s.contentPreview,
      sourceReference: s.sourceReference,
      authorityLevel: (s as any).authorityLevel, // pertahankan untuk injection
    }));

    // Load system prompt from bot_configs
    const systemPrompt = botConfig.config_data?.system_prompt as string | undefined;

    // Authority-Tier Prompt Injection — hanya untuk bot dengan domain teologis
    // (bot_3, bot_8, bot_pastor) jika ada authority_level di top-K
    const authorityTierInstruction = getAuthorityTierInstruction(llmSources);
    const answer = await callLLM(query, llmSources, chat_history, botConfig, systemPrompt, authorityTierInstruction);

    // STEP 9: LOG & RETURN
    await logInteraction(supabase, {
      bot_id,
      user_id: userId,
      query,
      retrieval_path: retrievalResult.retrieval_path,
      confidence_score: retrievalResult.confidence,
      was_redirected: false,
      was_refused: false,
      retrieval_context: {
        sources_count: hydratedSources.length,
        top_source: hydratedSources[0]?.sourceReference,
        rerank_method: botConfig.use_cross_encoder ? 'cross_encoder' : 'approved_qa_priority',
        authority_tier_used: authorityTierInstruction, // untuk audit Pastor/Super Admin
      },
    });

    return NextResponse.json({
      answer,
      retrieval_path: retrievalResult.retrieval_path,
      confidence: retrievalResult.confidence,
      sources: hydratedSources.map((s) => ({
        sourceReference: s.sourceReference,
        score: s.similarityScore,
        isApprovedQA: s.isApprovedQA ?? false,
      })),
    } satisfies QAResponse);

  } catch (error) {
    console.error('Q&A Orchestrator error:', error);
    return NextResponse.json(
      { error: 'Internal server error', answer: 'Maaf, terjadi kesalahan. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}