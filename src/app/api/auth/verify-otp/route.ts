export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Nomor WhatsApp dan OTP harus diisi' }, { status: 400 });
    }

    // Normalize phone
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }

    const supabase = createServiceClient();

    // Find valid OTP
    const { data: otpRecords } = await supabase
      .from('auth_otps')
      .select('*')
      .eq('phone', cleaned)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    // Check attempts
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

      return NextResponse.json({ error: 'OTP tidak valid atau sudah kadaluarsa' }, { status: 401 });
    }

    // Mark OTP as used
    await supabase
      .from('auth_otps')
      .update({ is_used: true })
      .eq('phone', cleaned)
      .eq('otp_code', validRecord.otp_code);

    // Find or create user in profiles
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', cleaned)
      .single();

    let userId: string;

    // If OTP has registration metadata, create auth user first, then profile
    const registrationMeta = validRecord.metadata as { fullName?: string; password?: string; baptismDate?: string; noKkGereja?: string; familyId?: string } | undefined;

    if (!profile) {
      if (registrationMeta) {
        // Registration flow: create or reuse auth user, then profile with its id
        const loginEmail = `wa+${cleaned}@paroki.local`;
        const internalPassword = `${cleaned}-${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 16)}`;
        const passwordToUse = registrationMeta.password || internalPassword;

        // Cek apakah auth user sudah ada
        const { data: existingAuthList } = await supabase.auth.admin.listUsers();
        const existingAuthUser = existingAuthList?.users?.find((u) => u.email === loginEmail || u.phone === cleaned);

        let authData;
        if (existingAuthUser) {
          // Reuse dan update password
          const { error: updateError } = await supabase.auth.admin.updateUserById(existingAuthUser.id, {
            password: passwordToUse,
            email_confirm: true,
            user_metadata: { phone: cleaned },
          });
          if (updateError) {
            console.error('Failed to update existing auth user password:', updateError);
          }
          authData = { user: existingAuthUser };
        } else {
          const { data: created, error: authError } = await supabase.auth.admin.createUser({
            phone: cleaned,
            email: loginEmail,
            password: passwordToUse,
            email_confirm: true,
            user_metadata: { phone: cleaned },
          });
          if (authError || !created?.user) {
            console.error('Failed to create auth user during registration:', authError);
            return NextResponse.json({ error: 'Gagal membuat akun otentikasi' }, { status: 500 });
          }
          authData = created;
        }

        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            phone: cleaned,
            full_name: registrationMeta.fullName || `Umat ${cleaned.slice(-4)}`,
            role: 'umat',
            access_layer: 2,
            status: 'active',
          })
          .select('id')
          .single();

        if (profileError || !newProfile) {
          console.error('Failed to create profile during registration:', profileError);
          // Rollback auth user
          await supabase.auth.admin.deleteUser(authData.user.id);
          return NextResponse.json({ error: 'Gagal membuat akun' }, { status: 500 });
        }

        userId = newProfile.id;
      } else {
        // Login flow without pre-registration: create minimal profile
        const loginEmail = `wa+${cleaned}@paroki.local`;
        const internalPassword = `${cleaned}-${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 16)}`;

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          phone: cleaned,
          email: loginEmail,
          password: internalPassword,
          email_confirm: true,
          user_metadata: { phone: cleaned },
        });

        if (authError || !authData?.user) {
          console.error('Failed to create auth user:', authError);
          return NextResponse.json({ error: 'Gagal membuat akun otentikasi' }, { status: 500 });
        }

        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            phone: cleaned,
            full_name: `Umat ${cleaned.slice(-4)}`,
            role: 'umat',
            access_layer: 2,
            status: 'active',
          })
          .select('id')
          .single();

        if (profileError || !newProfile) {
          console.error('Failed to create profile:', profileError);
          await supabase.auth.admin.deleteUser(authData.user.id);
          return NextResponse.json({ error: 'Gagal membuat akun' }, { status: 500 });
        }

        userId = newProfile.id;
      }
    } else {
      userId = profile.id;
    }

    // Finalize profile if registration metadata exists and status is pending
    if (registrationMeta && profile && profile.status === 'pending') {
      const updatePayload: any = {
        status: 'active',
        full_name: registrationMeta.fullName || profile.full_name,
      };
      if (registrationMeta.familyId) updatePayload.family_id = registrationMeta.familyId;
      if (registrationMeta.noKkGereja) updatePayload.komunitas_gereja = Array.isArray(profile.komunitas_gereja) ? [...profile.komunitas_gereja, registrationMeta.noKkGereja] : [registrationMeta.noKkGereja];
      const { error: updateError } = await supabase.from('profiles').update(updatePayload).eq('id', profile.id);
      if (updateError) console.error('Failed to finalize profile:', updateError);
    }

    // Enrich profile from umat_staging if registration metadata exists
    if (registrationMeta?.familyId && userId) {
      try {
        const { data: stagingMembers } = await supabase
          .from('umat_staging')
          .select('id, nama, jenis_kelamin, tempat_tanggal_lahir, tanggal_lahir, umur, alamat, hubungan_keluarga, status_perkawinan, pendidikan_terakhir, pekerjaan, keterampilan, kondisi_tubuh, medical_history, economic_details, sakramen_records')
          .eq('keluarga_id', registrationMeta.familyId);

        if (stagingMembers && stagingMembers.length > 0) {
          const matchedStaging = stagingMembers.find(s => s.nama.toLowerCase() === (registrationMeta.fullName || '').toLowerCase()) || stagingMembers[0];
          const profileEnrichment: any = {
            jenis_kelamin: matchedStaging.jenis_kelamin || undefined,
            tempat_lahir: matchedStaging.tempat_tanggal_lahir?.split(',')[0]?.trim() || undefined,
            tanggal_lahir: matchedStaging.tanggal_lahir || undefined,
            alamat_lengkap: matchedStaging.alamat || undefined,
            status_perkawinan: matchedStaging.status_perkawinan || undefined,
            pendidikan_terakhir: matchedStaging.pendidikan_terakhir || undefined,
            pekerjaan: matchedStaging.pekerjaan || undefined,
            keterampilan: matchedStaging.keterampilan || undefined,
            kondisi_tubuh: matchedStaging.kondisi_tubuh || undefined,
            medical_history: matchedStaging.medical_history || undefined,
          };
          const { error: enrichError } = await supabase.from('profiles').update(profileEnrichment).eq('id', userId);
          if (enrichError) console.error('Failed to enrich profile:', enrichError);

          if (matchedStaging.economic_details) {
            await supabase.from('umat_details').upsert({ user_id: userId, economic_details: matchedStaging.economic_details }, { onConflict: 'user_id' });
          }
          if (matchedStaging.sakramen_records && Array.isArray(matchedStaging.sakramen_records)) {
            for (const sakramen of matchedStaging.sakramen_records) {
              await supabase.from('sakramen_records').insert({ user_id: userId, ...sakramen });
            }
          }
          if (registrationMeta.familyId) {
            await supabase.from('anggota_keluarga').upsert({ keluarga_id: registrationMeta.familyId, profile_id: userId, hubungan: matchedStaging.hubungan_keluarga || 'anggota' }, { onConflict: 'keluarga_id,profile_id' });
          }
        }
      } catch (enrichError) {
        console.error('Error during profile enrichment:', enrichError);
      }
    }

    // Tentukan password dan loginEmail
    const loginEmail = `wa+${cleaned}@paroki.local`;
    const defaultInternalPassword = `${cleaned}-${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 16)}`;

    // Jika registration flow, gunakan password yang sama dengan yang disimpan di metadata (atau fallback ke internal)
    // Jika login biasa, gunakan internalPassword
    const passwordToUse = registrationMeta ? (registrationMeta.password || defaultInternalPassword) : defaultInternalPassword;

    // Jika profile baru saja dibuat (registration flow), auth user sudah dibuat di atas dengan passwordToUse.
    // Tapi untuk flow login biasa (existing profile), auth user mungkin belum ada.
    if (!registrationMeta) {
      const internalPassword = defaultInternalPassword;
      const { data: existingAuthList } = await supabase.auth.admin.listUsers();
      const existingAuthUser = existingAuthList?.users?.find((u) => u.email === loginEmail);

      if (existingAuthUser) {
        await supabase.auth.admin.updateUserById(existingAuthUser.id, {
          password: internalPassword,
        });
      } else {
        const { error: authError } = await supabase.auth.admin.createUser({
          phone: cleaned,
          email: loginEmail,
          password: internalPassword,
          email_confirm: true,
          user_metadata: { phone: cleaned },
        });
        if (authError) {
          console.error('Failed to create auth user:', authError);
          return NextResponse.json({ error: 'Gagal membuat akun otentikasi' }, { status: 500 });
        }
      }
    }

    // Sign in to create a real session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: passwordToUse,
    });

    if (signInError || !signInData?.session) {
      console.error('Failed to create session:', signInError);
      return NextResponse.json({ error: 'Gagal membuat sesi' }, { status: 500 });
    }

    const sessionData = signInData;

    // Set cookie
    // Set SSR-compatible session cookies
    const projectRef2 = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('.')[0].split('//')[1];
    const authCookieName = `sb-${projectRef2}-auth-token`;
    const sessionPayload = JSON.stringify({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_in: sessionData.session.expires_in,
      expires_at: sessionData.session.expires_at,
      token_type: sessionData.session.token_type,
      user: sessionData.session.user,
    });

    console.log('[verify-otp] Session created and cookies set:', {
      userId: sessionData.user.id,
      email: sessionData.user.email,
      isProduction,
    });

    // Fetch fresh profile data
    const { data: freshProfile } = await supabase
      .from('profiles')
      .select('id, role, access_layer, status, lingkungan_slug, full_name')
      .eq('id', userId)
      .single();

    const response = NextResponse.json({
      success: true,
      user: freshProfile || profile,
    });
    response.cookies.set(authCookieName, sessionPayload, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    return response;
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}