import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateSession } from './lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Bypass system for Super Admin debugging (only in development)
  const isDevelopment = process.env.NODE_ENV === 'development';
  const bypassCookie = request.cookies.get('super_admin_bypass')?.value === 'true';
  const isSuperAdminBypass = isDevelopment && bypassCookie;

  // First, update session to get user info
  const supabaseResponse = await updateSession(request);

  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    // If bypass is active and user is accessing as super admin, skip normal auth checks
    const bypassUserIdCookie = request.cookies.get('super_admin_bypass_user_id')?.value;
    if (isSuperAdminBypass && bypassUserIdCookie) {
      // Log bypass usage
      await logBypassUsage('auth_bypass', bypassUserIdCookie, 'impersonate', request);
      
      // Continue with bypass session
      return supabaseResponse;
    }

    // Log bypass usage if enabled
    if (isSuperAdminBypass && user) {
      await logBypassUsage('auth_bypass', user.id, 'enable_bypass_mode', request);
    }

    return supabaseResponse;
  } catch (error) {
    console.error('Middleware error:', error);
    return supabaseResponse;
  }
}

// Helper function to log bypass usage
async function logBypassUsage(
  bypassType: string,
  targetIdentifier: string,
  action: string,
  request: NextRequest
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from('system_bypass_logs').insert({
      bypass_type: bypassType,
      target_identifier: targetIdentifier,
      action: action,
      performed_by: user.id,
      ip_address: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    });
  } catch (error) {
    console.error('Error logging bypass usage:', error);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - api/super-admin/bypass (bypass API itself)
     * - public folder
     */
    '/((?!_next/static|_next/image|api/super-admin/bypass|public|.*\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2|woff|ttf|eot)).*)',
  ],
};
