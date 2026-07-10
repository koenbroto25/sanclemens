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

    if (!adminProfile || adminProfile.access_layer < 5) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { gakin_id, action, catatan } = await request.json();

    if (action === 'approve' || action === 'reject') {
      const approved = action === 'approve';
      
      // Create or update approval record
      const { error } = await supabase
        .from('gakin_approvals')
        .upsert({
          gakin_id,
          approver_id: user.id,
          role_saat_approve: adminProfile.role,
          approved,
          catatan,
          approved_at: approved ? new Date().toISOString() : undefined,
        }, {
          onConflict: 'gakin_id,approver_id'
        });

      if (error) {
        console.error('GAKIN approval error:', error);
        return NextResponse.json({ error: 'Gagal menyimpan persetujuan' }, { status: 500 });
      }

      // Check if approval count reached 3
      const { data: approvals } = await supabase
        .from('gakin_approvals')
        .select('approved')
        .eq('gakin_id', gakin_id)
        .eq('approved', true);

      const approvalCount = approvals?.length || 0;

      if (approvalCount >= 3) {
        // Update GAKIN status to active
        await supabase
          .from('data_gakin')
          .update({ status: 'active' })
          .eq('id', gakin_id);
      } else if (approvalCount === 0 && !approved) {
        // If all 4 possible approvers have voted and none approved
        // Check total possible approvers
        const totalPossible = 4; // Pastor + Wakil DPP + Komsos + KL
        const { data: allApprovals } = await supabase
          .from('gakin_approvals')
          .select('approved')
          .eq('gakin_id', gakin_id);
        
        if (allApprovals?.length === totalPossible) {
          await supabase
            .from('data_gakin')
            .update({ status: 'rejected' })
            .eq('id', gakin_id);
        }
      }

      return NextResponse.json({
        success: true,
        message: approved ? 'GAKIN disetujui' : 'GAKIN ditolak',
        approval_count: approvalCount,
      });
    }

    return NextResponse.json({ error: 'Action tidak dikenali' }, { status: 400 });
  } catch (error) {
    console.error('GAKIN approval error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}