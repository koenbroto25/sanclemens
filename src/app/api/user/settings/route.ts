export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Encryption utilities
const ALGORITHM = 'aes-256-cbc';
const KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default_key_change_this', 'salt', 32);

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  return iv.toString('hex') + ':' + cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  return decipher.update(parts[1], 'hex', 'utf8') + decipher.final('utf8');
}

export async function GET() {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    const { data: settings, error: settingsError } = await supabase
      .from('user_ai_settings')
      .select('*')
      .eq('user_id', profile.id)
      .single();
    
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
    
    // If no settings exist, return defaults
    if (!settings) {
      return NextResponse.json({ 
        data: {
          ai_companion_enabled: true,
          ai_matching_enabled: true,
          ai_personalization_level: 'moderate',
          show_business_to_others: true,
          show_skills_to_others: true,
          allow_charity_matching: true,
          show_location_for_matching: false,
          notify_job_matches: true,
          notify_charity_requests: true,
          notify_sos_alerts: true,
          has_api_keys: false
        }
      });
    }
    
    // Mask API keys (only show last 4 chars)
    const maskedSettings = {
      ...settings,
      openrouter_api_key: settings.openrouter_api_key 
        ? '...' + decrypt(settings.openrouter_api_key).slice(-4)
        : null,
      gemini_api_key: settings.gemini_api_key
        ? '...' + decrypt(settings.gemini_api_key).slice(-4)
        : null,
      has_api_keys: !!(settings.openrouter_api_key || settings.gemini_api_key)
    };
    
    return NextResponse.json({ data: maskedSettings });
    
  } catch (error) {
    console.error('Error in GET /api/user/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    const body = await request.json();
    const { 
      ai_companion_enabled,
      ai_matching_enabled,
      ai_personalization_level,
      show_business_to_others,
      show_skills_to_others,
      allow_charity_matching,
      show_location_for_matching,
      notify_job_matches,
      notify_charity_requests,
      notify_sos_alerts
    } = body;
    
    // Upsert settings
    const { data: updatedSettings, error: updateError } = await supabase
      .from('user_ai_settings')
      .upsert({
        user_id: profile.id,
        ai_companion_enabled,
        ai_matching_enabled,
        ai_personalization_level,
        show_business_to_others,
        show_skills_to_others,
        allow_charity_matching,
        show_location_for_matching,
        notify_job_matches,
        notify_charity_requests,
        notify_sos_alerts,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating settings:', updateError);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
    
    return NextResponse.json({ data: updatedSettings });
    
  } catch (error) {
    console.error('Error in PUT /api/user/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    const body = await request.json();
    const { openrouter_api_key, gemini_api_key, is_using_own_api } = body;
    
    // Encrypt API keys before storing
    const encryptedOpenRouter = openrouter_api_key ? encrypt(openrouter_api_key) : null;
    const encryptedGemini = gemini_api_key ? encrypt(gemini_api_key) : null;
    
    // Upsert settings
    const { data: updatedSettings, error: updateError } = await supabase
      .from('user_ai_settings')
      .upsert({
        user_id: profile.id,
        openrouter_api_key: encryptedOpenRouter,
        gemini_api_key: encryptedGemini,
        is_using_own_api: is_using_own_api || false,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating API keys:', updateError);
      return NextResponse.json({ error: 'Failed to update API keys' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      data: {
        success: true,
        has_openrouter: !!encryptedOpenRouter,
        has_gemini: !!encryptedGemini
      }
    });
    
  } catch (error) {
    console.error('Error in POST /api/user/settings/api-keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}