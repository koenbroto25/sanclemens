export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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
    
    const body = await request.json();
    const { jenis_sos, kondisi, latitude, longitude } = body;
    
    // ============================================
    // SOS ANTI-ABUSE CHECK
    // ============================================
    
    // 1. Ambil atau buat tracker
    const { data: tracker } = await supabase
      .from('sos_abuse_tracker')
      .select('*')
      .eq('user_id', profile.id)
      .single();
    
    // 2. Cek restriction level
    if (tracker?.restriction_level >= 3 && tracker?.restriction_until) {
      const restrictionUntil = new Date(tracker.restriction_until);
      if (restrictionUntil > new Date()) {
        // BLOCKED
        return NextResponse.json({
          blocked: true,
          message: 'Akun Anda telah dibatasi. Hubungi Pastor atau Ketua Lingkungan untuk pemulihan akses SOS.',
          level: 3
        }, { status: 403 });
      }
    }
    
    // 3. Update counter
    const { data: updatedTracker, error: updateError } = await supabase
      .from('sos_abuse_tracker')
      .upsert({
        user_id: profile.id,
        trigger_count_30d: (tracker?.trigger_count_30d || 0) + 1,
        last_trigger_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating SOS tracker:', updateError);
    }
    
    // 4. Hitung trigger dalam 24h, 7d, 30d
    const { count: count24h } = await supabase
      .from('sos_abuse_tracker')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .gte('last_trigger_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    const { count: count7d } = await supabase
      .from('sos_abuse_tracker')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .gte('last_trigger_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    const monthCount = (updatedTracker?.trigger_count_30d || 1);
    
    // 5. Tentukan level
    let currentLevel = 0;
    let cooldownDelay = 0;
    
    if (monthCount >= 6) {
      currentLevel = 3; // Blocked
    } else if ((count7d ?? 0) >= 4 || (count24h ?? 0) >= 3) {
      currentLevel = 2; // Cooldown
      cooldownDelay = 10000; // 10 detik
    } else if ((count24h ?? 0) >= 2) {
      currentLevel = 1; // Warning
    }
    
    // Update restriction level jika naik
    if (currentLevel > (tracker?.restriction_level || 0)) {
      await supabase
        .from('sos_abuse_tracker')
        .update({
          restriction_level: currentLevel,
          restriction_until: new Date(Date.now() + getDurationByLevel(currentLevel)).toISOString(),
          restriction_reason: getRestrictionReason(currentLevel, count24h ?? 0, count7d ?? 0, monthCount)
        })
        .eq('user_id', profile.id);
    }
    
    // ============================================
    // PROSES SOS
    // ============================================
    
    // Log SOS trigger
    const { data: sosLog, error: sosError } = await supabase
      .from('sos_logs')
      .insert({
        user_id: profile.id,
        jenis_sos,
        kondisi,
        latitude,
        longitude,
        abuse_level: currentLevel
      })
      .select()
      .single();
    
    if (sosError) {
      console.error('Error logging SOS:', sosError);
    }
    
    // ============================================
    // RESPONSE
    // ============================================
    
    const response: any = {
      success: true,
      abuse_level: currentLevel,
      sos_id: sosLog?.id
    };
    
    if (currentLevel >= 2) {
      response.message = currentLevel === 2
        ? 'Pesan Anda akan dikirim dalam 10 detik. Harap pastikan ini darurat.'
        : 'Akun Anda saat ini dibatasi.';
      response.cooldown_delay = cooldownDelay;
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error in POST /api/sos/trigger:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getDurationByLevel(level: number): number {
  switch (level) {
    case 1: return 24 * 60 * 60 * 1000; // 24 hours
    case 2: return 72 * 60 * 60 * 1000; // 72 hours
    case 3: return 30 * 24 * 60 * 60 * 1000; // 30 days
    default: return 0;
  }
}

function getRestrictionReason(level: number, count24h: number, count7d: number, count30d: number): string {
  switch (level) {
    case 1: return `${count24h}x trigger dalam 24 jam`;
    case 2: return `${count7d}x dalam 7 hari atau ${count24h}x dalam 24 jam`;
    case 3: return `${count30d}x trigger dalam 30 hari (batas: 6)`;
    default: return '';
  }
}