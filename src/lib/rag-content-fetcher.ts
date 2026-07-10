/**
 * R2 Content Hydration Layer — BARU v6.1
 * 
 * Spesifikasi: rag_ai_r2.md §6.2
 * 
 * Layer ini bertanggung jawab untuk:
 * 1. Fetch teks lengkap dari R2 HANYA untuk top-K final setelah re-ranking
 * 2. Handle orphan R2 keys dengan graceful degradation
 * 3. Batch fetch untuk menghindari terlalu banyak request ke R2
 */

import { fetchContentFromR2 } from "./r2-client";

// ──────────────────────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────────────────────

export interface RankedChunk {
  chunkId: string;
  r2Key: string;
  contentPreview: string;
  sourceReference: string;
  similarityScore: number;
  domain: string;
  chunkTable: string;
  chunkQualityScore: number;
  questionTypeClassification: string;
  isApprovedQA?: boolean;
}

export interface ChunkWithContent extends RankedChunk {
  fullContent: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// CORE FUNCTIONS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Hydrate top-K chunks dengan full content dari R2
 * HANYA fetch untuk chunk yang lolos re-ranking (3-5 chunk)
 */
export async function hydrateTopKWithContent(
  rankedChunks: RankedChunk[]
): Promise<ChunkWithContent[]> {
  if (rankedChunks.length === 0) {
    return [];
  }

  // Filter: hanya chunk yang punya r2_key valid
  const validChunks = rankedChunks.filter(chunk => 
    chunk.r2Key && chunk.r2Key.trim() !== ""
  );

  if (validChunks.length === 0) {
    console.warn("[R2 Hydration] No valid r2_keys found");
    return [];
  }

  // Fetch paralel — HANYA untuk top-K
  const results = await Promise.allSettled(
    validChunks.map(async (chunk) => ({
      ...chunk,
      fullContent: await fetchContentFromR2(chunk.r2Key),
    }))
  );

  // Filter yang berhasil
  const successful = results
    .filter((result): result is PromiseFulfilledResult<ChunkWithContent> => 
      result.status === "fulfilled" && result.value.fullContent !== null
    )
    .map((result) => result.value);

  // Log jika ada yang gagal
  const failedCount = results.length - successful.length;
  if (failedCount > 0) {
    console.warn(
      `[R2 Hydration] ${failedCount}/${results.length} chunks failed (orphan or error)`
    );
  }

  return successful;
}