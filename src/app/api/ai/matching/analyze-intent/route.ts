export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, conversation_history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Pesan harus diisi' }, { status: 400 });
    }

    // AI Intent Detection Logic
    // This is a simplified rule-based version - in production, use actual AI model
    
    const lowerMessage = message.toLowerCase();
    
    // Intent classification with confidence scoring
    let intent = 'tidak_ada';
    let confidence = 0;
    let entities: any = {};
    let suggested_action = 'direct_match';

    // Detect job-seeking intent
    if (lowerMessage.match(/cari kerja|butuh kerja|nganggur|lowongan|kerjaan|pekerjaan/)) {
      intent = 'cari_kerja';
      confidence = 0.85;
      entities.job_type = extractJobType(lowerMessage);
      entities.urgency_level = detectUrgency(lowerMessage);
      suggested_action = 'direct_match';
    }
    // Detect skill offering intent
    else if (lowerMessage.match(/saya bisa|saya ahli|skill|keahlian|bisa cat|bisa bangun|tukang/)) {
      intent = 'tawarkan_keahlian';
      confidence = 0.82;
      entities.skills = extractSkills(lowerMessage);
      suggested_action = 'direct_match';
    }
    // Detect assistance need intent (GAKIN-aware)
    else if (lowerMessage.match(/butuh sembako|butuh bantuan|makan susah|biaya medis|biaya sekolah|rumah sakit/)) {
      intent = 'butuh_bantuan';
      confidence = 0.88;
      entities.urgency_level = detectUrgency(lowerMessage);
      suggested_action = 'notify_kl'; // Always notify KL for material assistance
    }
    // Detect donation offering intent
    else if (lowerMessage.match(/mau bantu|mau donasi|punya lebih|ingin membantu|sedekah/)) {
      intent = 'tawarkan_donasi';
      confidence = 0.80;
      suggested_action = 'direct_match';
    }

    // Get user profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('lingkungan_id, family_id')
      .eq('id', user.id)
      .single();

    // Check GAKIN status if user has family
    let isGakin = false;
    if (profile?.family_id) {
      const { data: gakinData } = await supabase
        .from('data_gakin')
        .select('status')
        .eq('family_id', profile.family_id)
        .in('status', ['active', 'pending'])
        .single();
      
      isGakin = !!gakinData;
    }

    // Log intent detection
    await supabase.from('umat_needs').upsert({
      user_id: user.id,
      needs: {
        ...(intent !== 'tidak_ada' ? { [intent]: { confidence, last_detected: new Date().toISOString() } } : {}),
        is_gakin: isGakin
      },
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

    return NextResponse.json({
      success: true,
      data: {
        intent,
        confidence,
        entities: {
          ...entities,
          is_gakin: isGakin,
          lingkungan_id: profile?.lingkungan_id
        },
        suggested_action,
        reasoning: generateReasoning(intent, confidence, isGakin)
      }
    });

  } catch (error) {
    console.error('Analyze intent error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// Helper functions
function extractJobType(message: string): string {
  const jobKeywords: { [key: string]: string } = {
    'cat': 'tukang_cat',
    'tembok': 'tukang_tembok',
    'bangun': 'tukang_bangun',
    'kebun': 'tukang_kebun',
    'supir': 'supir',
    'bantu masak': 'asisten_rumah_tangga',
    'tutor': 'tutor',
    'les': 'tutor'
  };

  for (const [keyword, jobType] of Object.entries(jobKeywords)) {
    if (message.includes(keyword)) return jobType;
  }
  return 'umum';
}

function extractSkills(message: string): string[] {
  const skills: string[] = [];
  const skillKeywords = [
    'cat tembok', 'tukang', 'bangun', 'kebun', 'supir', 
    'masak', 'tutor', 'les', 'servis', 'mekanik', 
    'electric', 'air', 'bersih', 'jagal'
  ];

  skillKeywords.forEach(skill => {
    if (message.includes(skill)) skills.push(skill);
  });

  return skills.length > 0 ? skills : ['umum'];
}

function detectUrgency(message: string): 'low' | 'medium' | 'high' | 'critical' {
  const urgentWords = ['segera', 'butuh sekarang', 'darurat', 'mendesak', 'sakit', 'kritis'];
  const mediumWords = ['secepatnya', 'segera', 'butuh cepat'];
  
  if (message.match(/darurat|kritis|sakit parah|mati/)) return 'critical';
  if (message.match(/segera|butuh sekarang|mendesak/)) return 'high';
  if (message.match(/secepatnya|butuh cepat/)) return 'medium';
  return 'low';
}

function generateReasoning(intent: string, confidence: number, isGakin: boolean): string {
  let reason = `Intent detected: ${intent} (confidence: ${confidence})`;
  if (isGakin) reason += ' | User memiliki GAKIN aktif - mendapat prioritas tinggi';
  return reason;
}