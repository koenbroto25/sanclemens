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

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('access_layer, role')
      .eq('id', user.id)
      .single();

    // Only Pastor (9), Wakil DPP (8), Komsos (5+), KL (4) can do morning check
    if (!adminProfile || adminProfile.access_layer < 4) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { lansia_id, check_type, notes, status } = await request.json();

    // Create morning check record
    const { data: check, error } = await supabase
      .from('lansia_checks')
      .insert({
        lansia_id,
        checker_id: user.id,
        check_type: check_type || 'morning_check',
        notes,
        status: status || 'ok',
        checked_at: new Date().toISOString(),
      })
      .single();

    if (error) {
      console.error('Morning check error:', error);
      return NextResponse.json({ error: 'Gagal menyimpan pemeriksaan' }, { status: 500 });
    }

    // If status is critical/alert, notify KL and DPP
    if (status === 'critical' || status === 'alert') {
      // Get lansia's profile
      const { data: lansiaProfile } = await supabase
        .from('profiles')
        .select('lingkungan_id')
        .eq('id', lansia_id)
        .single();

      if (lansiaProfile) {
        // Get KL for this lingkungan
        const { data: kl } = await supabase
          .from('profiles')
          .select('id, phone')
          .eq('lingkungan_id', lansiaProfile.lingkungan_id)
          .eq('role', 'ketua_lingkungan')
          .single();

        if (kl) {
          // WhatsApp notification to KL via Fonnte
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pemeriksaan berhasil disimpan',
      data: check,
    });
  } catch (error) {
    console.error('Morning check error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}