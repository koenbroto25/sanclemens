import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or Service Role Key is missing from environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface BibleText {
  reference: string;
  text: string | null;
  found: boolean;
}

export async function getBibleText(reference: string): Promise<BibleText> {
  try {
    // Normalize reference: "Am 9, 11-15" or "Mt 9, 14-17" -> search by text content
    const { data, error } = await supabase
      .from('theology_references')
      .select('teks')
      .ilike('teks', `%${reference}%`)
      .eq('kategori', 'kitab_suci')
      .limit(1);

    if (error) {
      console.error(`Error fetching Bible text for ${reference}:`, error.message);
      return { reference, text: null, found: false };
    }

    if (data && data.length > 0) {
      return { reference, text: data[0].teks, found: true };
    }

    // Fallback: search by document_code derived from reference
    const parts = reference.split(' ');
    const bookAbbr = parts[0].toUpperCase();
    const bookCode = `KS_${bookAbbr}`;

    const { data: data2, error: error2 } = await supabase
      .from('theology_references')
      .select('teks')
      .ilike('document_code', `%${bookCode}%`)
      .limit(1);

    if (error2 || !data2 || data2.length === 0) {
      console.warn(`Bible text not found for reference: ${reference}`);
      return { reference, text: null, found: false };
    }

    return { reference, text: data2[0].teks, found: true };
  } catch (err) {
    console.error(`Unexpected error in getBibleText for ${reference}:`, err);
    return { reference, text: null, found: false };
  }
}