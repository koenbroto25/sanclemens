export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { wali_id, keluarga_id, selected_anggota } = await request.json();

    if (!wali_id || !keluarga_id || !selected_anggota || selected_anggota.length === 0) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const supabase = createClient();

    // Verify wali is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== wali_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update wali profile to mark as wali digital if not already
    const { data: waliProfile, error: waliError } = await supabase
      .from('profiles')
      .upsert({
        id: wali_id,
        is_wali_digital: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (waliError) {
      console.error('Error updating wali profile:', waliError);
      return NextResponse.json({ error: 'Gagal mengupdate profil wali' }, { status: 500 });
    }

    const results = [];

    // Process each selected anggota
    for (const anggota of selected_anggota) {
      try {
        // Check if already registered
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('nik', anggota.nama) // Using nama as temporary identifier
          .single();

        if (existingProfile) {
          // Link existing profile to wali
          const { error: linkError } = await supabase
            .from('profiles')
            .update({
              wali_digital_id: wali_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingProfile.id);

          if (linkError) {
            console.error('Error linking profile:', linkError);
            results.push({ nama: anggota.nama, status: 'error', error: 'Gagal menghubungkan akun' });
            continue;
          }

          // Update umat_staging status
          await supabase
            .from('umat_staging')
            .update({
              status: 'registered',
              registered_profile_id: existingProfile.id
            })
            .eq('id', anggota.staging_id);

          results.push({ nama: anggota.nama, status: 'linked', profile_id: existingProfile.id });
        } else {
          // Generate username_wd
          const kk_last4 = anggota.no_kk.slice(-4);
          const base_name = (anggota.nama_baptis || anggota.nama).split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
          const username_wd = `${base_name}@${kk_last4}`;
          
          // Generate password default: Klemen + 4digitKK
          const default_password = `Klemen${kk_last4}`;
          
          // Create auth user with username_wd as email and wali's phone
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: `${username_wd}@keluarga.paroki.local`,
            password: default_password,
            phone: waliProfile.phone,
            phone_confirm: false,
            email_confirm: false,
          });

          if (authError || !authData?.user) {
            console.error('Error creating auth user:', authError);
            results.push({ nama: anggota.nama, status: 'error', error: 'Gagal membuat akun auth' });
            continue;
          }

          const newProfileId = authData.user.id;

          // Create profile
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: newProfileId,
              full_name: anggota.nama,
              nama_baptis: anggota.nama_baptis,
              phone: waliProfile.phone,
              role: 'umat',
              access_layer: 2,
              status: 'active',
              wali_digital_id: wali_id,
              is_wali_digital: false,
              username_wd: username_wd,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('Error creating profile:', insertError);
            // Rollback auth user
            await supabase.auth.admin.deleteUser(newProfileId);
            results.push({ nama: anggota.nama, status: 'error', error: 'Gagal membuat profil' });
            continue;
          }

          // Insert into anggota_keluarga
          const { error: anggotaError } = await supabase
            .from('anggota_keluarga')
            .insert({
              keluarga_id: keluarga_id,
              profile_id: newProfileId,
              hubungan_keluarga: anggota.hubungan
            });

          if (anggotaError) {
            console.error('Error inserting anggota_keluarga:', anggotaError);
          }

          // Update umat_staging
          await supabase
            .from('umat_staging')
            .update({
              status: 'registered',
              registered_profile_id: newProfileId
            })
            .eq('id', anggota.staging_id);

          results.push({ 
            nama: anggota.nama, 
            status: 'created', 
            profile_id: newProfileId, 
            username: username_wd,
            password: default_password 
          });
        }
      } catch (error) {
        console.error('Error processing anggota:', error);
        results.push({ nama: anggota.nama, status: 'error', error: 'Terjadi kesalahan' });
      }
    }

    const successCount = results.filter(r => r.status !== 'error').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    // Log wali digital action
    if (successCount > 0) {
      await supabase.from('wali_digital_log').insert({
        wali_id: wali_id,
        wakilan_id: selected_anggota.map((a: any) => a.staging_id).join(','), // staging IDs as reference
        aksi: 'tambah_wakilan',
        detail: `Register ${successCount} anggota dari KK ${keluarga_id}: ${selected_anggota.map((a: any) => a.nama).join(', ')}`
      });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mendaftarkan ${successCount} anggota${errorCount > 0 ? ` (${errorCount} gagal)` : ''}`,
      results,
      wali_id
    });

  } catch (error) {
    console.error('Register family error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}