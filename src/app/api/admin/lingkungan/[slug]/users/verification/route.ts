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
      .select('access_layer, role, lingkungan_slug')
      .eq('id', user.id)
      .single();

    if (!adminProfile || adminProfile.access_layer < 4) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const slug = request.nextUrl.pathname.split('/')[3]; // Extract [slug] from path
    
    // Verify the admin is accessing their own lingkungan
    if (adminProfile.lingkungan_slug !== slug) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses ke lingkungan ini' }, { status: 403 });
    }

    const { userId, action } = await request.json();

    if (action === 'approve' || action === 'reject') {
      const newStatus = action === 'approve' ? 'active' : 'rejected';
      
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) {
        console.error('User verification error:', error);
        return NextResponse.json({ error: 'Gagal memverifikasi user' }, { status: 500 });
      }

      // WhatsApp notification to user via Fonnte
      return NextResponse.json({
        success: true,
        message: `User berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}`,
      });
    }

    return NextResponse.json({ error: 'Action tidak dikenali' }, { status: 400 });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}