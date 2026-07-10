export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  // Check if user is Super Admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Akses ditolak. Hanya Super Admin.' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('auto_replies')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching auto-replies:', error);
    return NextResponse.json({ error: 'Gagal memuat aturan auto-reply' }, { status: 500 });
  }

  return NextResponse.json({ success: true, autoReplies: data });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Akses ditolak. Hanya Super Admin.' }, { status: 403 });
  }

  const { keyword, response_message, response_type, file_url, file_filename, button_options, priority, is_active } = await request.json();

  if (!keyword || !response_message) {
    return NextResponse.json({ error: 'Keyword dan Response Message harus diisi.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('auto_replies')
    .insert({
      keyword,
      response_message,
      response_type,
      file_url,
      file_filename,
      button_options,
      priority,
      is_active,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating auto-reply:', error);
    return NextResponse.json({ error: 'Gagal membuat aturan auto-reply' }, { status: 500 });
  }

  return NextResponse.json({ success: true, autoReply: data });
}

export async function PUT(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Akses ditolak. Hanya Super Admin.' }, { status: 403 });
  }

  const { id, keyword, response_message, response_type, file_url, file_filename, button_options, priority, is_active } = await request.json();

  if (!id || !keyword || !response_message) {
    return NextResponse.json({ error: 'ID, Keyword, dan Response Message harus diisi.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('auto_replies')
    .update({
      keyword,
      response_message,
      response_type,
      file_url,
      file_filename,
      button_options,
      priority,
      is_active,
      updated_by: user.id,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating auto-reply:', error);
    return NextResponse.json({ error: 'Gagal memperbarui aturan auto-reply' }, { status: 500 });
  }

  return NextResponse.json({ success: true, autoReply: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Akses ditolak. Hanya Super Admin.' }, { status: 403 });
  }

  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'ID harus diisi.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('auto_replies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting auto-reply:', error);
    return NextResponse.json({ error: 'Gagal menghapus aturan auto-reply' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Aturan auto-reply berhasil dihapus.' });
}