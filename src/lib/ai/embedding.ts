/**
 * Embedding utility for generating vector embeddings using Gemini API
 */

const GEMINI_EMBEDDING_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent';

export interface EmbeddingOptions {
  taskType?: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' | 'SEMANTIC_SIMILARITY';
  outputDimensionality?: number;
}

/**
 * Generate embedding for a single text using Gemini Embedding API
 */
export async function generateEmbedding(
  text: string,
  apiKey: string,
  options: EmbeddingOptions = {}
): Promise<number[] | null> {
  try {
    const { taskType = 'RETRIEVAL_QUERY', outputDimensionality = 768 } = options;

    const response = await fetch(
      `${GEMINI_EMBEDDING_API}?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            parts: [{ text }]
          },
          taskType,
          outputDimensionality
        })
      }
    );

    if (!response.ok) {
      console.error(`Embedding API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.embedding?.values || null;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  apiKey: string,
  options: EmbeddingOptions = {}
): Promise<number[][]> {
  const results = await Promise.all(
    texts.map((text) => generateEmbedding(text, apiKey, options))
  );

  return results.filter((emb): emb is number[] => emb !== null);
}

/**
 * Normalize embeddings (unit length) for cosine similarity optimization
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return embedding;
  return embedding.map((val) => val / magnitude);
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimensions');
  }

  const normalizedA = normalizeEmbedding(a);
  const normalizedB = normalizeEmbedding(b);

  const dotProduct = normalizedA.reduce((sum, val, i) => sum + val * normalizedB[i], 0);
  return dotProduct; // Cosine similarity for normalized vectors
}

/**
 * Calculate euclidean distance between two embeddings (for L2 index)
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimensions');
  }

  const sum = a.reduce((acc, val, i) => {
    const diff = val - b[i];
    return acc + diff * diff;
  }, 0);

  return Math.sqrt(sum);
}