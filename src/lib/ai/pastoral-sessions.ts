/**
 * Pastoral Sessions Management untuk Bot 3 (Companion Rohani)
 * Provides persistent memory across sessions
 * Replaces deprecated ai_user_profiles.ai_pastoral_summary
 */

import { createClient } from '@/lib/supabase/server';

export interface PastoralSessionData {
  last_session_date: string;
  key_themes: string[];
  prayer_requests: string[];
  faith_journey_stage: string;
  language_preference: string;
  total_sessions: number;
  last_turn_count: number;
}

/**
 * Get or create pastoral session for user
 */
export async function getPastoralSession(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<PastoralSessionData | null> {
  try {
    const { data, error } = await supabase
      .from('pastoral_sessions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      last_session_date: data.last_session_date || '',
      key_themes: data.key_themes || [],
      prayer_requests: data.prayer_requests || [],
      faith_journey_stage: data.faith_journey_stage || 'baru baptis',
      language_preference: data.language_preference || 'formal',
      total_sessions: data.total_sessions || 0,
      last_turn_count: data.last_turn_count || 0
    };
  } catch (error) {
    console.error('Error getting pastoral session:', error);
    return null;
  }
}

/**
 * Update pastoral session after conversation ends
 * Should be called when user disconnects or after 30 minutes idle
 */
export async function updatePastoralSession(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  updates: Partial<PastoralSessionData>
): Promise<void> {
  try {
    // Get existing session to merge
    const existing = await getPastoralSession(supabase, userId);

    const mergedData: PastoralSessionData = {
      last_session_date: new Date().toISOString(),
      key_themes: updates.key_themes || existing?.key_themes || [],
      prayer_requests: updates.prayer_requests || existing?.prayer_requests || [],
      faith_journey_stage: updates.faith_journey_stage || existing?.faith_journey_stage || 'baru baptis',
      language_preference: updates.language_preference || existing?.language_preference || 'formal',
      total_sessions: (existing?.total_sessions || 0) + 1,
      last_turn_count: updates.last_turn_count || existing?.last_turn_count || 0
    };

    // Upsert session
    await supabase
      .from('pastoral_sessions')
      .upsert({
        user_id: userId,
        last_session_date: mergedData.last_session_date,
        key_themes: mergedData.key_themes.slice(-10), // Keep last 10 themes
        prayer_requests: mergedData.prayer_requests.slice(-10), // Keep last 10 prayer requests
        faith_journey_stage: mergedData.faith_journey_stage,
        language_preference: mergedData.language_preference,
        total_sessions: mergedData.total_sessions,
        last_turn_count: mergedData.last_turn_count,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

  } catch (error) {
    console.error('Error updating pastoral session:', error);
  }
}

/**
 * Add theme to pastoral session
 */
export async function addPastoralTheme(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  theme: string
): Promise<void> {
  const session = await getPastoralSession(supabase, userId);

  if (!session) {
    // Create new session with this theme
    await updatePastoralSession(supabase, userId, {
      key_themes: [theme]
    });
    return;
  }

  // Add theme if not already present
  const currentThemes = session.key_themes;
  if (!currentThemes.includes(theme)) {
    const updatedThemes = [...currentThemes, theme].slice(-10); // Keep last 10
    await updatePastoralSession(supabase, userId, {
      key_themes: updatedThemes
    });
  }
}

/**
 * Add prayer request to pastoral session
 */
export async function addPrayerRequest(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  prayerRequest: string
): Promise<void> {
  const session = await getPastoralSession(supabase, userId);

  if (!session) {
    // Create new session with this prayer request
    await updatePastoralSession(supabase, userId, {
      prayer_requests: [prayerRequest]
    });
    return;
  }

  // Add prayer request if not already present
  const currentRequests = session.prayer_requests;
  if (!currentRequests.includes(prayerRequest)) {
    const updatedRequests = [...currentRequests, prayerRequest].slice(-10); // Keep last 10
    await updatePastoralSession(supabase, userId, {
      prayer_requests: updatedRequests
    });
  }
}

/**
 * Update faith journey stage
 */
export async function updateFaithJourneyStage(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  stage: string
): Promise<void> {
  await updatePastoralSession(supabase, userId, {
    faith_journey_stage: stage
  });
}

/**
 * Detect language preference from message
 */
export function detectLanguagePreference(message: string): 'formal' | 'informal' {
  const informalMarkers = [
    /\b(gmn|gimana|kayak|kyk|gak|nggak|udah|udh|blm|belum|mau|mo|aja|aj|dong|deh|sih|banget|bgt)\b/i,
    /\b(bro|sis|gan|kak|mas|mbak)\b/i,
    /[a-z]{1,3}\s+(yg|yng)/i
  ];

  const isInformal = informalMarkers.some(pattern => pattern.test(message));
  return isInformal ? 'informal' : 'formal';
}

/**
 * Format pastoral session as context for LLM prompt
 */
export function formatPastoralSessionContext(session: PastoralSessionData | null): string {
  if (!session) {
    return 'Ini adalah percakapan pertama dengan umat ini.';
  }

  const themesList = session.key_themes.length > 0
    ? session.key_themes.join(', ')
    : 'belum ada tema utama';

  const prayersList = session.prayer_requests.length > 0
    ? session.prayer_requests.join(', ')
    : 'belum ada permintaan doa';

  return `Konteks pastoral dari percakapan sebelumnya dengan umat ini:
- Tema utama yang sering dibahas: ${themesList}
- Permintaan doa: ${prayersList}
- Tahap perjalanan iman: ${session.faith_journey_stage}
- Preferensi bahasa: ${session.language_preference}
- Total sesi: ${session.total_sessions}`;
}

/**
 * Check if cooldown suggestion should be shown
 */
export function shouldShowCooldown(
  currentTurn: number,
  maxTurns: number,
  cooldownAtTurn: number | null
): boolean {
  if (cooldownAtTurn === null) {
    return false;
  }
  return currentTurn >= cooldownAtTurn;
}

/**
 * Generate cooldown suggestion message
 */
export function getCooldownMessage(botName: string): string {
  return `Kita sudah berbincang cukup panjang hari ini. Saya senang dapat menemani Anda.
Ingatlah bahwa berbicara langsung dengan Pastor atau sahabat terpercaya juga
sangat berharga untuk perjalanan iman Anda. Tuhan memberkati.`;
}