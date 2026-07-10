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

    // Check if user is super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('access_layer')
      .eq('id', user.id)
      .single();

    if (!profile || profile.access_layer < 9) {
      return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 });
    }

    const { action, target_user_id, bypass_type } = await request.json();

    if (action === 'enable_bypass') {
      // Set bypass cookies
      const response = NextResponse.json({
        success: true,
        message: 'Bypass mode enabled',
      });

      response.cookies.set('super_admin_bypass', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600, // 1 hour
      });

      response.cookies.set('super_admin_bypass_user_id', target_user_id || user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600,
      });

      // Log bypass activation
      await supabase.from('system_bypass_logs').insert({
        bypass_type: bypass_type || 'auth_bypass',
        target_identifier: target_user_id || user.id,
        action: 'enable_bypass_mode',
        performed_by: user.id,
        ip_address: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      });

      return response;
    }

    if (action === 'disable_bypass') {
      const response = NextResponse.json({
        success: true,
        message: 'Bypass mode disabled',
      });

      response.cookies.delete('super_admin_bypass');
      response.cookies.delete('super_admin_bypass_user_id');

      // Log bypass deactivation
      await supabase.from('system_bypass_logs').insert({
        bypass_type: bypass_type || 'auth_bypass',
        target_identifier: target_user_id || user.id,
        action: 'disable_bypass_mode',
        performed_by: user.id,
        ip_address: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      });

      return response;
    }

    if (action === 'impersonate') {
      if (!target_user_id) {
        return NextResponse.json({ error: 'target_user_id is required' }, { status: 400 });
      }

      const response = NextResponse.json({
        success: true,
        message: 'Impersonation mode enabled',
      });

      response.cookies.set('super_admin_bypass', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600,
      });

      response.cookies.set('super_admin_bypass_user_id', target_user_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600,
      });

      // Log impersonation
      await supabase.from('system_bypass_logs').insert({
        bypass_type: 'impersonation',
        target_identifier: target_user_id,
        action: 'impersonate',
        performed_by: user.id,
        ip_address: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Bypass API error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('access_layer')
      .eq('id', user.id)
      .single();

    if (!profile || profile.access_layer < 9) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const bypassEnabled = request.cookies.get('super_admin_bypass')?.value === 'true';
    const bypassUserId = request.cookies.get('super_admin_bypass_user_id')?.value;

    return NextResponse.json({
      bypassEnabled,
      currentUserId: bypassUserId || user.id,
      isDevelopment: process.env.NODE_ENV === 'development',
    });
  } catch (error) {
    console.error('Bypass GET error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}