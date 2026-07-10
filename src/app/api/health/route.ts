export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check database connection
    const { error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    const dbStatus = error ? 'disconnected' : 'connected';

    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      version: 'v5.0',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    }, { status: 503 });
  }
}