export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    // Get keluarga where user is kepala or anggota
    const { data: keluargaList, error: keluargaError } = await supabase
      .from('keluarga')
      .select('*')
      .or(`kepala_keluarga_id.eq.${profile.id},id.in.(
        SELECT keluarga_id FROM anggota_keluarga WHERE profile_id = ${profile.id}
      )`);
    
    if (keluargaError) {
      console.error('Error fetching keluarga:', keluargaError);
      return NextResponse.json({ error: 'Failed to fetch keluarga' }, { status: 500 });
    }
    
    // For each keluarga, get anggota
    const keluargaWithAnggota = await Promise.all(
      (keluargaList || []).map(async (kk) => {
        const { data: anggota } = await supabase
          .from('anggota_keluarga')
          .select('*, profiles:profile_id(*)')
          .eq('keluarga_id', kk.id);
        
        return {
          ...kk,
          anggota: anggota || []
        };
      })
    );
    
    return NextResponse.json({ data: keluargaWithAnggota });
    
  } catch (error) {
    console.error('Error in GET /api/user/keluarga:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    // Parse request body
    const body = await request.json();
    const { no_kk, kepala_keluarga_nama, alamat_lengkap, rt, rw, kelurahan, kecamatan, kota, provinsi, jumlah_anggota } = body;
    
    // Validate required fields
    if (!no_kk || !kepala_keluarga_nama) {
      return NextResponse.json({ error: 'No KK dan Kepala Keluarga harus diisi' }, { status: 400 });
    }
    
    // Check if KK already exists
    const { data: existingKK } = await supabase
      .from('keluarga')
      .select('id')
      .eq('no_kk', no_kk)
      .single();
    
    if (existingKK) {
      return NextResponse.json({ error: 'KK sudah terdaftar' }, { status: 409 });
    }
    
    // Create keluarga
    const { data: newKeluarga, error: insertError } = await supabase
      .from('keluarga')
      .insert({
        no_kk,
        kepala_keluarga_id: profile.id,
        kepala_keluarga_nama,
        alamat_lengkap,
        rt,
        rw,
        kelurahan,
        kecamatan,
        kota: kota || 'BALIKPAPAN',
        provinsi: provinsi || 'KALIMANTAN TIMUR',
        jumlah_anggota: jumlah_anggota || 1,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating keluarga:', insertError);
      return NextResponse.json({ error: 'Failed to create keluarga' }, { status: 500 });
    }
    
    // Add kepala as anggota
    await supabase
      .from('anggota_keluarga')
      .insert({
        keluarga_id: newKeluarga.id,
        profile_id: profile.id,
        hubungan_keluarga: 'kepala'
      });
    
    return NextResponse.json({ data: newKeluarga }, { status: 201 });
    
  } catch (error) {
    console.error('Error in POST /api/user/keluarga:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}