export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const { data, error } = await supabase
      .from('jadwal_misa')
      .select('*, profiles(full_name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Jadwal misa tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Admin jadwal misa detail error:', error);
    return NextResponse.json({ error: 'Gagal memuat detail jadwal misa' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const body = await request.json();
    const { data, error } = await supabase
      .from('jadwal_misa')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Admin jadwal misa update error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui jadwal misa' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const { error } = await supabase
      .from('jadwal_misa')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: 'Jadwal misa berhasil dihapus' });
  } catch (error) {
    console.error('Admin jadwal misa delete error:', error);
    return NextResponse.json({ error: 'Gagal menghapus jadwal misa' }, { status: 500 });
  }
}