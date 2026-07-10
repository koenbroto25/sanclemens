export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getLiturgiHarian } from '@/lib/liturgi/liturgi-service';
import { generateRenungan } from '@/lib/renungan/generateRenungan'; // Import from existing generate route
import { format } from 'date-fns';

// Initialize Supabase client

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const persona = searchParams.get('persona') as 'ignas' | 'anton' | null;

    // Default to today if no date provided
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    
    // Default persona: ignas for Mon/Wed/Fri/Sun, anton for Sat
    const dayOfWeek = targetDate.getDay();
    let defaultPersona: 'ignas' | 'anton';
    if (dayOfWeek === 6) { // Saturday
      defaultPersona = 'anton';
    } else {
      defaultPersona = 'ignas';
    }
    
    const selectedPersona = persona || defaultPersona;
    const formattedDate = format(targetDate, 'yyyy-MM-dd');

    // 1. Get liturgical data
    const liturgiData = await getLiturgiHarian(targetDate);

    // 2. Check if renungan already exists in database
    const { data: existingRenungan, error: fetchError } = await supabaseServer
      .from('renungan_harian')
      .select('*')
      .eq('tanggal', formattedDate)
      .eq('mode_persona', selectedPersona)
      .eq('status_kurasi', 'disetujui') // Only return approved renungan
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(`Error fetching renungan for ${formattedDate}:`, fetchError.message);
    }

    if (existingRenungan) {
      // Return existing approved renungan
      return NextResponse.json({
        success: true,
        data: {
          renungan: existingRenungan,
          liturgi: liturgiData,
          cached: true,
        },
      });
    }

    // 3. If no approved renungan exists, generate one (for pre-publication or preview)
    // Note: In production, you might want to restrict this to admin users only
    const generatedRenungan = await generateRenungan(targetDate, selectedPersona, liturgiData);
    
    if (!generatedRenungan) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Renungan belum tersedia untuk tanggal ini. Bacaan liturgi sedang dipersiapkan.',
          data: {
            liturgi: liturgiData,
            cached: false,
          }
        },
        { status: 200 }
      );
    }

    // Save generated renungan as draft (not yet approved)
    const { data: newRenungan, error: insertError } = await supabaseServer
      .from('renungan_harian')
      .insert({
        ...generatedRenungan,
        status: 'draft',
        status_kurasi: 'menunggu',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving generated renungan:', insertError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Gagal menyimpan renungan.',
          error: insertError.message,
          data: {
            liturgi: liturgiData,
            cached: false,
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        renungan: newRenungan,
        liturgi: liturgiData,
        cached: false,
        message: 'Renungan berhasil digenerate dan menunggu kurasi.',
      },
    });

  } catch (error: any) {
    console.error('Error in GET /api/renungan/harian:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan server.',
        error: error.message 
      },
      { status: 500 }
    );
  }
}