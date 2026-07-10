export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Rate limiter per admin
const adminRateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const { 
      fullName, 
      phone, 
      password, 
      familyId, 
      noKkGereja,
      documentType = 'MANUAL',
      extractedData = {},
      lingkungan_slug,
      access_layer = 2
    } = await request.json();

    if (!fullName || !phone || !password) {
      return NextResponse.json({ error: 'Nama, nomor WhatsApp, dan password harus diisi' }, { status: 400 });
    }

    // Normalize phone
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }

    const supabase = createClient();

    // Check admin permissions
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id, access_layer, role')
      .eq('id', (await supabase.auth.getSession()).data.session?.user.id)
      .single();

    if (!adminProfile || adminProfile.access_layer < 4) {
      return NextResponse.json({ error: 'Akses ditolak. Hanya admin yang bisa mendaftarkan umat.' }, { status: 403 });
    }

    // Check if phone already registered
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', cleaned)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'No WhatsApp sudah terdaftar' }, { status: 409 });
    }

    // Rate limit per admin (10 registrations per hour)
    const now = Date.now();
    const adminLimit = adminRateLimitMap.get(adminProfile.id);
    if (adminLimit && now < adminLimit.resetAt) {
      return NextResponse.json({ 
        error: `Batas registrasi tercapai. Coba lagi dalam ${Math.ceil((adminLimit.resetAt - now) / 60000)} menit.`,
        remaining: Math.ceil((adminLimit.resetAt - now) / 60000)
      }, { status: 429 });
    }

    // Get lingkungan_id if provided
    let lingkungan_id = null;
    if (lingkungan_slug) {
      const { data: lingkungan } = await supabase
        .from('lingkungan')
        .select('id')
        .eq('slug', lingkungan_slug)
        .single();
      lingkungan_id = lingkungan?.id || null;
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      phone: cleaned,
      password,
      phone_confirm: true,
      user_metadata: { 
        fullName,
        registered_by_admin: true,
        admin_id: adminProfile.id
      },
    });

    if (authError) {
      return NextResponse.json({ error: 'Gagal membuat akun: ' + authError.message }, { status: 500 });
    }

    // Create profile with full data from staging if available
    const profileData: any = {
      id: authData.user.id,
      full_name: fullName,
      phone: cleaned,
      role: 'umat',
      access_layer,
      status: 'active', // Auto-active for admin registration
      lingkungan_id,
      lingkungan_slug,
      registered_by: adminProfile.id,
      registration_method: documentType,
      ...extractedData, // Merge OCR extracted data
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileData);

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Gagal membuat profil' }, { status: 500 });
    }

    // KK Digital Logic (v2.4): Handle KK Digital numbering based on OCR-extracted dukcapil_kk_number
    let familyIdForProfile = familyId; // Will be used to link profile to family
    
    if (documentType === 'KK' && extractedData.nokk_dukcapil) {
      const nokkDukcapil = extractedData.nokk_dukcapil;
      
      // Generate KK Digital number from last 4 digits of dukcapil KK + 5 random digits
      const last4Digits = nokkDukcapil.length >= 4 
        ? nokkDukcapil.slice(-4) 
        : '0000'; // Fallback if less than 4 digits
      const randomSuffix = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
      const nomor_kk_gereja = `${last4Digits}-${randomSuffix}`;
      
      // Check if family already exists with this dukcapil_kk_number
      const { data: existingFamily } = await supabase
        .from('families')
        .select('id')
        .eq('dukcapil_kk_number', nokkDukcapil)
        .single();
      
      let targetFamilyId = existingFamily?.id;
      
      // If family doesn't exist, create new entry in families table
      if (!existingFamily) {
        const { data: newFamily, error: familyError } = await supabase
          .from('families')
          .insert({
            nomor_kk_gereja: nomor_kk_gereja,
            dukcapil_kk_number: nokkDukcapil,
            nama_kepala: fullName,
            lingkungan_id: lingkungan_id,
          })
          .select('id')
          .single();
        
        if (familyError) {
          console.error('Error creating family entry:', familyError);
        } else {
          targetFamilyId = newFamily?.id;
        }
      }
      
      familyIdForProfile = targetFamilyId;
    }

    // If familyId provided, create anggota_keluarga
    if (familyIdForProfile) {
      await supabase
        .from('anggota_keluarga')
        .upsert({
          keluarga_id: familyIdForProfile,
          profile_id: authData.user.id,
          hubungan: extractedData.hubungan_keluarga || 'anggota',
          added_by_admin: true,
        }, {
          onConflict: 'keluarga_id,profile_id',
        });

      // Update keluarga last_update
      await supabase
        .from('keluarga')
        .update({
          last_update_by_text: `Admin: ${adminProfile.id}`,
          last_update_date: new Date().toISOString(),
        })
        .eq('id', familyIdForProfile);
      
      // Set nomor_kk_katolik in profile if we have a family with KK Digital
      if (documentType === 'KK' && extractedData.nokk_dukcapil) {
        const nokkDukcapil = extractedData.nokk_dukcapil;
        const last4Digits = nokkDukcapil.length >= 4 
          ? nokkDukcapil.slice(-4) 
          : '0000';
        const randomSuffix = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
        const nomor_kk_gereja = `${last4Digits}-${randomSuffix}`;
        
        await supabase
          .from('profiles')
          .update({
            nomor_kk_katolik: nomor_kk_gereja,
            family_id: familyIdForProfile,
          })
          .eq('id', authData.user.id);
      }
    }

    // If staging data matched, create umat_details and sakramen_records
    if (familyId && extractedData.economic_details) {
      await supabase
        .from('umat_details')
        .upsert({
          user_id: authData.user.id,
          economic_details: extractedData.economic_details,
        }, {
          onConflict: 'user_id',
        });
    }

    if (extractedData.sakramen_records && Array.isArray(extractedData.sakramen_records)) {
      for (const sakramen of extractedData.sakramen_records) {
        await supabase
          .from('sakramen_records')
          .insert({
            user_id: authData.user.id,
            ...sakramen,
          });
      }
    }

    // Generate default password untuk disimpan (opsional, untuk admin lihat)
    // Dalam real implementation, sebaiknya kirim via WA saja, jangan disimpan
    
    // Send OTP to user
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await supabase.from('auth_otps').insert({
      phone: cleaned,
      otp_code: otp,
      expires_at: expiresAt,
      is_used: false,
      attempts: 0,
      metadata: {
        type: 'admin_registration',
        admin_id: adminProfile.id,
        userId: authData.user.id,
      },
    });

    // Send notification via the new /api/notifications/send route
    const notificationMessage = `Kode OTP Paroki Santo Klemens: ${otp}\n\nKode ini berlaku 5 menit. Jangan bagikan ke siapapun.`;
    const notificationPayload = {
      recipient_ids: [authData.user.id], // Kirim ke user baru
      type: 'otp',
      message: notificationMessage,
      data: { otp_code: otp },
    };

    try {
      const response = await fetch(`${request.url.split('/api/')[0]}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPayload),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        console.error('Failed to send OTP via notification service:', errorResult.error);
      }
    } catch (notificationError) {
      console.error('Error calling notification service for OTP:', notificationError);
    }

    // Log to audit trail
    await supabase.rpc('log_admin_action', {
      p_admin_id: adminProfile.id,
      p_admin_name: fullName,
      p_admin_role: adminProfile.role || 'admin',
      p_admin_access_layer: adminProfile.access_layer,
      p_action: 'register_umat',
      p_action_description: `Registered new umat: ${fullName}`,
      p_target_type: 'user',
      p_target_id: authData.user.id,
      p_target_name: fullName,
      p_metadata: {
        document_type: documentType,
        method: documentType === 'KTP' || documentType === 'KK' || documentType === 'BAPTIS' ? 'ocr' : 'manual',
        lingkungan_slug,
        family_id: familyId,
      } as any,
      p_ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      p_user_agent: request.headers.get('user-agent') || 'unknown',
    } as any);

    // Update rate limit
    adminRateLimitMap.set(adminProfile.id, {
      count: (adminLimit?.count || 0) + 1,
      resetAt: now + 60 * 60 * 1000, // 1 hour
    });

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berhasil. OTP telah dikirim ke WhatsApp umat.',
      userId: authData.user.id,
      phone: cleaned,
    });

  } catch (error) {
    console.error('Admin registration error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}