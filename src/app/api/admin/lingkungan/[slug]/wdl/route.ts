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

    const slug = request.nextUrl.pathname.split('/')[3];
    
    // Verify the admin is accessing their own lingkungan
    if (adminProfile.lingkungan_slug !== slug) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses ke lingkungan ini' }, { status: 403 });
    }

    const { action, payload } = await request.json();

    switch (action) {
      case 'assign': {
        const { wdl_id, lansia_ids } = payload;
        
        // Assign WDL to lansia (elderly users)
        const assignments = lansia_ids.map((lansiaId: string) => ({
          wali_digital_id: wdl_id,
          lansia_id: lansiaId,
          lingkungan_slug: slug,
          status: 'active',
        }));

        const { error } = await supabase
          .from('wdl_assignments')
          .insert(assignments);

        if (error) {
          console.error('WDL assign error:', error);
          return NextResponse.json({ error: 'Gagal menugaskan WDL' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'WDL berhasil ditugaskan' });
      }

      case 'remove': {
        const { wdl_id, lansia_id } = payload;
        
        const { error } = await supabase
          .from('wdl_assignments')
          .update({ status: 'inactive' })
          .eq('wali_digital_id', wdl_id)
          .eq('lansia_id', lansia_id);

        if (error) {
          console.error('WDL remove error:', error);
          return NextResponse.json({ error: 'Gagal menghapus penugasan WDL' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Penugasan WDL berhasil dihapus' });
      }

      default:
        return NextResponse.json({ error: 'Action tidak dikenali' }, { status: 400 });
    }
  } catch (error) {
    console.error('WDL error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}