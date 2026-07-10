import sharp from 'sharp';

export type ImageType = 'profile' | 'activity' | 'vault' | 'marketplace';

interface CompressionTarget {
  maxWidth: number;
  quality: number;
  format: 'webp' | 'jpeg';
  maxSizeKB: number;
}

const COMPRESSION_TARGETS: Record<ImageType, CompressionTarget> = {
  profile: {
    maxWidth: 300,
    quality: 80,
    format: 'webp',
    maxSizeKB: 100,
  },
  activity: {
    maxWidth: 1200,
    quality: 75,
    format: 'webp',
    maxSizeKB: 300,
  },
  vault: {
    maxWidth: 1600,
    quality: 85,
    format: 'jpeg',
    maxSizeKB: 500,
  },
  marketplace: {
    maxWidth: 1200,
    quality: 75,
    format: 'webp',
    maxSizeKB: 300,
  },
};

/**
 * Compress an image buffer to the target specifications.
 * Falls back gracefully if sharp is not available in serverless env.
 */
export async function compressImage(
  buffer: Buffer,
  type: ImageType
): Promise<Buffer> {
  const target = COMPRESSION_TARGETS[type];

  try {
    let pipeline = sharp(buffer)
      .resize(target.maxWidth, undefined, {
        fit: 'inside',
        withoutEnlargement: true,
      });

    if (target.format === 'webp') {
      pipeline = pipeline.webp({ quality: target.quality });
    } else {
      pipeline = pipeline.jpeg({ quality: target.quality });
    }

    const compressed = await pipeline.toBuffer();

    // Verify size is within target; if not, reduce quality iteratively
    if (compressed.length > target.maxSizeKB * 1024) {
      let reducedQuality = target.quality - 10;
      let result = compressed;

      while (reducedQuality >= 30 && result.length > target.maxSizeKB * 1024) {
        let retry = sharp(buffer)
          .resize(target.maxWidth, undefined, {
            fit: 'inside',
            withoutEnlargement: true,
          });

        if (target.format === 'webp') {
          retry = retry.webp({ quality: reducedQuality });
        } else {
          retry = retry.jpeg({ quality: reducedQuality });
        }

        result = await retry.toBuffer();
        reducedQuality -= 10;
      }

      return result;
    }

    return compressed;
  } catch (error) {
    console.error('Image compression error:', error);
    // Return original buffer if compression fails
    return buffer;
  }
}

/**
 * Get the target max size for an image type (in KB).
 */
export function getMaxSizeKB(type: ImageType): number {
  return COMPRESSION_TARGETS[type].maxSizeKB;
}
