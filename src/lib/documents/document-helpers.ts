import { createClient } from '@/lib/supabase/server';

export async function getDocumentTypes() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('document_types_registry')
    .select('*')
    .eq('is_active', true)
    .order('document_name', { ascending: true });

  if (error) {
    console.error('Error fetching document types:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}