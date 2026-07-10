export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's documents in vault
    const { data: documents, error } = await supabase
      .from('digital_vault')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Gagal mengambil dokumen' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    console.error('Get vault error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const document_type = formData.get('document_type') as string;

    if (!file) {
      return NextResponse.json({ error: 'File harus diupload' }, { status: 400 });
    }

    // Upload to Cloudflare R2
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    // R2 upload via backend (placeholder until Cloudflare R2 is configured)
    const { data: document, error } = await supabase
      .from('digital_vault')
      .insert({
        user_id: user.id,
        document_type,
        file_name: file.name,
        file_size: file.size,
        file_url: `https://r2.example.com/paroki-vault/${fileName}`, // placeholder
        extraction_status: 'pending',
      })
      .single();

    if (error) {
      console.error('Vault upload error:', error);
      return NextResponse.json({ error: 'Gagal upload dokumen' }, { status: 500 });
    }

    // OCR via Google Cloud Vision (to be integrated)
    // Notify Sekretaris for verification via Fonnte

    return NextResponse.json({
      success: true,
      message: 'Dokumen berhasil diupload. Menunggu verifikasi Sekretaris.',
      data: document,
    });
  } catch (error) {
    console.error('Vault error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}