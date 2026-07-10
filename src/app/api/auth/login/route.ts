export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { phone, username, password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Kata sandi harus diisi' }, { status: 400 });
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

    const supabase = createClient();

    // Find user profile
    const { data: profile } = await supabase
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
      return NextResponse.json({ error: 'Kata sandi salah' }, { status: 401 });
    }

    // Set cookies
    const cookieStore = cookies();
    cookieStore.set('sb-access-token', signInData.session.access_token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    cookieStore.set('sb-refresh-token', signInData.session.refresh_token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    // Determine redirect based on role and wali_digital status
    let redirect = '/gate-hub';
    
    // Wali digital gets special dashboard
    if (profile.role === 'umat' && profile.is_wali_digital) {
      redirect = '/dashboard/wali-digital';
    } else if (profile.role === 'super_admin') {
      redirect = '/admin-dashboard';
    } else if (profile.role === 'pastor') {
      redirect = '/pastor-dashboard';
    } else if (profile.role === 'ketua_lingkungan' || profile.role === 'bendahara_lingkungan') {
      redirect = '/dashboard/lingkungan';
    }

    return NextResponse.json({
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
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}