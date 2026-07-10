export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('document') as File;
    const documentTypeHint = formData.get('documentType') as string || 'AUTO';

    if (!file) {
      return NextResponse.json({ error: 'Dokumen harus diupload' }, { status: 400 });
    }

    // Check admin permissions
    const supabase = createClient();
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id, access_layer')
      .eq('id', (await supabase.auth.getSession()).data.session?.user.id)
      .single();

    if (!adminProfile || adminProfile.access_layer < 4) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Call Google Cloud Vision API
    const visionApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!visionApiKey) {
      return NextResponse.json({ error: 'OCR service tidak dikonfigurasi' }, { status: 500 });
    }

    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`;

    // Convert image to base64
    const base64Image = buffer.toString('base64');

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            { type: 'TEXT_DETECTION', maxResults: 1 },
            { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
          ],
        },
      ],
    };

    const visionResponse = await fetch(visionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Google Vision API error:', errorText);
      return NextResponse.json({ error: 'Gagal memproses OCR' }, { status: 500 });
    }

    const visionResult = await visionResponse.json();
    const fullText = visionResult.responses?.[0]?.fullTextAnnotation?.text || '';
    const textAnnotations = visionResult.responses?.[0]?.textAnnotations || [];

    // Extract structured data based on document type
    const extractedData = extractStructuredData(fullText, textAnnotations, documentTypeHint);

    return NextResponse.json({
      success: true,
      documentType: extractedData.documentType,
      extractedData: extractedData.data,
      rawText: fullText,
      confidence: extractedData.confidence,
    });

  } catch (error) {
    console.error('OCR extraction error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

function extractStructuredData(fullText: string, textAnnotations: any[], hint: string): {
  documentType: string;
  data: any;
  confidence: number;
} {
  const text = fullText.toLowerCase();
  let documentType = 'UNKNOWN';
  let confidence = 0.5;
  const data: any = {};

  // Detect document type
  if (text.includes('kartu keluarga') || text.includes('kk ') || text.includes('no. kk')) {
    documentType = 'KK';
    confidence = 0.85;
    // Extract KK specific fields
    data.no_kk = extractPattern(fullText, /no\.?\s*kk[:\s]+(\d+[\s\.\-\d]*)/i);
    data.nama_kepala = extractPattern(fullText, /kepala[:\s]+keluarga[:\s]+([a-z\s]+)/i);
    data.alamat = extractAddress(fullText);
    data.rt_rw = extractPattern(fullText, /rt[:\s]+(\d+\/\d+)/i);
    data.kelurahan = extractPattern(fullText, /kelurahan[:\s]+([a-z\s]+)/i);
    data.kecamatan = extractPattern(fullText, /kecamatan[:\s]+([a-z\s]+)/i);
    data.kota = extractPattern(fullText, /kabupaten[:\s]+([a-z\s]+)/i) || extractPattern(fullText, /kota[:\s]+([a-z\s]+)/i);
    
    // Extract family members (simplified)
    data.anggota_keluarga = extractFamilyMembers(fullText);
  } else if (text.includes('kartu tanda penduduk') || text.includes('ktp') || text.includes('nik')) {
    documentType = 'KTP';
    confidence = 0.9;
    data.nik = extractNIK(fullText);
    data.nama = extractPattern(fullText, /nama[:\s]+([a-z\s]+)/i);
    data.tempat_lahir = extractPattern(fullText, /tempat[\/\s]+tanggal[\/\s]+lahir[:\s]+([a-z\s]+)/i);
    data.tanggal_lahir = extractDate(fullText);
    data.jenis_kelamin = text.includes('/laki-laki') || text.includes('/laki') ? 'L' : 
                        text.includes('/perempuan') || text.includes('/wanita') ? 'P' : null;
    data.alamat = extractAddress(fullText);
  } else if (text.includes('surat baptis') || text.includes('baptis') || text.includes('sakramen baptis')) {
    documentType = 'BAPTIS';
    confidence = 0.8;
    data.nama_baptis = extractPattern(fullText, /nama[:\s]+([a-z\s]+)/i);
    data.nama_ayah = extractPattern(fullText, /ayah[:\s]+([a-z\s]+)/i);
    data.nama_ibu = extractPattern(fullText, /ibu[:\s]+([a-z\s]+)/i);
    data.tanggal_baptis = extractDate(fullText);
    data.paroki_baptis = extractPattern(fullText, /paroki[:\s]+([a-z\s]+)/i);
    data.pendeta = extractPattern(fullText, /pendeta[:\s]+([a-z\s\.]+)/i) || extractPattern(fullText, /romo[:\s]+([a-z\s\.]+)/i);
  } else if (text.includes('surat komuni') || text.includes('perkara ekaristi')) {
    documentType = 'KOMUNI_PERTAMA';
    confidence = 0.75;
    data.tanggal_komuni = extractDate(fullText);
  } else if (text.includes('surat penguatan') || text.includes('krisma')) {
    documentType = 'PENGUATAN';
    confidence = 0.75;
    data.tanggal_penguatan = extractDate(fullText);
  } else if (text.includes('surat perkawinan') || text.includes('akta nikah')) {
    documentType = 'PERKAWINAN';
    confidence = 0.75;
    data.tanggal_perkawinan = extractDate(fullText);
    data.nama_pasangan = extractPattern(fullText, /menikah[:\s]+dengan[:\s]+([a-z\s]+)/i);
  } else if (hint !== 'AUTO') {
    documentType = hint.toUpperCase();
    confidence = 0.6;
  }

  return {
    documentType,
    data: {
      ...data,
      raw_text: fullText,
      extracted_at: new Date().toISOString(),
    },
    confidence,
  };
}

function extractPattern(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  return match?.[1]?.trim() || null;
}

function extractNIK(text: string): string | null {
  const nikMatch = text.match(/\b\d{16}\b/);
  return nikMatch?.[0] || null;
}

function extractDate(text: string): string | null {
  // Match Indonesian date formats: dd/mm/yyyy, dd-mm-yyyy, dd month yyyy
  const datePatterns = [
    /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
    /(\d{2,4})[\/\-](\d{2})[\/\-](\d{2,4})/,
  ];
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  
  // Match Indonesian month names
  const monthNames = ['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];
  const monthMatch = text.match(new RegExp(`(\\d{1,2})\\s+(${monthNames.join('|')})\\s+(\\d{{4}})`, 'i'));
  if (monthMatch) {
    return `${monthMatch[1]}/${monthMatch[2]}/${monthMatch[3]}`;
  }
  
  return null;
}

function extractAddress(text: string): string | null {
  // Extract address after "alamat" keyword
  const alamatMatch = text.match(/alamat[:\s]+([^\n]+?)(?:\n|rt|rw|kelurahan|kecamatan|$)/i);
  if (alamatMatch) {
    return alamatMatch[1].trim();
  }
  return null;
}

function extractFamilyMembers(text: string): any[] {
  // Simplified family member extraction
  const members: any[] = [];
  const lines = text.split('\n');
  let currentMember: any = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Simple parsing: look for nama followed by relationships
    if (trimmed.match(/^(kepala|istri|anak|menantu|famili|pembantu)\s*$/i)) {
      currentMember.hubungan = trimmed.toLowerCase();
      members.push(currentMember);
      currentMember = {};
    } else if (trimmed.match(/^[a-z\s]+$/i) && !currentMember.nama) {
      currentMember.nama = trimmed;
    }
  }
  
  return members.filter(m => m.nama);
}