import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { prefetchLiturgiBatch, getLiturgiHarian } from '@/lib/liturgi/liturgi-service';
import { format, addDays, getDay } from 'date-fns';
import { generateRenungan } from '@/lib/renungan/generateRenungan';


export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  if (token !== process.env.SUPABASE_SERVICE_ROLE_KEY && token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const today = new Date();
    const startDate = addDays(today, 7);
    const numberOfDays = 7;

    console.log(`Starting batch renungan generation for ${numberOfDays} days from ${format(startDate, 'yyyy-MM-dd')}`);

    await prefetchLiturgiBatch(startDate, numberOfDays);

    const renunganToInsert = [];
    const generatedDates: string[] = [];

    for (let i = 0; i < numberOfDays; i++) {
      const currentDate = addDays(startDate, i);
      const dayOfWeek = getDay(currentDate);
      const formattedDate = format(currentDate, 'yyyy-MM-dd');

      if (dayOfWeek === 2 || dayOfWeek === 4) {
        console.log(`Skipping renungan generation for ${formattedDate} (Hening Day).`);
        continue;
      }

      const liturgiData = await getLiturgiHarian(currentDate);
      if (!liturgiData || !liturgiData.bacaan_lengkap) {
        console.warn(`Could not get complete liturgical data for ${formattedDate}. Skipping renungan generation.`);
        continue;
      }

      let persona: 'ignas' | 'anton';
      if (dayOfWeek === 6) {
        persona = 'anton';
      } else {
        persona = 'ignas';
      }

      const renungan = await generateRenungan(currentDate, persona, liturgiData);
      if (renungan) {
        renunganToInsert.push(renungan);
        generatedDates.push(formattedDate);
      }
    }

    if (renunganToInsert.length === 0) {
      return NextResponse.json({ message: 'No renungan generated or all failed validation.' }, { status: 200 });
    }

    const { data: insertedRenungan, error: insertError } = await supabaseServer
      .from('renungan_harian')
      .insert(renunganToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting renungan:', insertError);
      return NextResponse.json({ error: 'Failed to save generated renungan', details: insertError.message }, { status: 500 });
    }

    const batchStartDate = format(startDate, 'yyyy-MM-dd');
    const batchEndDate = format(addDays(startDate, numberOfDays - 1), 'yyyy-MM-dd');
    const deadlineKurasi = format(addDays(startDate, 2), 'yyyy-MM-dd');

    const { data: batchData, error: batchError } = await supabaseServer
      .from('batch_kurasi')
      .insert({
        minggu_ke: `Minggu ${format(startDate, 'w')}`,
        tanggal_mulai: batchStartDate,
        tanggal_selesai: batchEndDate,
        deadline_kurasi: deadlineKurasi,
        status_batch: 'draft',
        jumlah_renungan: renunganToInsert.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (batchError) {
      console.error('Error creating batch kurasi:', batchError);
      await supabaseServer.from('renungan_harian').delete().in('id', insertedRenungan?.map(r => r.id) || []);
      return NextResponse.json({ error: 'Failed to create curation batch', details: batchError.message }, { status: 500 });
    }

    const { error: updateRenunganError } = await supabaseServer
      .from('renungan_harian')
      .update({ batch_id: batchData.id })
      .in('id', insertedRenungan?.map(r => r.id) || []);

    if (updateRenunganError) {
      console.error('Error updating renungan with batch_id:', updateRenunganError);
      return NextResponse.json({ error: 'Failed to link renungan to batch', details: updateRenunganError.message }, { status: 500 });
    }

    console.log(`Successfully generated and saved ${insertedRenungan.length} renungan for batch ${batchData.id}`);

    return NextResponse.json({
      success: true,
      batch_id: batchData.id,
      generated_count: insertedRenungan.length,
      generated_dates: generatedDates,
    });

  } catch (error: any) {
    console.error('Unhandled error in generate renungan API:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}