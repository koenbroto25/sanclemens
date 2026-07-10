/**
 * Cross-Encoder Re-ranking untuk Bot Teologis (Bot 3 & Bot 8)
 * Menggunakan Gemini Flash untuk scoring relevance yang lebih akurat
 * Sesuai rag_ai_v6.md Â§10.2
 */

import { createClient } from '@/lib/supabase/server';

export interface RerankCandidate {
  chunkId: string;
  r2Key: string;
  content: string;
  sourceReference: string;
  similarityScore: number;
  domain: string;
  chunkTable: string;
  chunkQualityScore: number;
  questionTypeClassification: string;
  isApprovedQA?: boolean;
  authorityLevel?: number;
}

export interface RerankResult extends RerankCandidate {
  relevanceScore: number;
  rankBeforeRerank: number;
  rankAfterRerank: number;
}

/**
 * Re-rank candidates using cross-encoder (Gemini Flash)
 * Untuk Bot 3 & Bot 8 yang memerlukan presisi tinggi
 */
export async function rerankWithCrossEncoder(
  candidates: RerankCandidate[],
  query: string,
  topK: number = 5
): Promise<RerankResult[]> {
  if (candidates.length === 0) {
    return [];
  }

  // Jika hanya 1 kandidat, tidak perlu re-ranking
  if (candidates.length === 1) {
    return [{
      ...candidates[0],
      relevanceScore: candidates[0].similarityScore,
      rankBeforeRerank: 1,
      rankAfterRerank: 1
    }];
  }

  try {
    const apiKey = process.env.GOOGLE_API_KEY_1;
    if (!apiKey) {
      console.error('GOOGLE_API_KEY_1 is not set, skipping cross-encoder');
      return candidates.map((c, idx) => ({
        ...c,
        relevanceScore: c.similarityScore,
        rankBeforeRerank: idx + 1,
        rankAfterRerank: idx + 1
      }));
    }

    // Prepare chunks for cross-encoder
    const chunksText = candidates
      .map((c, idx) => `[${idx + 1}] ${c.content.substring(0, 500)}...`)
      .join('\n\n');

    const prompt = `Anda adalah evaluator relevansi konten teologis Katolik.
Tugas: Evaluasi seberapa relevan setiap chunk berikut untuk menjawab pertanyaan pengguna.
Berikan skor 0.0-1.0 untuk setiap chunk. Respons HANYA dalam JSON.

Pertanyaan: ${query}

Chunks:
${chunksText}

Format respons:
{"scores": [{"chunk_id": "${candidates[0].chunkId}", "relevance_score": 0.0-1.0, "reason": "singkat"}]}`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.1, // Low temperature for consistent scoring
            maxOutputTokens: 1024,
            topP: 1.0
          }
        })
      }
    );

    if (!response.ok) {
      console.error('Cross-encoder API error:', response.status);
      return candidates.map((c, idx) => ({
        ...c,
        relevanceScore: c.similarityScore,
        rankBeforeRerank: idx + 1,
        rankAfterRerank: idx + 1
      }));
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    try {
      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const scores = parsed.scores || [];

      // Map scores back to candidates
      const reranked: RerankResult[] = candidates
        .map((candidate, idx) => {
          const scoreData = scores.find((s: any) => s.chunk_id === candidate.chunkId);
          const relevanceScore = scoreData?.relevance_score || candidate.similarityScore;

          return {
            ...candidate,
            relevanceScore,
            rankBeforeRerank: idx + 1,
            rankAfterRerank: 0 // Will be calculated after sorting
          };
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .map((item, idx) => ({
          ...item,
          rankAfterRerank: idx + 1
        }))
        .slice(0, topK);

      return reranked;
    } catch (parseError) {
      console.error('Error parsing cross-encoder response:', parseError);
      return candidates.map((c, idx) => ({
        ...c,
        relevanceScore: c.similarityScore,
        rankBeforeRerank: idx + 1,
        rankAfterRerank: idx + 1
      }));
    }
  } catch (error) {
    console.error('Cross-encoder reranking failed:', error);
    return candidates.map((c, idx) => ({
      ...c,
      relevanceScore: c.similarityScore,
      rankBeforeRerank: idx + 1,
      rankAfterRerank: idx + 1
    }));
  }
}

/**
 * Simplified score-based re-ranking (fallback untuk non-teologis bots)
 * Sesuai rag_ai_v6.md Â§10.1
 */
export function scoreBasedRerank(
  candidates: RerankCandidate[],
  topK: number = 5
): RerankResult[] {
  return candidates
    .map((candidate, idx) => {
      // Score formula: (similarity * 0.8) + (quality/5 * 0.2)
      const finalScore = (candidate.similarityScore * 0.8) + (candidate.chunkQualityScore / 5 * 0.2);

      return {
        ...candidate,
        relevanceScore: finalScore,
        rankBeforeRerank: idx + 1,
        rankAfterRerank: 0
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topK)
    .map((item, idx) => ({
      ...item,
      rankAfterRerank: idx + 1
    }));
}

/**
 * Re-ranking dengan prioritas approved Q&A
 * Approved Q&A (is_approved = TRUE) selalu diprioritaskan ke posisi teratas
 */
export function rerankWithApprovedQAPriority(
  candidates: RerankCandidate[],
  topK: number = 5
): RerankResult[] {
  const approved = candidates.filter(c => c.isApprovedQA);
  const notApproved = candidates.filter(c => !c.isApprovedQA);

  const rerank = (list: RerankCandidate[], offset: number): RerankResult[] => {
    return list
      .map((candidate, idx) => {
        const finalScore = candidate.isApprovedQA
          ? 1.0 // Approved QA always gets top score
          : (candidate.similarityScore * 0.8) + (candidate.chunkQualityScore / 5 * 0.2);

        return {
          ...candidate,
          relevanceScore: finalScore,
          rankBeforeRerank: offset + idx + 1,
          rankAfterRerank: 0
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, topK)
      .map((item, idx) => ({
        ...item,
        rankAfterRerank: idx + 1
      }));
  };

  // Approved first, then not approved
  const approvedReranked = rerank(approved, 0);
  const notApprovedReranked = rerank(notApproved, approved.length);

  return [...approvedReranked, ...notApprovedReranked].slice(0, topK);
}

/**
 * Determine if cross-encoder should be used for a bot
 */
export function shouldUseCrossEncoder(botId: string): boolean {
  // Only use cross-encoder for theological bots
  const theologicalBots = ['bot_3', 'bot_8'];
  return theologicalBots.includes(botId);
}

/**
 * Get re-ranking strategy for bot
 */
export function getRerankStrategy(
  botId: string,
  useCrossEncoder: boolean = false
): 'cross_encoder' | 'score_based' | 'approved_priority' {
  if (useCrossEncoder && shouldUseCrossEncoder(botId)) {
    return 'cross_encoder';
  }

  // For theological bots without cross-encoder, use approved_priority
  if (shouldUseCrossEncoder(botId)) {
    return 'approved_priority';
  }

  // For operational bots, use simple score-based
  return 'score_based';
}
