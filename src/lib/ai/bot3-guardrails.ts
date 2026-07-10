/**
 * Bot 3 (Companion Rohani) Guardrails & Restrictions
 * Implements:
 * 1. Restricted charity_social access (search_charity_services only, p_limit 2-3)
 * 2. Anti-prompt injection detection
 * 3. Redirection logic for "cari kerja/usaha" Ã¢â€ â€™ Bot 7
 * 4. Emergency protocol with SOS pre-check
 */

import { createClient } from '@/lib/supabase/server';

// Bot 3 allowed tools (restricted)
export const BOT_3_ALLOWED_TOOLS = {
  search_charity_services: true, // Read-only, p_limit 2-3
  // NOT allowed: search_usaha_umat, search_lowongan_kerja, create_umat_need
};

// Maximum results for charity_social search in Bot 3
export const BOT_3_CHARITY_SEARCH_LIMIT = 3;

// Injection patterns untuk Bot 3
export const INJECTION_PATTERNS = [
  /abaikan instruksi sebelumnya/i,
  /ignore previous instructions/i,
  /berpura-pura (menjadi|tidak ada|kamu)/i,
  /kamu sekarang adalah/i,
  /DAN (jangan|lupakan|abaikan)/i,
  /sekarang kamu adalah/i,
  /buatlah (sepandai|seajaib)/i,
  /tuliskan (semua|seluruh)/i
];

// Emergency keywords untuk Bot 3
export const EMERGENCY_KEYWORDS = [
  /bunuh diri/i,
  /mati saja/i,
  /tidak mau hidup/i,
  /mengakhiri hidup/i,
  /kekerasan/i,
  /dipukul/i,
  /dianiaya/i,
  /darurat/i,
  /tolong saya/i
];

interface CharityServiceSearchParams {
  query: string;
  limit?: number;
  user_access_level: number;
}

/**
 * Search charity services with strict limit for Bot 3
 * This is the ONLY allowed cross-domain access for Bot 3
 */
export async function searchCharityServicesRestricted(
  supabase: ReturnType<typeof createClient>,
  params: CharityServiceSearchParams
): Promise<any[]> {
  const { query, user_access_level } = params;
  
  // Force limit to max 3 for Bot 3
  const limit = Math.min(params.limit || BOT_3_CHARITY_SEARCH_LIMIT, BOT_3_CHARITY_SEARCH_LIMIT);

  // Call the charity search RPC (assuming it exists)
  const { data, error } = await supabase.rpc('search_charity_services', {
    p_query: query,
    p_limit: limit,
    p_user_access_level: user_access_level
  });

  if (error) {
    console.error('Error searching charity services:', error);
    return [];
  }

  return data || [];
}

/**
 * Detect prompt injection attempts
 */
export function detectPromptInjection(query: string): boolean {
  return INJECTION_PATTERNS.some(pattern => pattern.test(query));
}

/**
 * Detect emergency keywords in query
 */
export function detectEmergency(query: string): boolean {
  return EMERGENCY_KEYWORDS.some(keyword => keyword.test(query));
}

/**
 * Check SOS abuse level for user
 */
export async function checkSOSAbuseLevel(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{ level: number; isRestricted: boolean }> {
  const { data, error } = await supabase
    .from('sos_abuse_tracker')
    .select('restriction_level, is_restricted')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { level: 0, isRestricted: false };
  }

  return {
    level: data.restriction_level || 0,
    isRestricted: data.is_restricted || false
  };
}

/**
 * Check if query is about "cari kerja/usaha" (should redirect to Bot 7)
 */
export function isWorkOrBusinessQuery(query: string): boolean {
  const workBusinessPatterns = [
    /cari (kerja|pekerjaan|lowongan)/i,
    /butuh (kerja|pekerjaan)/i,
    /mencari (kerja|pekerjaan)/i,
    /ada (lowongan|kerja)/i,
    /info (lowongan|kerja)/i,
    /usaha (saya|aku)/i,
    /jual (barang|produk)/i,
    /beli (barang|produk)/i,
    /tukang (listrik|ac|bengkel)/i
  ];

  return workBusinessPatterns.some(pattern => pattern.test(query));
}

/**
 * Get redirection target for Bot 3
 * Returns Bot 7 if query is about work/business, null otherwise
 */
export function getBot3Redirection(query: string): { bot_id: string; message: string } | null {
  if (isWorkOrBusinessQuery(query)) {
    return {
      bot_id: 'bot_7',
      message: 'Untuk kebutuhan pekerjaan atau usaha, silakan gunakan fitur Klemen Kerja di menu utama.'
    };
  }

  return null;
}

/**
 * Escalate to SOS with pre-check abuse level
 */
export async function escalateToSOSWithPreCheck(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  triggerType: 'spiritual_emergency' | 'abuse_detected',
  metadata?: any
): Promise<{ success: boolean; reason?: string; sos_id?: string }> {
  // Pre-check abuse level
  const abuseStatus = await checkSOSAbuseLevel(supabase, userId);

  if (abuseStatus.level === 3 || abuseStatus.isRestricted) {
    return {
      success: false,
      reason: 'User is restricted from SOS. Please contact Pastor directly.'
    };
  }

  // Insert SOS record
  const { data, error } = await supabase
    .from('pastoral_sos')
    .insert({
      user_id: userId,
      trigger_type: triggerType,
      trigger_source: 'bot_3_companion',
      status: 'pending',
      metadata: metadata || {}
    });

  if (error) {
    console.error('Error escalating to SOS:', error);
    return { success: false, reason: 'Failed to escalate' };
  }

  // WhatsApp notification to Pastor/KL is handled by Fonnte Edge Function
  // Trigger notification asynchronously

  return { success: true, sos_id: (data as any)?.id };
}

/**
 * Update pastoral session with new theme
 */
export async function updatePastoralSessionTheme(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  theme: string
): Promise<void> {
  // Get existing session
  const { data: existing } = await supabase
    .from('pastoral_sessions')
    .select('key_themes')
    .eq('user_id', userId)
    .single();

  const currentThemes = existing?.key_themes || [];
  
  // Add theme if not already present
  if (!currentThemes.includes(theme)) {
    const updatedThemes = [...currentThemes, theme].slice(-10); // Keep last 10 themes
    
    await supabase
      .from('pastoral_sessions')
      .upsert({
        user_id: userId,
        key_themes: updatedThemes,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
  }
}

/**
 * Main guardrail check for Bot 3
 * Returns action to take: 'proceed', 'redirect', 'refuse', 'escalate_sos'
 */
export async function checkBot3Guardrails(
  supabase: ReturnType<typeof createClient>,
  query: string,
  userId?: string
): Promise<{
  action: 'proceed' | 'redirect' | 'refuse' | 'escalate_sos';
  data?: any;
}> {
  // 1. Check for prompt injection
  if (detectPromptInjection(query)) {
    return {
      action: 'refuse',
      data: {
        reason: 'injection_detected',
        message: 'Pertanyaan ini tidak dipahami. Saya hanya dapat membantu dengan pendampingan rohani dan pastoral.'
      }
    };
  }

  // 2. Check for emergency keywords
  if (detectEmergency(query)) {
    if (userId) {
      const escalationResult = await escalateToSOSWithPreCheck(
        supabase,
        userId,
        'spiritual_emergency',
        { query, detected_at: new Date().toISOString() }
      );

      if (escalationResult.success) {
        return {
          action: 'escalate_sos',
          data: {
            message: 'Saya mendeteksi bahwa Anda sedang dalam keadaan darurat. Saya telah mengirimkan permintaan bantuan kepada Pastor dan Ketua Lingkungan Anda. Silakan tunggu atau hubungi langsung di nomor darurat.',
            sos_id: escalationResult.sos_id
          }
        };
      } else {
        return {
          action: 'refuse',
          data: {
            message: escalationResult.reason || 'Tidak dapat mengeskalasi saat ini. Silakan hubungi Pastor langsung.'
          }
        };
      }
    } else {
      return {
        action: 'refuse',
        data: {
          message: 'Untuk keadaan darurat, silakan hubungi Pastor langsung atau layanan darurat terdekat.'
        }
      };
    }
  }

  // 3. Check for work/business query (should redirect to Bot 7)
  const redirection = getBot3Redirection(query);
  if (redirection) {
    return {
      action: 'redirect',
      data: redirection
    };
  }

  // 4. All checks passed
  return {
    action: 'proceed'
  };
}

/**
 * Log injection attempt
 */
export async function logInjectionAttempt(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  query: string,
  botId: string
): Promise<void> {
  await supabase.from('ai_interaction_logs').insert({
    user_id: userId,
    bot_id: botId,
    query,
    injection_attempt: true,
    was_refused: true,
    retrieval_path: 'fallback',
    created_at: new Date().toISOString()
  }).then(({ error }) => {
    if (error) console.error('Failed to log injection attempt:', error);
  });
}