export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadToR2 } from '@/lib/storage/r2';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const seller_id = searchParams.get('seller_id');
    const status = searchParams.get('status') || 'active';

    let query = supabase
      .from('marketplace_products')
      .select('*, profiles(full_name, phone, lingkungan_slug)')
      .eq('status', status);

    if (category) {
      query = query.eq('category', category);
    }

    if (seller_id) {
      query = query.eq('seller_id', seller_id);
    }

    const { data: products, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Gagal mengambil produk' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('Get products error:', error);
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
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = formData.get('price') as string;
    const category = formData.get('category') as string;
    const stock = parseInt(formData.get('stock') as string) || 0;
    const imageFiles = formData.getAll('images') as File[];

    // Validate: max 2 images
    if (imageFiles.length > 2) {
      return NextResponse.json({ 
        error: 'Maksimal 2 foto per produk' 
      }, { status: 400 });
    }

    // Validate: only image files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    for (const file of imageFiles) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: `Format file tidak didukung: ${file.name}. Hanya JPG, PNG, WebP yang diperbolehkan.` 
        }, { status: 400 });
      }
      
      // Validate: max 5MB per file
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ 
          error: `File terlalu besar: ${file.name}. Maksimal 5MB per foto.` 
        }, { status: 400 });
      }
    }

    // Compress and upload images to R2
    const uploadedImages: string[] = [];
    const r2Bucket = process.env.R2_BUCKET_NAME || 'paroki-marketplace';

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const r2Key = `products/${user.id}/${Date.now()}_${i}_${file.name.replace(/\s+/g, '_')}`;
        const r2Url = await uploadToR2(r2Bucket, r2Key, buffer, file.type, true);
        uploadedImages.push(r2Url);
      } catch (uploadError) {
        console.error('Failed to upload image:', uploadError);
        return NextResponse.json({ 
          error: `Gagal mengunggah foto: ${file.name}` 
        }, { status: 500 });
      }
    }

    const { data: product, error } = await supabase
      .from('marketplace_products')
      .insert({
        seller_id: user.id,
        name,
        description,
        price,
        category,
        images: uploadedImages,
        stock,
        status: 'pending_approval',
      })
      .single();

    if (error) {
      console.error('Create product error:', error);
      // Clean up uploaded images if product creation fails
      return NextResponse.json({ error: 'Gagal membuat produk' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Produk berhasil diajukan, menunggu moderasi',
      data: product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}