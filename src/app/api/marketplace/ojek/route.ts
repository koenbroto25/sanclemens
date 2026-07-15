export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'available';

    const { data: ojek, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, lingkungan_slug, ojek_rating, total_deliveries')
      .eq('role', 'ojek_solidaritas')
      .eq('ojek_status', status)
      .order('ojek_rating', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Gagal mengambil data ojek' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: ojek });
  } catch (error) {
    console.error('Get ojek error:', error);
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

    const { action, payload } = await request.json();

    switch (action) {
      case 'register': {
        const { vehicle_type, vehicle_plate, max_capacity } = payload;
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .update({
            role: 'ojek_solidaritas',
            ojek_status: 'pending_approval',
            ojek_vehicle_type: vehicle_type,
            ojek_vehicle_plate: vehicle_plate,
            ojek_max_capacity: max_capacity,
            ojek_rating: 0,
            total_deliveries: 0,
          })
          .eq('id', user.id)
          .select()
          .single();

        if (error) {
          console.error('Register ojek error:', error);
          return NextResponse.json({ error: 'Gagal mendaftar sebagai ojek' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Pendaftaran ojek sedang menunggu persetujuan admin',
          status: 'pending_approval',
          data: profile,
        });
      }

      case 'update-status': {
        const { status } = payload;
        
        const { error } = await supabase
          .from('profiles')
          .update({ ojek_status: status })
          .eq('id', user.id);

        if (error) {
          return NextResponse.json({ error: 'Gagal update status' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Status berhasil diupdate' });
      }

      case 'accept-order': {
        const { order_id } = payload;
        
        const { error } = await supabase
          .from('marketplace_orders')
          .update({
            ojek_id: user.id,
            status: 'accepted_by_ojek',
          })
          .eq('id', order_id);

        if (error) {
          return NextResponse.json({ error: 'Gagal menerima pesanan' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Pesanan berhasil diterima' });
      }

      default:
        return NextResponse.json({ error: 'Action tidak dikenali' }, { status: 400 });
    }
  } catch (error) {
    console.error('Ojek error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}