export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's family by checking if user is the head
    const { data: family, error: familyError } = await supabase
      .from('keluarga')
      .select(`
        *,
        anggota_keluarga(
          id,
          hubungan_keluarga,
          urutan_anak,
          status_perkawinan_dalam_keluarga,
          profiles(
            id,
            full_name,
            nama_baptis,
            phone,
            email,
            is_wali_digital,
            username_wd
          )
        )
      `)
      .eq('kepala_keluarga_id', user.id)
      .single();

    if (familyError && familyError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching family as head:', familyError);
      return NextResponse.json({ error: 'Gagal mengambil data keluarga sebagai kepala keluarga' }, { status: 500 });
    }

    // If user is not the head, check if they are a member of a family
    if (!family) {
      const { data: membership, error: membershipError } = await supabase
        .from('anggota_keluarga')
        .select(`
          keluarga_id,
          keluarga(
            *,
            anggota_keluarga(
              id,
              hubungan_keluarga,
              urutan_anak,
              status_perkawinan_dalam_keluarga,
              profiles(
                id,
                full_name,
                nama_baptis,
                phone,
                email,
                is_wali_digital,
                username_wd
              )
            )
          )
        `)
        .eq('profile_id', user.id)
        .single();

      if (membershipError && membershipError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching family as member:', membershipError);
        return NextResponse.json({ error: 'Gagal mengambil data keluarga sebagai anggota' }, { status: 500 });
      }

      if (membership) {
        return NextResponse.json({ success: true, family: membership.keluarga });
      }
    }

    return NextResponse.json({ success: true, family: family || null });
  } catch (error) {
    console.error('Get family error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, payload } = await request.json();

    switch (action) {
      case 'invite': {
        const { phone, family_id } = payload;
        
        // Create invitation
        const { data: invite, error: inviteError } = await supabase
          .from('family_invitations')
          .insert({
            family_id,
            invited_by: user.id,
            invitee_phone: phone,
            invite_code: generateInviteCode(),
          })
          .single();

        if (inviteError) {
          return NextResponse.json({ error: 'Gagal mengirim undangan' }, { status: 500 });
        }

        // WhatsApp invitation via Fonnte
        return NextResponse.json({ success: true, invite });
      }

      case 'connect': {
        const { invite_code } = payload;
        
        // Find invitation
        const { data: invite, error: inviteError } = await supabase
          .from('family_invitations')
          .select('*')
          .eq('invite_code', invite_code)
          .eq('status', 'pending')
          .single();

        if (inviteError || !invite) {
          return NextResponse.json({ error: 'Kode undangan tidak valid' }, { status: 404 });
        }

        // Check expiry
        if (new Date(invite.expires_at) < new Date()) {
          return NextResponse.json({ error: 'Kode undangan sudah expired' }, { status: 400 });
        }

        // Add user to family
        const { error: memberError } = await supabase
          .from('anggota_keluarga')
          .insert({
            keluarga_id: invite.family_id,
            profile_id: user.id,
            hubungan_keluarga: 'anggota'
          });

        if (memberError) {
          return NextResponse.json({ error: 'Gagal bergabung dengan keluarga' }, { status: 500 });
        }

        // Update invitation status
        await supabase
          .from('family_invitations')
          .update({ status: 'accepted' })
          .eq('id', invite.id);

        return NextResponse.json({ success: true, message: 'Berhasil bergabung dengan keluarga' });
      }

      default:
        return NextResponse.json({ error: 'Action tidak dikenali' }, { status: 400 });
    }
  } catch (error) {
    console.error('Family action error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}