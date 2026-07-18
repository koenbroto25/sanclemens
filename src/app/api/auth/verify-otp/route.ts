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
          .select('id, nama, jenis_kelamin, tempat_tanggal_lahir, tanggal_lahir, umur, alamat, hubungan_keluarga, status_perkawinan, pendidikan_terakhir, pekerjaan, keterampilan, kondisi_tubuh, no_baptis, nama_baptis, gereja_baptis, kota_gereja_baptis, wali_baptis, tanggal_baptis, sakramen_komuni_pertama, tanggal_komuni_pertama, gereja_komuni_pertama, kota_gereja_komuni_pertama, sakramen_penguatan, tanggal_penguatan, gereja_penguatan, kota_gereja_penguatan, wali_penguatan, cara_menikah, tanggal_menikah, gereja_menikah, kota_gereja_menikah, sakramen_perkawinan, tanggal_perkawinan, gereja_perkawinan, kota_gereja_perkawinan, nama_pasangan, no_stasi, paroki, kota_paroki, no_lingkungan, nama_lingkungan, nama_kk, no_kk, wilayah, lingkungan, agama, nik, golongan_darah, suku, status_hubungan_keluarga, kota_kab, kecamatan, kelurahan, status_rumah, phone, nomer_hp_telepon, email, profesi, status_ekonomi, status_aktivitas_sosial, tgl_meninggal, tempat_meninggal, penyebab_meninggal, keterangan_tambahan, kota_domisili, alamat_domisili, tgl_pindah, asal_paroki, tujuan_paroki, no_surat_pindah, ket_lain, sumber_data_id, sumber_url, update_terakhir')
          .eq('keluarga_id', registrationMeta.familyId);

        if (stagingMembers && stagingMembers.length > 0) {
          const matchedStaging = stagingMembers.find(s => s.nama.toLowerCase() === (registrationMeta.fullName || '').toLowerCase()) || stagingMembers[0];
          
          // 1. Update profiles dengan data terverifikasi
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
            is_personal_data_verified: true,
            updated_by_text: 'Verifikasi registrasi umat',
          };
          const { error: enrichError } = await supabase.from('profiles').update(profileEnrichment).eq('id', userId);
          if (enrichError) console.error('Failed to enrich profile:', enrichError);

          // 2. Insert/Update ke umat (arsip lengkap data terverifikasi)
          const umatData: any = {
            staging_id: matchedStaging.id,
            profile_id: userId,
            nama: matchedStaging.nama,
            paroki: matchedStaging.paroki,
            wilayah: matchedStaging.wilayah,
            lingkungan: matchedStaging.lingkungan,
            nama_baptis: matchedStaging.nama_baptis,
            agama: matchedStaging.agama,
            no_baptis: matchedStaging.no_baptis,
            nik: matchedStaging.nik,
            no_kartu_keluarga: matchedStaging.no_kk, // umat_staging hanya punya 1 kolom no_kk (lihat reg_process.md Bagian 17.2 Bug #5)
            no_kk: matchedStaging.no_kk,
            nama_kk: matchedStaging.nama_kk,
            tempat_lahir: matchedStaging.tempat_tanggal_lahir?.split(',')[0]?.trim(),
            tanggal_lahir: matchedStaging.tanggal_lahir,
            jenis_kelamin: matchedStaging.jenis_kelamin,
            golongan_darah: matchedStaging.golongan_darah,
            suku: matchedStaging.suku,
            hubungan_keluarga: matchedStaging.hubungan_keluarga,
            status_hubungan_keluarga: matchedStaging.status_hubungan_keluarga,
            status_perkawinan: matchedStaging.status_perkawinan,
            tanggal_menikah: matchedStaging.tanggal_menikah,
            alamat: matchedStaging.alamat,
            kota_kab: matchedStaging.kota_kab,
            kecamatan: matchedStaging.kecamatan,
            kelurahan: matchedStaging.kelurahan,
            status_rumah: matchedStaging.status_rumah,
            handphone_telepon: matchedStaging.phone,
            nomer_hp_telepon: matchedStaging.nomer_hp_telepon,
            email: matchedStaging.email,
            pendidikan_terakhir: matchedStaging.pendidikan_terakhir,
            pekerjaan: matchedStaging.pekerjaan,
            profesi: matchedStaging.profesi,
            keterampilan: matchedStaging.keterampilan,
            kondisi_tubuh: matchedStaging.kondisi_tubuh,
            status_ekonomi: matchedStaging.status_ekonomi,
            status_aktivitas_sosial: matchedStaging.status_aktivitas_sosial,
            tanggal_baptis: matchedStaging.tanggal_baptis,
            gereja_baptis: matchedStaging.gereja_baptis,
            kota_gereja_baptis: matchedStaging.kota_gereja_baptis,
            wali_baptis: matchedStaging.wali_baptis,
            sakramen_komuni_pertama: matchedStaging.sakramen_komuni_pertama,
            tanggal_komuni_pertama: matchedStaging.tanggal_komuni_pertama,
            gereja_komuni_pertama: matchedStaging.gereja_komuni_pertama,
            kota_gereja_komuni_pertama: matchedStaging.kota_gereja_komuni_pertama,
            sakramen_penguatan: matchedStaging.sakramen_penguatan,
            tanggal_penguatan: matchedStaging.tanggal_penguatan,
            gereja_penguatan: matchedStaging.gereja_penguatan,
            kota_gereja_penguatan: matchedStaging.kota_gereja_penguatan,
            wali_penguatan: matchedStaging.wali_penguatan,
            cara_menikah: matchedStaging.cara_menikah,
            gereja_menikah: matchedStaging.gereja_menikah,
            kota_gereja_menikah: matchedStaging.kota_gereja_menikah,
            sakramen_perkawinan: matchedStaging.sakramen_perkawinan,
            tanggal_perkawinan: matchedStaging.tanggal_perkawinan,
            gereja_perkawinan: matchedStaging.gereja_perkawinan,
            kota_gereja_perkawinan: matchedStaging.kota_gereja_perkawinan,
            nama_pasangan: matchedStaging.nama_pasangan,
            no_stasi: matchedStaging.no_stasi,
            kota_paroki: matchedStaging.kota_paroki,
            no_lingkungan: matchedStaging.no_lingkungan,
            nama_lingkungan: matchedStaging.nama_lingkungan,
            tgl_meninggal: matchedStaging.tgl_meninggal,
            tempat_meninggal: matchedStaging.tempat_meninggal,
            penyebab_meninggal: matchedStaging.penyebab_meninggal,
            keterangan_tambahan: matchedStaging.keterangan_tambahan,
            kota_domisili: matchedStaging.kota_domisili,
            alamat_domisili: matchedStaging.alamat_domisili,
            tgl_pindah: matchedStaging.tgl_pindah,
            asal_paroki: matchedStaging.asal_paroki,
            tujuan_paroki: matchedStaging.tujuan_paroki,
            no_surat_pindah: matchedStaging.no_surat_pindah,
            ket_lain: matchedStaging.ket_lain,
            sumber_data_id: matchedStaging.sumber_data_id,
            sumber_url: matchedStaging.sumber_url,
            is_confirmed_by_user: true,
            confirmed_at: new Date().toISOString(),
            verified_by: userId,
            verified_at: new Date().toISOString(),
            update_terakhir: matchedStaging.update_terakhir || new Date().toISOString(),
          };
          
          const { data: newUmat, error: umatError } = await supabase
            .from('umat')
            .upsert(umatData, { onConflict: 'staging_id' })
            .select('id')
            .maybeSingle();
          
          if (umatError) {
            console.error('Failed to insert/update umat:', umatError);
          } else if (newUmat && !profileEnrichment.umat_id) {
            // Update profiles.umat_id jika belum ada
            await supabase.from('profiles').update({ umat_id: newUmat.id }).eq('id', userId);
          }

          // 3. Insert ke sakramen_records â€” DIHAPUS (Bug #6, reg_process.md Bagian 17.2):
          // matchedStaging.sakramen_records tidak pernah ada di skema umat_staging (dead code, tidak pernah tereksekusi).
          // Data sakramen harus dikumpulkan dari step registrasi terpisah, bukan dari staging Dukcapil.

          // 4. Insert/Update anggota_keluarga dengan mapping hubungan yang benar
          if (registrationMeta.familyId) {
            // Cek apakah ada suami masih hidup di keluarga ini
            const { data: existingMembers } = await supabase
              .from('anggota_keluarga')
              .select('hubungan_keluarga')
              .eq('keluarga_id', registrationMeta.familyId)
              .eq('hubungan_keluarga', 'suami');
            
            const hasSpouse = existingMembers && existingMembers.length > 0;
            const hubunganMapping: any = {
              'kepala': hasSpouse ? 'suami' : 'istri',
              'istri': 'istri',
              'anak': 'anak',
              'anggota': 'famili_lain',
            };
            const mappedHubungan = hubunganMapping[matchedStaging.hubungan_keluarga] || 'famili_lain';
            
            await supabase.from('anggota_keluarga').upsert({ 
              keluarga_id: registrationMeta.familyId, 
              profile_id: userId, 
              hubungan_keluarga: mappedHubungan,
              updated_by_text: 'Verifikasi registrasi umat',
            }, { onConflict: 'keluarga_id,profile_id' });
          }

          // 5. Update umat_staging status menjadi 'registered' (arsip)
          if (matchedStaging.id) {
            await supabase
              .from('umat_staging')
              .update({ 
                status: 'registered', 
                registered_profile_id: userId,
                verified_by: userId,
                verified_at: new Date().toISOString(),
                updated_by_text: 'Verifikasi registrasi umat',
              })
              .eq('id', matchedStaging.id);
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
      isProduction: process.env.NODE_ENV === 'production',
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