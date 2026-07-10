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

    // Get admin profile
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('access_layer, role')
      .eq('id', user.id)
      .single();

    if (!adminProfile || adminProfile.access_layer < 9) {
      return NextResponse.json({ error: 'Forbidden - Pastor only' }, { status: 403 });
    }

    const { recipient_ids, subject, content, is_encrypted } = await request.json();

    if (!recipient_ids || !content) {
      return NextResponse.json({ error: 'Penerima dan konten harus diisi' }, { status: 400 });
    }

    // Create pastoral letter
    const { data: letter, error } = await supabase
      .from('pastoral_letters')
      .insert({
        sender_id: user.id,
        subject,
        content,
        is_encrypted: is_encrypted || false,
        status: 'sent',
      })
      .select()
      .single();

    if (error) {
      console.error('Create letter error:', error);
      return NextResponse.json({ error: 'Gagal membuat surat' }, { status: 500 });
    }

    // Link recipients
    const recipientRecords = recipient_ids.map((recipientId: string) => ({
      letter_id: letter.id,
      recipient_id: recipientId,
      read: false,
    }));

    await supabase.from('pastoral_letter_recipients').insert(recipientRecords);

    // Notifications to recipients via Fonnte

    return NextResponse.json({
      success: true,
      message: 'Surat pastoral berhasil dikirim',
      data: letter,
    });
  } catch (error) {
    console.error('Surat pastoral error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
