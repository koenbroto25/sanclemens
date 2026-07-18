export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notification_preferences, language, timezone } = await request.json();

    const updateData: Record<string, unknown> = {};
    if (notification_preferences !== undefined) updateData.notification_preferences = notification_preferences;
    if (language !== undefined) updateData.preferred_language = language;
    if (timezone !== undefined) updateData.timezone = timezone;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada preferensi yang diupdate' }, { status: 400 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select('notification_preferences, preferred_language, timezone')
      .single();

    if (error) {
      console.error('Update preferences error:', error);
      return NextResponse.json({ error: 'Gagal memperbarui preferensi' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Preferensi berhasil diperbarui',
      data: profile,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}