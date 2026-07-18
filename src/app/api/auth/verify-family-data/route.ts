export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendWhatsApp } from '@/lib/whatsapp/provider';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const body = await request.json();
    const { familyId, members } = body;

    if (!familyId || !Array.isArray(members)) {
      return NextResponse.json({ error: 'familyId dan members harus diisi' }, { status: 400 });
    }

    const invitations: { phone: string; success: boolean; error?: string }[] = [];

    for (const m of members) {
      const { id, full_name, phone, verified, send_invite } = m;

      if (id && phone !== undefined) {
        const { data: anggota } = await supabase
          .from('anggota_keluarga')
          .select('profile_id')
          .eq('id', id)
          .single();

        if (anggota?.profile_id) {
          await supabase
            .from('profiles')
            .update({ phone: phone || null, full_name: full_name || undefined })
            .eq('id', anggota.profile_id);
        }
      }

      if (send_invite && phone) {
        const cleaned = phone.replace(/\D/g, '');
        const target = cleaned.startsWith('0') ? '62' + cleaned.slice(1) : (cleaned.startsWith('62') ? cleaned : '62' + cleaned);
        const msg = `Yth. ${full_name || 'Keluarga'},\n\nAnda terdaftar di database Gereja Santo Klemens. Kami mengundang Anda bergabung ke ekosistem digital paroki agar lebih mudah menerima informasi dan kegiatan paroki.\n\nSilakan daftar di: ${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/register\n\nTerima kasih.`;
        const res = await sendWhatsApp(target, msg);
        invitations.push({ phone: target, success: res.success, error: res.error });
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_family_data_verified: true })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to set family verified:', updateError);
      return NextResponse.json({ error: 'Gagal menyimpan verifikasi keluarga' }, { status: 500 });
    }

    return NextResponse.json({ success: true, invitations });
  } catch (error) {
    console.error('Verify family data error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}