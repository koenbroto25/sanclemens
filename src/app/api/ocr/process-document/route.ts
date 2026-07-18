export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadToR2 } from '@/lib/storage/r2';
import { compressPDF } from '@/lib/storage/pdf-compress';
import { PDFDocument } from 'pdf-lib';

// Reference: wa-dokumen-extractor-bot for Indonesia document parsing patterns
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('document_type') as string || 'ktp';

    if (!file) {
      return NextResponse.json({ error: 'File dokumen wajib diupload' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP' }, { status: 400 });
    }

    // Convert file to buffers
    const arrayBuffer = await file.arrayBuffer();
    const bytes = Buffer.from(arrayBuffer);
    const base64Image = bytes.toString('base64');

    // Create compressed PDF from image
    const pdfDoc = await PDFDocument.create();
    const image = await pdfDoc.embedPng(bytes);
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    const pdfBytes = await pdfDoc.save();
    const compressedPdfBuffer = await compressPDF(Buffer.from(pdfBytes));

    // Call Google Cloud Vision API
    const visionApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!visionApiKey) {
      return NextResponse.json({ error: 'Google Cloud Vision API key tidak dikonfigurasi' }, { status: 500 });
    }

    // Detect text from document
    const visionResponse = await fetch(`${VISION_API_URL}?key=${visionApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [
              { type: 'TEXT_DETECTION', maxResults: 1 },
              { type: 'FACE_DETECTION', maxResults: 1 },
            ],
          },
        ],
      }),
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Vision API error:', errorText);
      return NextResponse.json({ error: 'Gagal memproses dokumen dengan Vision API' }, { status: 500 });
    }

    const visionResult = await visionResponse.json();
    const detectedText = visionResult.responses?.[0]?.fullTextAnnotation?.text || '';
    const confidence = visionResult.responses?.[0]?.textAnnotations?.[0]?.confidence || 0;

    if (!detectedText || confidence < 0.7) {
      return NextResponse.json({ 
        error: 'Teks dokumen tidak terdeteksi dengan jelas. Pastikan foto dokumen fokus dan pencahayaan cukup.' 
      }, { status: 400 });
    }

    // Parse extracted text based on document type
    const extractedData = parseDocumentText(detectedText, documentType);

    // Upload compressed PDF to Cloudflare R2
    const r2Bucket = process.env.R2_BUCKET_NAME || 'paroki-documents';
    const pdfR2Key = `documents/${user.id}/${Date.now()}_${file.name.replace(/\.[^.]+$/, '')}.pdf`;
    const pdfR2Url = await uploadToR2(r2Bucket, pdfR2Key, compressedPdfBuffer, 'application/pdf', false);

    // Save to documents table
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        document_type: documentType,
        file_name: file.name,
        file_size: compressedPdfBuffer.length,
        file_url: pdfR2Url,
        r2_key: pdfR2Key,
        extracted_text: detectedText,
        extracted_data: extractedData,
        ocr_confidence: confidence,
        status: 'pending_user_verification',
      })
      .select()
      .single();

    if (docError) {
      console.error('Error saving document:', docError);
      // Clean up R2 file if database insert fails
      await deleteFromR2(pdfR2Key);
      return NextResponse.json({ error: 'Gagal menyimpan data dokumen' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        document_id: document.id,
        document_type: documentType,
        extracted_data: extractedData,
        confidence: confidence,
        r2_url: pdfR2Url,
        status: 'pending_user_verification',
      },
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/**
 * Parse extracted text based on document type
 * Reference: wa-dokumen-extractor-bot patterns for Indonesia documents
 */
function parseDocumentText(text: string, documentType: string): Record<string, string> {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const result: Record<string, string> = {};

  switch (documentType) {
    case 'ktp':
      // NIK: 16 digits
      const nikMatch = text.match(/\d{16}/);
      if (nikMatch) result.nik = nikMatch[0];

      // Name: usually after "Nama" or uppercase words
      const namaMatch = text.match(/Nama[:\s]+([A-Z\s]+)/i);
      if (namaMatch) result.nama = namaMatch[1].trim();

      // Place and date of birth
      const ttlMatch = text.match(/Tempat.*?Lahir[:\s]+([A-Z\s]+,\s+\d{1,2}[-\s]\w+[-\s]\d{4})/i);
      if (ttlMatch) result.tempat_tanggal_lahir = ttlMatch[1].trim();

      // Address
      const alamatMatch = text.match(/Alamat[:\s]+(.+?)(?:\n|RT|RW)/i);
      if (alamatMatch) result.alamat = alamatMatch[1].trim();

      // RT/RW
      const rtRwMatch = text.match(/RT[:\s]*(\d+).*?RW[:\s]*(\d+)/i);
      if (rtRwMatch) {
        result.rt = rtRwMatch[1];
        result.rw = rtRwMatch[2];
      }

      // Gender
      const jkMatch = text.match(/Jenis Kelamin[:\s]+(Laki-laki|Perempuan)/i);
      if (jkMatch) result.jenis_kelamin = jkMatch[1];

      break;

    case 'kk':
      // KK number: 16 digits
      const kkMatch = text.match(/\b\d{16}\b/);
      if (kkMatch) result.nomor_kk = kkMatch[0];

      // Family head name
      const kkKepalaMatch = text.match(/Kepala Keluarga[:\s]+([A-Z\s]+)/i);
      if (kkKepalaMatch) result.kepala_keluarga = kkKepalaMatch[1].trim();

      // Address
      const kkAlamatMatch = text.match(/Alamat[:\s]+(.+?)(?:\n|RT|RW)/i);
      if (kkAlamatMatch) result.alamat = kkAlamatMatch[1].trim();

      // RT/RW
      const kkRtRwMatch = text.match(/RT[:\s]*(\d+).*?RW[:\s]*(\d+)/i);
      if (kkRtRwMatch) {
        result.rt = kkRtRwMatch[1];
        result.rw = kkRtRwMatch[2];
      }

      break;

    case 'sim':
      // SIM number format varies
      const simMatch = text.match(/\b[A-Z]\d{11,13}\b/);
      if (simMatch) result.nomor_sim = simMatch[0];

      // Name
      const simNamaMatch = text.match(/Nama[:\s]+([A-Z\s]+)/i);
      if (simNamaMatch) result.nama = simNamaMatch[1].trim();

      // Valid until
      const berlakuMatch = text.match(/Berlaku[:\s]+sampai[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
      if (berlakuMatch) result.berlaku_sampai = berlakuMatch[1];

      break;

    default:
      // Generic extraction: try to find common patterns
      const numbers = text.match(/\d{10,}/g);
      if (numbers) result.nomor_dokumen = numbers[0];
      break;
  }

  return result;
}

async function deleteFromR2(key: string): Promise<void> {
  // Implement R2 deletion if needed
  console.warn('R2 cleanup required for key:', key);
}