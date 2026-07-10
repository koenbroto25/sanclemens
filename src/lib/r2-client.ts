/**
 * Cloudflare R2 Client â€” S3-compatible API
 * 
 * Spesifikasi: rag_ai_r2.md Â§6.1
 * 
 * Client ini digunakan untuk:
 * 1. Upload teks konten ke R2 (saat ingest pipeline)
 * 2. Fetch teks konten dari R2 (saat Orchestrator butuh full text untuk LLM)
 * 
 * IMPORTANT:
 * - R2 credentials HANYA boleh ada di server-side (.env.local, bukan .env)
 * - Access key R2 TIDAK BOLEH diekspos ke client/browser
 * - Bucket HARUS private (bukan public)
 */

import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CLIENT INITIALIZATION
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME || "paroki-klemens-rag-content";
const R2_PREVIEW_LENGTH = parseInt(process.env.R2_CONTENT_PREVIEW_LENGTH || "150", 10);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// UPLOAD FUNCTIONS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Upload konten teks ke R2 dan return (r2_key, preview)
 * 
 * @param r2Key - Full path di R2, contoh: "chunks/theological/{uuid}.txt" atau "qa/{uuid}.txt"
 * @param content - Teks lengkap yang akan disimpan
 * @returns { r2_key, preview } - preview adalah 150 karakter pertama
 */
export async function uploadContentToR2(
  r2Key: string,
  content: string
): Promise<{ r2Key: string; preview: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: Buffer.from(content, "utf-8"),
      ContentType: "text/plain; charset=utf-8",
    });

    await r2Client.send(command);

    const preview = content.slice(0, R2_PREVIEW_LENGTH).trim();

    return { r2Key, preview };
  } catch (error) {
    console.error(`[R2] Failed to upload ${r2Key}:`, error);
    throw new Error(`R2 upload failed: ${error}`);
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// FETCH FUNCTIONS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Fetch teks lengkap dari R2 berdasarkan r2_key
 * 
 * @param r2Key - Path object di R2
 * @returns Teks lengkap, atau null jika tidak ditemukan (orphan)
 */
export async function fetchContentFromR2(r2Key: string): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
    });

    const response = await r2Client.send(command);
    
    // Stream to string
    const stream = response.Body;
    if (!stream) {
      console.warn(`[R2] Empty body for ${r2Key}`);
      return null;
    }

    const text = await stream.transformToString("utf-8");
    return text;
  } catch (error: any) {
    if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
      console.warn(`[R2] Orphan object detected: ${r2Key} not found in bucket`);
      return null;
    }
    
    console.error(`[R2] Failed to fetch ${r2Key}:`, error);
    return null; // Graceful degradation â€” jangan gagal total
  }
}

/**
 * Check apakah object ada di R2 (tanpa download content)
 * 
 * @param r2Key - Path object di R2
 * @returns true jika ada, false jika tidak
 */
export async function r2ObjectExists(r2Key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
    });

    await r2Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    
    console.error(`[R2] HeadObject failed for ${r2Key}:`, error);
    return false;
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// BATCH OPERATIONS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Fetch multiple objects dari R2 secara paralel
 * 
 * @param r2Keys - Array of R2 keys
 * @returns Map of r2Key -> content (hanya yang berhasil)
 */
export async function fetchMultipleFromR2(
  r2Keys: string[]
): Promise<Map<string, string>> {
  const results = await Promise.allSettled(
    r2Keys.map(async (r2Key) => {
      const content = await fetchContentFromR2(r2Key);
      return { r2Key, content };
    })
  );

  const map = new Map<string, string>();
  
  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value.content !== null) {
      map.set(result.value.r2Key, result.value.content);
    }
  });

  return map;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// UTILITY FUNCTIONS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Generate R2 key untuk chunk teologis
 */
export function getTheologicalChunkR2Key(chunkId: string): string {
  return `chunks/theological/${chunkId}.txt`;
}

/**
 * Generate R2 key untuk chunk operasional
 */
export function getOperationalChunkR2Key(chunkId: string): string {
  return `chunks/operational/${chunkId}.txt`;
}

/**
 * Generate R2 key untuk Q&A pair
 */
export function getQAPairR2Key(qaPairId: string): string {
  return `qa/${qaPairId}.txt`;
}

/**
 * Generate R2 key untuk chunk entity terstruktur
 */
export function getStructuredEntityChunkR2Key(chunkId: string): string {
  return `chunks/structured_entity/${chunkId}.txt`;
}

/**
 * Generate R2 key untuk chunk internal admin
 */
export function getInternalAdminChunkR2Key(chunkId: string): string {
  return `chunks/internal_admin/${chunkId}.txt`;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// VALIDATION HELPERS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Validasi format R2 key sesuai naming convention
 */
export function isValidR2Key(r2Key: string): boolean {
  const validPatterns = [
    /^qa\/[a-f0-9-]+\.txt$/,
    /^chunks\/theological\/[a-f0-9-]+\.txt$/,
    /^chunks\/operational\/[a-f0-9-]+\.txt$/,
    /^chunks\/structured_entity\/[a-f0-9-]+\.txt$/,
    /^chunks\/internal_admin\/[a-f0-9-]+\.txt$/,
  ];

  return validPatterns.some(pattern => pattern.test(r2Key));
}

/**
 * Extract chunk ID dari R2 key
 */
export function extractIdFromR2Key(r2Key: string): string | null {
  const match = r2Key.match(/\/([a-f0-9-]+)\.txt$/);
  return match ? match[1] : null;
}