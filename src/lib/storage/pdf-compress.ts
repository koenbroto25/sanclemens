import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

/**
 * Compress PDF using pdf-lib optimizations
 * Note: pdf-lib doesn't expose high-level API for embedded image iteration.
 * This function applies general PDF optimizations.
 * @param pdfBuffer Original PDF buffer
 * @returns Compressed PDF buffer
 */
export async function compressPDF(pdfBuffer: Buffer): Promise<Buffer> {
  try {
    // Load the original PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    // Save with optimizations:
    // - useObjectStreams: true - more efficient encoding (compresses objects)
    // - useObjectStreams: true reduces size by ~20-30%
    const compressedPdfBytes = await pdfDoc.save({
      useObjectStreams: true,
    });
    
    return Buffer.from(compressedPdfBytes);
  } catch (error) {
    console.error('PDF compression error:', error);
    // Return original buffer if compression fails
    return pdfBuffer;
  }
}

/**
 * Calculate PDF compression ratio
 */
export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  return ((originalSize - compressedSize) / originalSize) * 100;
}