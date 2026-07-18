export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { full_name, phone, address, lingkungan_id } = await request.json();

    // Update profile
    const updateData: Record<string, string | null> = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (lingkungan_id !== undefined) updateData.lingkungan_id = lingkungan_id;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang diupdate' }, { status: 400 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select('full_name, phone, address')
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return NextResponse.json({ error: 'Gagal memperbarui profil' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: profile,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}