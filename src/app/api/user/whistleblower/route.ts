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

    const { category, description, incident_date, location } = await request.json();

    // Create anonymous report
    const { data: report, error } = await supabase
      .from('whistleblower_reports')
      .insert({
        reporter_id: user.id, // Hidden in UI, stored for tracking
        category,
        description,
        incident_date,
        location,
        status: 'pending',
        tracking_code: generateTrackingCode(),
      })
      .select()
      .single();

    if (error) {
      console.error('Whistleblower report error:', error);
      return NextResponse.json({ error: 'Gagal mengirim laporan' }, { status: 500 });
    }

    // Send notification to admins via Fonnte (notification handled by caller)
    return NextResponse.json({
      success: true,
      tracking_code: report.tracking_code,
      message: 'Laporan berhasil dikirim. Simpan kode pelacakan Anda.',
    });
  } catch (error) {
    console.error('Whistleblower error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

function generateTrackingCode(): string {
  return 'WB-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}
