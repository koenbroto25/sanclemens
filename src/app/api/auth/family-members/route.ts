export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { familyId } = await request.json();

    if (!familyId) {
      return NextResponse.json({ error: 'Family ID harus diisi' }, { status: 400 });
    }

    const supabase = createClient();

    const { data: members, error: membersError } = await supabase
      .from('anggota_keluarga')
      .select(`
        id,
        profile_id,
        hubungan,
        profiles:profile_id(id, full_name, phone, role, status)
      `)
      .eq('keluarga_id', familyId);

    if (membersError) {
      console.error('Failed to fetch family members:', membersError);
      return NextResponse.json({ error: 'Gagal mengambil data anggota keluarga' }, { status: 500 });
    }

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error('Family members error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}