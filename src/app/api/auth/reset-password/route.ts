export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { phone, otp, newPassword } = await request.json();

    if (!phone || !otp || !newPassword) {
      return NextResponse.json({ error: 'Nomor WhatsApp, OTP, dan kata sandi baru harus diisi' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Kata sandi minimal 8 karakter' }, { status: 400 });
    }

    // Normalize phone
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }

    const supabase = createClient();

    // Find valid OTP for reset_password type
    const { data: otpRecords } = await supabase
      .from('auth_otps')
      .select('*')
      .eq('phone', cleaned)
      .eq('type', 'reset_password')
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    // Check attempts and OTP match
    const validRecord = otpRecords?.find(record => record.attempts < 3 && record.otp_code === otp);

    if (!validRecord) {
      // Increment attempts for the latest OTP if exists
      const latestOtp = otpRecords?.[0];
      if (latestOtp) {
        await supabase
          .from('auth_otps')
          .update({ attempts: latestOtp.attempts + 1 })
          .eq('phone', cleaned)
          .eq('otp_code', latestOtp.otp_code);
      }

      return NextResponse.json({ error: 'OTP tidak valid, sudah kadaluarsa, atau terlalu banyak percobaan' }, { status: 401 });
    }

    // Mark OTP as used
    await supabase
      .from('auth_otps')
      .update({ is_used: true })
      .eq('phone', cleaned)
      .eq('otp_code', validRecord.otp_code);

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('phone', cleaned)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profil pengguna tidak ditemukan' }, { status: 404 });
    }

    // Update password in Supabase Auth
    const loginEmail = `wa+${cleaned}@paroki.local`;
    
    // Find auth user by email
    const { data: existingAuthList } = await supabase.auth.admin.listUsers();
    const existingAuthUser = existingAuthList?.users?.find((u) => u.email === loginEmail);

    if (!existingAuthUser) {
      return NextResponse.json({ error: 'Akun autentikasi tidak ditemukan' }, { status: 404 });
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(existingAuthUser.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return NextResponse.json({ error: 'Gagal memperbarui kata sandi' }, { status: 500 });
    }

    // Optional: Invalidate all existing sessions except current one
    // By updating the password, Supabase will invalidate all sessions

    return NextResponse.json({ 
      success: true, 
      message: 'Kata sandi berhasil diubah',
      user: {
        id: profile.id,
        full_name: profile.full_name,
        phone: cleaned
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}