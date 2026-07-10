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

    // Fetch all active document templates
    // All authenticated users can view templates (they need to know what types are available)
    const { data: templates, error: templatesError } = await supabase
      .from('document_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    // Return templates with document type information
    const templatesWithType = await Promise.all(
      templates.map(async (template) => {
        // Get document types using this template
        const { data: docTypes } = await supabase
          .from('document_types_registry')
          .select('document_type_code, document_name')
          .eq('template_id', template.id)
          .eq('is_active', true);

        return {
          ...template,
          document_types: docTypes || []
        };
      })
    );

    return NextResponse.json({ 
      data: templatesWithType,
      count: templatesWithType.length 
    });

  } catch (error) {
    console.error('Error in GET /api/documents/templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Validate authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile - require admin or super_admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, access_layer')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only admin or super_admin can create templates
    const isAdmin = profile.access_layer >= 4 || profile.role === 'super_admin';
    
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Forbidden - only admin can create templates' 
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { name, file_url, template_type } = body;

    // Validate required fields
    if (!name || !file_url) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, file_url' 
      }, { status: 400 });
    }

    // Create template
    const { data: template, error: createError } = await supabase
      .from('document_templates')
      .insert({
        name,
        file_url,
        template_type: template_type || 'pdf',
        created_by: user.id,
      })
      .select('*')
      .single();

    if (createError) {
      console.error('Error creating template:', createError);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'create_document_template',
      target_type: 'document_template',
      target_id: template.id,
      metadata: {
        template_name: name,
        template_type: template_type || 'pdf'
      }
    });

    return NextResponse.json({ 
      success: true,
      data: template,
      message: 'Template created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/documents/templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}