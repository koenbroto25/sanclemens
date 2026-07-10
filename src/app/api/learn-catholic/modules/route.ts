export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const include_content = searchParams.get('include_content') === 'true';
    const module_code = searchParams.get('module_code');

    const { data: user } = await supabase.auth.getUser();
    const isAuthenticated = !!user.user;

    const selectFields = `
      id,
      module_code,
      title,
      description,
      source_document,
      difficulty_level,
      estimated_duration_minutes,
      sequence_order,
      prerequisite_modules,
      is_published,
      is_public_preview
      ${include_content ? ', learning_content(id, content_type, content_data, sequence_order)' : ''}
    `;

    let baseQuery = supabase.from('learning_modules').select(selectFields);

    // Public users can only see published modules or those marked for public preview
    if (!isAuthenticated) {
      baseQuery = baseQuery.or('is_published.eq.true,is_public_preview.eq.true');
    }

    let modules: any;
    let error: any;

    if (module_code) {
      const result = await baseQuery.eq('module_code', module_code).single();
      modules = result.data;
      error = result.error;
    } else {
      const result = await baseQuery.order('sequence_order', { ascending: true });
      modules = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error fetching learning modules:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (module_code && !modules) {
        return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json({ data: modules, success: true });

  } catch (error) {
    console.error('Server error in GET /api/learn-catholic/modules:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}