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

    const { openrouter_key, gemini_key } = await request.json();

    // Store API keys securely (encrypted at rest via Supabase)
    const updateData: Record<string, string | null> = {};
    if (openrouter_key !== undefined) updateData.openrouter_api_key = openrouter_key;
    if (gemini_key !== undefined) updateData.gemini_api_key = gemini_key;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada API key yang diupdate' }, { status: 400 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select('openrouter_api_key, gemini_api_key')
      .single();

    if (error) {
      console.error('Update API keys error:', error);
      return NextResponse.json({ error: 'Gagal memperbarui API keys' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'API keys berhasil diperbarui',
      data: {
        openrouter_key: profile?.openrouter_api_key ? '***' : null,
        gemini_key: profile?.gemini_api_key ? '***' : null,
      },
    });
  } catch (error) {
    console.error('Update API keys error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}