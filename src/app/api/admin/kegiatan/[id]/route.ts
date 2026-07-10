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
      .from('kegiatan_paroki')
      .select('*, profiles(full_name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Admin kegiatan detail error:', error);
    return NextResponse.json({ error: 'Gagal memuat detail kegiatan' }, { status: 500 });
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
      .from('kegiatan_paroki')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Admin kegiatan update error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui kegiatan' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const { error } = await supabase
      .from('kegiatan_paroki')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: 'Kegiatan berhasil dihapus' });
  } catch (error) {
    console.error('Admin kegiatan delete error:', error);
    return NextResponse.json({ error: 'Gagal menghapus kegiatan' }, { status: 500 });
  }
}