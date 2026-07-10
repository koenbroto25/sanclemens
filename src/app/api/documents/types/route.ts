import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    // Validate authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, access_layer')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch all active document types
    const { data: docTypes, error: docTypesError } = await supabase
      .from('document_types_registry')
      .select('*')
      .eq('is_active', true)
      .order('document_name', { ascending: true });

    if (docTypesError) {
      console.error('Error fetching document types:', docTypesError);
      return NextResponse.json({ error: 'Failed to fetch document types' }, { status: 500 });
    }

    // Filter based on user role
    const filteredDocTypes = docTypes.filter(docType => {
      // Check if user has permission to see this document type
      // Users can see document types they can potentially request or that are visible to their role
      const isPublic = docType.visibility_roles.includes('umat');
      const isAdmin = profile.access_layer >= 4 || profile.role === 'super_admin';
      const hasAccess = docType.required_roles_to_generate.some((role: string) => 
        profile.role === role || profile.access_layer >= 9
      );

      return isPublic || isAdmin || hasAccess;
    });

    return NextResponse.json({ 
      data: filteredDocTypes,
      count: filteredDocTypes.length 
    });

  } catch (error) {
    console.error('Error in GET /api/documents/types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}