export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    const supabase = createClient();
    
    // Get super admin credentials from database
    const { data: credentials, error: credError } = await supabase
      .from('super_admin_credentials')
      .select('*')
      .limit(1)
      .single();
    
    if (credError || !credentials) {
      console.error('Error fetching super admin credentials:', credError);
      return NextResponse.json({ error: 'Autentikasi super admin tidak dikonfigurasi' }, { status: 500 });
    }

    // Verify password using bcrypt (stored as hash in database)
    const passwordMatch = await bcrypt.compare(password, credentials.password_hash);
    
    if (!passwordMatch) {
      // Log failed attempt
      await supabase.from('super_admin_logs').insert({
        admin_id: null,
        action: 'login_failed',
        ip_address: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      });
      
      return NextResponse.json({ error: 'Password salah' }, { status: 401 });
    }

    // Log successful login
    await supabase.from('super_admin_logs').insert({
      admin_id: null, // Will be set by trigger or can be user_id if authenticated via session
      action: 'login_success',
      ip_address: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
    });

    // Create super admin session
    const response = NextResponse.json({
      success: true,
      message: 'Login Super Admin berhasil',
    });

    // Set super admin cookie
    response.cookies.set('super_admin_auth', 'true', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error) {
    console.error('Super admin login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
