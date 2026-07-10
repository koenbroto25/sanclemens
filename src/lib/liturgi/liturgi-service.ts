import { format, addDays } from 'date-fns';
import { fetchReadings } from './catholic-readings';
import { getBibleText } from './bible-rag';
import { getMetadataLiturgi } from './liturgi-romcal';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or Service Role Key is missing from environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface DataLiturgi {
  tanggal: string;
  perayaan: string | null;
  tingkat_perayaan: string | null;
  warna_liturgi: string | null;
  is_minggu: boolean;
  musim_liturgi: string | null;
  bacaan_list: { reference: string; text: string | null }[];
  url_sumber: string | null;
  bacaan_lengkap: boolean;
  bacaan_teks: Record<string, string | null>;
  discrape_pada: string;
}

interface CacheLiturgiRow {
  tanggal: string;
  perayaan: string;
  tingkat_perayaan: string;
  warna_liturgi: string;
  is_minggu: boolean;
  musim_liturgi: string;
  bacaan_list: string[]; // e.g. ["Kej 1:1-5","Mat 5:1-12"]
  url_sumber: string;
  bacaan_lengkap: boolean;
  bacaan_teks: Record<string, string | null>;
  discrape_pada: string;
}

/**
 * Helper to build the structured bacaan_list from references and their texts.
 */
async function _buildBacaanList(
  readingRefs: { first_reading?: string; responsorial_psalm?: string; second_reading?: string; gospel?: string },
  textsMap: Record<string, string | null>
): Promise<{ reference: string; text: string | null }[]> {
  const references: string[] = [];
  if (readingRefs.first_reading) references.push(readingRefs.first_reading);
  if (readingRefs.responsorial_psalm) references.push(readingRefs.responsorial_psalm);
  if (readingRefs.second_reading) references.push(readingRefs.second_reading);
  if (readingRefs.gospel) references.push(readingRefs.gospel);

  return references.map(ref => ({
    reference: ref,
    text: textsMap[ref] || null,
  }));
}

/**
 * Orchestrates fetching liturgical data with a 3-layer fallback and caching.
 * Layer 1: Supabase cache
 * Layer 2: Romcal (metadata) + Catholic Readings (references) + RAG Bible (text)
 * @param date The date for which to get liturgical data.
 * @returns A promise that resolves to DataLiturgi object.
 */
export async function getLiturgiHarian(date: Date): Promise<DataLiturgi> {
  const formattedDate = format(date, 'yyyy-MM-dd');
  const now = new Date().toISOString();

  // 1. Layer 1: Check Supabase Cache
  try {
    const { data: cachedData, error: cacheError } = await supabase
      .from('cache_liturgi')
      .select('*')
      .eq('tanggal', formattedDate)
      .single();

    if (cachedData && cachedData.bacaan_lengkap) {
      console.log(`Cache hit for ${formattedDate}`);
      return {
        tanggal: cachedData.tanggal,
        perayaan: cachedData.perayaan,
        tingkat_perayaan: cachedData.tingkat_perayaan,
        warna_liturgi: cachedData.warna_liturgi,
        is_minggu: cachedData.is_minggu,
        musim_liturgi: cachedData.musim_liturgi,
        bacaan_list: (cachedData.bacaan_list as string[]).map(ref => ({ reference: ref, text: cachedData.bacaan_teks[ref] || null })),
        url_sumber: cachedData.url_sumber,
        bacaan_lengkap: cachedData.bacaan_lengkap,
        bacaan_teks: cachedData.bacaan_teks,
        discrape_pada: cachedData.discrape_pada,
      };
    }
    if (cacheError && cacheError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error(`Supabase cache error for ${formattedDate}:`, cacheError.message);
    }
  } catch (err) {
    console.error(`Unexpected error checking cache for ${formattedDate}:`, err);
  }

  // 2. Layer 2: Fetch from Romcal (metadata) + Catholic Readings API + RAG Bible
  let perayaan: string | null = null;
  let tingkat_perayaan: string | null = null;
  let warna_liturgi: string | null = null;
  let is_minggu: boolean = false;
  let musim_liturgi: string | null = null;
  let url_sumber: string | null = null;
  let bacaan_lengkap: boolean = false;
  let bacaan_list_refs: string[] = [];
  let textsMap: Record<string, string | null> = {};

  try {
    const [metadata, readingRefs] = await Promise.all([
      getMetadataLiturgi(date),
      fetchReadings(date),
    ]);

    perayaan = metadata.perayaan;
    tingkat_perayaan = metadata.tingkat_perayaan;
    warna_liturgi = metadata.warna_liturgi;
    is_minggu = metadata.is_minggu;
    musim_liturgi = metadata.musim_liturgi;

    if (readingRefs) {
      const referencesToFetch = [
        readingRefs.first_reading,
        readingRefs.responsorial_psalm,
        readingRefs.second_reading,
        readingRefs.gospel,
      ].filter(Boolean) as string[];

      bacaan_list_refs = referencesToFetch;

      const bibleTextPromises = referencesToFetch.map(ref => getBibleText(ref));
      const bibleTexts = await Promise.all(bibleTextPromises);

      bibleTexts.forEach(item => {
        textsMap[item.reference] = item.text;
        if (item.found) {
          bacaan_lengkap = true; // Mark as complete if at least one text is found
        }
      });
      url_sumber = `https://catholic-readings-api.vercel.app/?date=${formattedDate}`;
    }
  } catch (err) {
    console.error(`Error in Layer 2 (Metadata + API + RAG) for ${formattedDate}:`, err);
  }

  // 3. Fallback values if Layer 2 failed
  if (!perayaan) perayaan = `Hari Biasa ${format(date, 'd MMMM')}`;
  if (!warna_liturgi) warna_liturgi = 'hijau';
  if (!tingkat_perayaan) tingkat_perayaan = 'Hari Biasa';
  if (!musim_liturgi) musim_liturgi = 'Waktu Biasa';

  const finalBacaanList = await _buildBacaanList(
    {
      first_reading: bacaan_list_refs[0],
      responsorial_psalm: bacaan_list_refs[1],
      second_reading: bacaan_list_refs[2],
      gospel: bacaan_list_refs[3],
    },
    textsMap
  );
  
  // Save to cache (or update if partial data was already there)
  const cachePayload: CacheLiturgiRow = {
    tanggal: formattedDate,
    perayaan: perayaan || 'Tidak Diketahui',
    tingkat_perayaan: tingkat_perayaan || 'Hari Biasa',
    warna_liturgi: warna_liturgi || 'hijau',
    is_minggu: is_minggu,
    musim_liturgi: musim_liturgi || 'Waktu Biasa',
    bacaan_list: bacaan_list_refs,
    url_sumber: url_sumber || 'Internal Logic',
    bacaan_lengkap: bacaan_lengkap,
    bacaan_teks: textsMap,
    discrape_pada: now,
  };

  try {
    const { error: upsertError } = await supabase
      .from('cache_liturgi')
      .upsert(cachePayload, { onConflict: 'tanggal' });
    if (upsertError) {
      console.error(`Error upserting cache for ${formattedDate}:`, upsertError.message);
    }
  } catch (err) {
    console.error(`Unexpected error upserting cache for ${formattedDate}:`, err);
  }

  return {
    tanggal: formattedDate,
    perayaan: perayaan || 'Tidak Diketahui',
    tingkat_perayaan: tingkat_perayaan || 'Hari Biasa',
    warna_liturgi: warna_liturgi || 'hijau',
    is_minggu: is_minggu,
    musim_liturgi: musim_liturgi || 'Waktu Biasa',
    bacaan_list: finalBacaanList,
    url_sumber: url_sumber || 'Internal Logic',
    bacaan_lengkap: bacaan_lengkap,
    bacaan_teks: textsMap,
    discrape_pada: now,
  };
}

/**
 * Prefetches liturgical data for a batch of days starting from a given date.
 * @param mulai The start date for prefetching.
 * @param jumlahHari The number of days to prefetch.
 */
export async function prefetchLiturgiBatch(mulai: Date, jumlahHari: number): Promise<void> {
  console.log(`Starting prefetch for ${jumlahHari} days from ${format(mulai, 'yyyy-MM-dd')}`);
  const promises: Promise<DataLiturgi>[] = [];
  for (let i = 0; i < jumlahHari; i++) {
    const currentDate = addDays(mulai, i);
    promises.push(getLiturgiHarian(currentDate));
  }
  await Promise.all(promises);
  console.log(`Finished prefetch for ${jumlahHari} days.`);
}