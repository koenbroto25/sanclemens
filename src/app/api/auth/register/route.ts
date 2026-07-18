export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { name, phone, password, lingkungan_slug, username_wd } = await request.json();
    
    if (!name || !phone || !password) {
      return NextResponse.json({ error: 'Nama, No WhatsApp, dan password harus diisi' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Check if phone already registered
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'No WhatsApp sudah terdaftar' }, { status: 409 });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      phone,
      password,
      phone_confirm: false,
    });

    if (authError) {
      return NextResponse.json({ error: 'Gagal membuat akun: ' + authError.message }, { status: 500 });
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

    // Check for pre-registered role assignment
    let assignedRole: string | null = null;
    let assignedAccessLayer: number | null = null;

    const { data: preRegisteredRole } = await supabase
      .from('pre_registered_roles')
      .select('id, role, access_layer')
      .eq('phone_number', phone)
      .eq('is_active', true)
      .is('used_by', null)
      .maybeSingle();

    if (preRegisteredRole) {
      assignedRole = preRegisteredRole.role;
      assignedAccessLayer = preRegisteredRole.access_layer;
    }

    // Create profile with assigned role or default
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: name,
        phone,
        username_wd: username_wd || null, // Add username_wd here
        role: assignedRole || 'umat',
        access_layer: assignedAccessLayer || 1,
        status: assignedAccessLayer && assignedAccessLayer >= 4 ? 'active' : 'pending',
        lingkungan_id,
        lingkungan_slug,
      })
      .select('id')
      .single();

    if (profileError) {
      // Rollback auth user creation
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Gagal membuat profil' }, { status: 500 });
    }

    // Generate PIDU (Paroki ID Digital Umat) automatically with Y2Y1M2M1-XXXXX format
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11

    const yearString = String(currentYear).slice(-2); // e.g., "26" from 2026
    const monthString = String(currentMonth).padStart(2, '0'); // e.g., "07" from 7

    const reversedYearMonth = `${yearString[1]}${yearString[0]}${monthString[1]}${monthString[0]}`; // e.g., "6270"
    const randomSuffix = String(Math.floor(Math.random() * 99999)).padStart(5, '0'); // e.g., "12345"

    const piduId = `${reversedYearMonth}-${randomSuffix}`; // e.g., "6270-12345"

    const { error: piduError } = await supabase
      .from('profiles')
      .update({ pidu_id: piduId })
      .eq('id', newProfile.id);

    if (piduError) {
      console.error('Error generating PIDU:', piduError);
      // Non-fatal: continue even if PIDU generation fails
    }

    // Mark pre-registered role as used
    if (preRegisteredRole) {
      await supabase
        .from('pre_registered_roles')
        .update({
          used_by: newProfile.id,
          used_at: new Date().toISOString(),
          is_active: false,
        })
        .eq('id', preRegisteredRole.id);
    }

    // OTP notifications are now handled by Fonnte Edge Function
    return NextResponse.json({
      success: true,
      message: assignedRole && assignedAccessLayer 
        ? `Pendaftaran berhasil. Role "${assignedRole}" telah ditetapkan.`
        : 'Pendaftaran berhasil. Silakan verifikasi OTP.',
      userId: authData.user.id,
      assigned_role: assignedRole,
      assigned_access_layer: assignedAccessLayer,
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}