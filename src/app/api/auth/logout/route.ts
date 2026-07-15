export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    await supabase.auth.signOut();

    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('.')[0].split('//')[1];
    const response = NextResponse.json({ success: true, message: 'Berhasil logout' });
    response.cookies.delete(`sb-${projectRef}-auth-token`);
    response.cookies.delete(`sb-${projectRef}-auth-token.0`);
    response.cookies.delete(`sb-${projectRef}-auth-token.1`);
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}