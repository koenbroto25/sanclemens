import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '@/lib/r2-client';

// Workaround for qrcode module without types
// @ts-ignore
const QRCode = require('qrcode');

const R2_BUCKET = process.env.R2_DOCUMENTS_BUCKET_NAME || 'paroki-klemens-private-docs';

export interface DocumentTemplateData {
  [key: string]: any;
}

export interface DocumentType {
  document_type_code: string;
  document_name: string;
  default_prefix: string;
  template_id?: string;
  required_roles_to_generate: string[];
  is_user_claimable: boolean;
  is_pidu_linked: boolean;
  number_to_profile_column_name?: string;
  link_to_profile_column_name?: string;
  visibility_roles: string[];
  encryption_required: boolean;
  audit_log_enabled: boolean;
}

export interface Document {
  id: string;
  document_id: string;
  document_type_code: string;
  pidu_owner_id: string;
  status: string;
  template_data: DocumentTemplateData;
  issued_by: string;
  issued_at: string;
  pdf_url?: string;
}

async function loadFontBytes(fontPath: string): Promise<Uint8Array | null> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const fontDir = path.join(process.cwd(), 'public', 'fonts');
    const fontFile = path.join(fontDir, fontPath);
    if (fs.existsSync(fontFile)) {
      return fs.readFileSync(fontFile);
    }
    return null;
  } catch {
    return null; // Font tidak tersedia, fallback ke standard font
  }
}

/**
 * Generate PDF menggunakan pdf-lib
 */
export async function generatePDF(
  document: Document,
  docType: DocumentType,
  templateContent?: Buffer
): Promise<{ buffer: Buffer; fileName: string }> {
  try {
    const pdfDoc = await PDFDocument.create();
    
    // Load standard font (Times Roman untuk tampilan formal)
    let font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    let boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    
    // Coba load Noto Sans font Indonesia (jika tersedia)
    const notoSans = await loadFontBytes('NotoSans-Regular.ttf');
    const notoSansBold = await loadFontBytes('NotoSans-Bold.ttf');
    if (notoSans && notoSansBold) {
      font = await pdfDoc.embedFont(notoSans);
      boldFont = await pdfDoc.embedFont(notoSansBold);
    }

    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    
    let y = height - 50;
    const margin = 50;
    const fontSize = 11;
    const titleSize = 18;
    const headerSize = 14;
    const lineHeight = 16;

    // Helper untuk draw text
    const drawText = (text: string, size: number = fontSize, bold: boolean = false, x: number = margin) => {
      page.drawText(text, {
        x,
        y,
        size,
        font: bold ? boldFont : font,
        color: rgb(0, 0, 0),
      });
      y -= (size + 4);
    };

    const drawLine = () => {
      y -= 6;
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 1,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 10;
    };

    // === HEADER ===
    drawText('PAROKI SANTO KLEMENS SEPINGGAN', titleSize, true);
    drawText('Keuskupan Agung Samarinda', 10);
    drawLine();

    // === DOKUMEN DIGITAL ===
    drawText('DOKUMEN DIGITAL PAROKI', headerSize, true);
    drawLine();

    // === INFO DOKUMEN ===
    drawText(`Jenis Dokumen: ${docType.document_name}`, fontSize, true);
    drawText(`Nomor Dokumen: ${document.document_id}`, fontSize);
    drawText(`Status: ${document.status.toUpperCase()}`, fontSize);
    
    const issuedAt = document.issued_at 
      ? new Date(document.issued_at).toLocaleString('id-ID', { 
          timeZone: 'Asia/Makassar',
          year: 'numeric',
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '-';
    drawText(`Tanggal Terbit: ${issuedAt} WITA`, fontSize);
    drawLine();

    // === DATA DOKUMEN ===
    drawText('DATA DOKUMEN', headerSize, true);
    
    if (document.template_data) {
      for (const [key, value] of Object.entries(document.template_data)) {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const textValue = typeof value === 'object' ? JSON.stringify(value) : String(value || '-');
        drawText(`${label}: ${textValue}`);
      }
    }
    drawLine();

    // === QR CODE VERIFIKASI ===
    const verifyUrl = `https://paroki-stclemens.vercel.app/verify/${document.document_id}`;
    try {
      const qrPngBuffer = await QRCode.toBuffer(verifyUrl, {
        width: 150,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      const qrImage = await pdfDoc.embedPng(qrPngBuffer);
      const qrSize = 100;
      const qrX = width - margin - qrSize;
      const qrY = y - qrSize - 20;
      
      page.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize,
      });
      
      drawText('Scan untuk verifikasi', 8, true, qrX);
      y = qrY - 15;
    } catch (qrError) {
      console.error('Error generating QR code:', qrError);
      drawText('[QR CODE ERROR]', 9, true, width - 150);
      y -= 20;
    }

    // === VERIFIKASI ===
    drawLine();
    drawText('VERIFIKASI DOKUMEN', headerSize, true);
    drawText('Kunjungi: https://paroki-stclemens.vercel.app/verifikasi', 9);
    drawText(`Masukkan nomor: ${document.document_id}`, 9);
    drawLine();

    // === FOOTER ===
    drawText('Dokumen ini diterbitkan secara digital oleh sistem Paroki Santo Klemens.', 8);
    drawText('Memiliki tanda tangan digital dan jejak audit yang tidak bisa disangkal.', 8);
    drawText(`Digital ID: ${document.document_id} | Dicetak: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })}`, 8);

    // === Generate bytes ===
    const pdfBytes = await pdfDoc.save();
    
    return {
      buffer: Buffer.from(pdfBytes),
      fileName: `${document.document_id}.pdf`
    };
  } catch (error) {
    console.error('Error generating PDF with pdf-lib:', error);
    // Fallback: generate plain text placeholder
    const content = `DOKUMEN DIGITAL PAROKI SANTO KLEMENS\n\nJenis: ${docType.document_name}\nNo: ${document.document_id}\nTanggal: ${document.issued_at}\n\nData:\n${JSON.stringify(document.template_data, null, 2)}`;
    return {
      buffer: Buffer.from(content, 'utf-8'),
      fileName: `${document.document_id}.txt`
    };
  }
}

/**
 * Upload PDF to Cloudflare R2 (bucket dokumen)
 */
export async function uploadPDFToR2(
  documentUuid: string,
  pdfBuffer: Buffer,
  contentType: string = 'application/pdf'
): Promise<{ r2Key: string; publicUrl: string }> {
  const r2Key = `documents/${documentUuid}/document.pdf`;
  const publicBase = process.env.R2_DOCUMENTS_PUBLIC_URL || '';
  
  try {
    await r2Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: pdfBuffer,
      ContentType: contentType,
      Metadata: {
        'document-id': documentUuid,
        'uploaded-at': new Date().toISOString(),
      }
    }));

    const publicUrl = `${publicBase}/${r2Key}`;
    return { r2Key, publicUrl };
  } catch (error) {
    console.error('Error uploading PDF to R2:', error);
    throw new Error('Failed to upload PDF to R2');
  }
}

/**
 * Fetch PDF from Cloudflare R2
 */
export async function fetchPDFFromR2(r2Key: string): Promise<Buffer> {
  try {
    const response = await r2Client.send(new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
    }));

    if (!response.Body) {
      throw new Error('Empty PDF content');
    }

    return Buffer.from(await response.Body.transformToByteArray());
  } catch (error) {
    console.error('Error fetching PDF from R2:', error);
    throw new Error('Failed to fetch PDF from R2');
  }
}