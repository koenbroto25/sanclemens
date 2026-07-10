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

    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Pesan harus diisi' }, { status: 400 });
    }

    // Get user profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // TODO: Call AI Companion Bot (Bot 3) with user context
    // This should integrate with the AI system defined in docs/ai_specifications/
    // For now, return a placeholder response
    
    const response = {
      reply: `[AI Companion Response] Terima kasih telah menghubungi Companion Rohani. Fitur ini sedang dalam pengembangan.`,
      context_used: {
        user_name: profile?.full_name,
        user_role: profile?.role,
        user_lingkungan: profile?.lingkungan_slug,
      },
    };

    // Optional: Save conversation to database
    // await supabase.from('companion_conversations').insert({...});

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Companion error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}