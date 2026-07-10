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

    if (!adminProfile || adminProfile.access_layer < 4) {
      return NextResponse.json({ error: 'Forbidden - Ketua Lingkungan atau admin only' }, { status: 403 });
    }

    const { userId, action } = await request.json();

    if (action === 'activate') {
      // Activate user (move from waiting room to Layer 2)
      const { data: targetUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!targetUser) {
        return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
      }

      // Update access_layer based on role
      let newLayer = 2; // default for umat
      if (['ketua_lingkungan', 'koordinator_stasi'].includes(targetUser.role)) newLayer = 4;
      else if (['sekretaris_lingkungan'].includes(targetUser.role)) newLayer = 4;
      else if (['bendahara_lingkungan'].includes(targetUser.role)) newLayer = 4;
      else if (['wali_digital'].includes(targetUser.role)) newLayer = 3;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          access_layer: newLayer,
        })
        .eq('id', userId);

      if (updateError) {
        return NextResponse.json({ error: 'Gagal mengaktifkan user' }, { status: 500 });
      }

      // Notification to user via Fonnte

      return NextResponse.json({
        success: true,
        message: `User berhasil diaktifkan dengan layer ${newLayer}`,
      });
    }

    return NextResponse.json({ error: 'Action tidak dikenali' }, { status: 400 });
  } catch (error) {
    console.error('Activate user error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}