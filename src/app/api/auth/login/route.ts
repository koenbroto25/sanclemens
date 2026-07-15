import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, username, password } = body;
    console.log('[LOGIN] Request body:', { phone: phone ? '***' + phone.slice(-4) : null, username, hasPassword: !!password });

    if (!password) {
      console.log('[LOGIN] Error: no password'); return NextResponse.json({ error: 'Kata sandi harus diisi' }, { status: 400 });
    }

    // Determine login method: phone OR username_wd
    let loginIdentifier: string;
    let queryField: 'phone' | 'username_wd';

    if (phone) {
      // Phone login
      let cleaned = phone.replace(/\D/g, '');
      if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.slice(1); // Removes leading '0'
      } else if (!cleaned.startsWith('62')) {
        cleaned = '62' + cleaned; // Adds '62' if not present and no leading '0'
      }
      loginIdentifier = `wa+${cleaned}@paroki.local`;
      queryField = 'phone';
    } else if (username) {
      // Wali Digital username login
      loginIdentifier = username;
      queryField = 'username_wd';
    } else {
      return NextResponse.json({ error: 'Nomor WhatsApp atau username harus diisi' }, { status: 400 });
    }

    const cookieStoreInit = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStoreInit.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStoreInit.set(name, value, options));
          },
        },
      }
    );

    // Use service role for profile lookup (bypasses RLS)
    const serviceClient = createServiceClient();
    // Find user profile
    const queryValue = queryField === 'phone' ? loginIdentifier.replace('wa+', '').replace('@paroki.local', '') : username;
    console.log('[LOGIN] Querying profiles:', { queryField, queryValue });
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('id, role, access_layer, status, lingkungan_slug, full_name, phone, username_wd, is_wali_digital, wali_digital_id')
      .eq(queryField, queryField === 'phone' ? loginIdentifier.replace('wa+', '').replace('@paroki.local', '') : username)
      .single();

    if (!profile) {
      return NextResponse.json({ 
        error: queryField === 'phone' ? 'Nomor WhatsApp belum terdaftar' : 'Username tidak ditemukan' 
      }, { status: 404 });
    }

    // Check user status
    if (profile.status !== 'active') {
      return NextResponse.json({ 
        error: 'Akun Anda belum aktif. Silakan tunggu verifikasi dari Ketua Lingkungan.' 
      }, { status: 403 });
    }

    // Attempt login with Supabase Auth
    // For wali_digital users, we use username_wd@keluarga.paroki or username_wd@paroki.local
    let authEmail: string;
    if (queryField === 'username_wd') {
      // For wali digital login, use a special email format
      authEmail = `${username}@keluarga.paroki.local`;
    } else {
      authEmail = `wa+${profile.phone}@paroki.local`;
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: password,
    });

    if (signInError || !signInData?.session) {
      console.error('Login failed:', signInError);
      console.log('[LOGIN] Error: wrong password'); return NextResponse.json({ error: 'Kata sandi salah' }, { status: 401 });
    }

    // Set auth cookies directly in response for middleware compatibility
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('.')[0].split('//')[1];
    const authCookieName = `sb-${projectRef}-auth-token`;
    const sessionPayload = JSON.stringify({
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      expires_in: signInData.session.expires_in,
      expires_at: signInData.session.expires_at,
      token_type: signInData.session.token_type,
      user: signInData.session.user,
    });

    // Determine redirect based on role
    let redirect = '/user/dashboard';
    if (profile.role === 'super_admin') {
      redirect = '/super-admin/dashboard';
    } else if (profile.role === 'pastor') {
      redirect = '/admin/pastor/dashboard';
    } else if (['ketua_lingkungan', 'sekretaris_lingkungan', 'bendahara_lingkungan'].includes(profile.role)) {
      redirect = profile.lingkungan_slug ? `/admin/lingkungan/${profile.lingkungan_slug}/dashboard` : '/user/dashboard';
    } else if (['bendahara_dpp', 'admin_paroki'].includes(profile.role)) {
      redirect = '/admin/paroki/dashboard';
    } else if (profile.role === 'umat' && profile.is_wali_digital) {
      redirect = '/dashboard/wali-digital';
    } else if (profile.role === 'seller') {
      redirect = '/marketplace/seller/dashboard';
    } else if (profile.role === 'ojek_solidaritas') {
      redirect = '/marketplace/ojek-solidaritas/dashboard';
    } else if (profile.role === 'buyer') {
      redirect = '/marketplace';
    }

    console.log('[LOGIN] Success, redirect:', redirect);
    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: {
        id: profile.id,
        full_name: profile.full_name,
        role: profile.role,
        access_layer: profile.access_layer,
        status: profile.status,
        lingkungan_slug: profile.lingkungan_slug,
        is_wali_digital: profile.is_wali_digital,
        wali_digital_id: profile.wali_digital_id,
        username_wd: profile.username_wd,
      },
      redirect,
    });
    response.cookies.set(authCookieName, sessionPayload, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
    } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}