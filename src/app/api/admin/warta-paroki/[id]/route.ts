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
      .from('warta_paroki')
      .select('*, profiles(full_name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Warta tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Admin warta detail error:', error);
    return NextResponse.json({ error: 'Gagal memuat detail warta' }, { status: 500 });
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
      .from('warta_paroki')
      .update({ ...body, published_at: body.is_published ? (body.published_at || new Date().toISOString()) : null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Admin warta update error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui warta' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const { error } = await supabase
      .from('warta_paroki')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: 'Warta berhasil dihapus' });
  } catch (error) {
    console.error('Admin warta delete error:', error);
    return NextResponse.json({ error: 'Gagal menghapus warta' }, { status: 500 });
  }
}