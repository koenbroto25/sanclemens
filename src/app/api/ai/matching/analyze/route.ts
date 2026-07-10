import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { generateQueryEmbedding, retrieveKnowledge } from '@/lib/ai/retriever';

export const dynamic = 'force-dynamic';

interface AnalyzeRequest {
  message: string;
  user_id?: string;
  context?: Record<string, any>;
}

interface AnalyzeResponse {
  intent: string;
  domain: string;
  question_type: string;
  confidence: number;
  entities: Record<string, any>;
  routing_confidence: number;
  needs_clarification: boolean;
  requires_tool_use: boolean;
  target_bot?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { message, user_id, context = {} } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      );
    }

    // Simple intent classification (fallback without LLM)
    const lower = message.toLowerCase();
    let intent = 'INFORMASI';
    let domain = 'public_info';
    let questionType = 'general_query';
    let confidence = 0.7;
    let targetBot = 'bot_1';

    // Business/Work patterns
    if (lower.match(/cari|jual|beli|usaha|tukang|bengkel|katering|lowongan|kerja|karier|skill|keahlian|jasa|toko|produk/)) {
      intent = 'BUSINESS_SEARCH';
      domain = 'business_work';
      questionType = 'business_search_query';
      confidence = 0.85;
      targetBot = 'bot_7';
    }
    // Theology patterns
    else if (lower.match(/sakramen|eukarist|krisma|baptis|nikah|doa|rohani|iman|gospel|alkitab|katekismus|kgk|khk|paus|vatican|teologi|ajaran/)) {
      intent = 'THEOLOGY_QUERY';
      domain = 'theology';
      questionType = 'dogmatic_explanation';
      confidence = 0.85;
      targetBot = 'bot_8';
    }
    // Prayer/spiritual guidance
    else if (lower.match(/doa|renungan|rohani|kebersamaan|pendampingan|darurat|bunuh|mati/)) {
      intent = 'SPIRITUAL_GUIDANCE';
      domain = 'theology';
      questionType = 'spiritual_guidance';
      confidence = 0.8;
      targetBot = 'bot_3';
    }
    // Family/admin
    else if (lower.match(/keluarga|sakramen|kk|kartu|domisili|surat/)) {
      intent = 'FAMILY_DATA';
      domain = 'admin_documents';
      questionType = 'family_data_query';
      confidence = 0.75;
      targetBot = 'bot_6';
    }
    // General parish info
    else if (lower.match(/jadwal|misa|gereja|alamat|warta|kegiatan|profil|kontak|jam|hari raya|liturgi/)) {
      intent = 'PARISH_INFO';
      domain = 'public_info';
      questionType = 'factual_parish_details';
      confidence = 0.85;
      targetBot = 'bot_1';
    }

    // Generate entities based on message
    const entities: Record<string, any> = {
      keywords: lower.split(' ').filter(w => w.length > 3).slice(0, 10),
      has_location: /\b(balikpapan|sepinggan|st\s*\w+|lingkungan\s*\w+)\b/i.test(lower),
      has_person: /\b(pastor|pak\s*\w+|bu\s*\w+)\b/i.test(lower)
    };

    const response: AnalyzeResponse = {
      intent,
      domain,
      question_type: questionType,
      confidence,
      entities,
      routing_confidence: confidence,
      needs_clarification: confidence < 0.6,
      requires_tool_use: false,
      target_bot: targetBot
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in /api/ai/matching/analyze:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}