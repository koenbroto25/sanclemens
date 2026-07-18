export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const body = await request.json();
    const {
      pekerjaan,
      bidang_industri,
      keahlian,
      minat_pelayanan,
      link_portofolio,
      ketersediaan_charity,
      preferensi_lokasi,
      business_category,
      has_delivery,
      charity_discount,
      user_location,
    } = body;

    const payload: any = { user_id: user.id };
    if (pekerjaan !== undefined) payload.pekerjaan = pekerjaan || null;
    if (bidang_industri !== undefined) payload.bidang_industri = bidang_industri || null;
    if (keahlian !== undefined) payload.keahlian = keahlian || null;
    if (minat_pelayanan !== undefined) payload.minat_pelayanan = minat_pelayanan || null;
    if (link_portofolio !== undefined) payload.link_portofolio = link_portofolio || null;
    if (ketersediaan_charity !== undefined) payload.ketersediaan_charity = !!ketersediaan_charity;
    if (preferensi_lokasi !== undefined) payload.preferensi_lokasi = preferensi_lokasi || null;
    if (business_category !== undefined) payload.business_category = business_category || null;
    if (has_delivery !== undefined) payload.has_delivery = !!has_delivery;
    if (charity_discount !== undefined) payload.charity_discount = !!charity_discount;
    if (user_location !== undefined) payload.user_location = user_location || null;

    const { error: upsertError } = await supabase
      .from('user_ai_matching_data')
      .upsert(payload, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Failed to save AI matching data:', upsertError);
      return NextResponse.json({ error: 'Gagal menyimpan data AI Matching' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Data AI Matching tersimpan' });
  } catch (error) {
    console.error('AI matching data error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}