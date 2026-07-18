export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const serviceClient = createServiceClient();
    
    // Fetch upcoming events from multiple sources
    const [kegiatanResult, jadwalMisaResult] = await Promise.all([
      // Kegiatan paroki
      serviceClient
        .from('kegiatan')
        .select('id, nama_kegiatan, tanggal_mulai, waktu_mulai, lokasi, jenis_kegiatan, lingkungan_slug')
        .eq('is_published', true)
        .gte('tanggal_mulai', new Date().toISOString().split('T')[0])
        .order('tanggal_mulai', { ascending: true })
        .limit(10),
      
      // Jadwal Misa
      serviceClient
        .from('jadwal_misa')
        .select('id, nama_misa, tanggal, waktu, lokasi, jenis_misa')
        .gte('tanggal', new Date().toISOString().split('T')[0])
        .order('tanggal', { ascending: true })
        .order('waktu', { ascending: true })
        .limit(10),
    ]);

    const kegiatan = kegiatanResult.data || [];
    const jadwalMisa = jadwalMisaResult.data || [];

    // Combine and normalize events
    const events = [
      ...kegiatan.map(k => ({
        id: k.id,
        type: 'kegiatan',
        title: k.nama_kegiatan,
        datetime: `${k.tanggal_mulai}T${k.waktu_mulai || '00:00'}`,
        location: k.lokasi || '-',
        category: k.jenis_kegiatan || 'kegiatan',
        lingkungan: k.lingkungan_slug,
      })),
      ...jadwalMisa.map(j => ({
        id: j.id,
        type: 'misa',
        title: j.nama_misa,
        datetime: `${j.tanggal}T${j.waktu || '00:00'}`,
        location: j.lokasi || '-',
        category: 'misa',
        lingkungan: null,
      })),
    ];

    // Sort by datetime
    events.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

    // Take only next 5 events
    const upcomingEvents = events.slice(0, 5);

    return NextResponse.json({
      success: true,
      data: upcomingEvents,
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return NextResponse.json({ error: 'Gagal mengambil data kegiatan' }, { status: 500 });
  }
}