import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { r2Client } from '@/lib/r2-client';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const R2_BUCKET = process.env.R2_DOCUMENTS_BUCKET_NAME || 'paroki-klemens-private-docs';

export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const documentType = searchParams.get('documentType');
    const status = searchParams.get('status');

    // Validate authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, access_layer')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    // If user is not admin, only show their own documents
    const isAdmin = profile.access_layer >= 4 || profile.role === 'super_admin';
    
    if (!isAdmin) {
      // Regular user: only their own documents
      query = query.eq('pidu_owner_id', user.id);
    } else {
      // Admin: can filter by userId if provided
      if (userId) {
        query = query.eq('pidu_owner_id', userId);
      }
    }

    // Additional filters
    if (documentType) {
      query = query.eq('document_type_code', documentType);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Execute query
    const { data: documents, error: documentsError } = await query;

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: documents,
      count: documents.length 
    });

  } catch (error) {
    console.error('Error in GET /api/documents:', error);
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

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { document_type_code, template_data, pidu_owner_id } = body;

    // Validate required fields
    if (!document_type_code || !template_data) {
      return NextResponse.json({ 
        error: 'Missing required fields: document_type_code, template_data' 
      }, { status: 400 });
    }

    // Get document type configuration
    const { data: docType, error: docTypeError } = await supabase
      .from('document_types_registry')
      .select('*')
      .eq('document_type_code', document_type_code)
      .eq('is_active', true)
      .single();

    if (docTypeError || !docType) {
      return NextResponse.json({ 
        error: 'Invalid or inactive document type' 
      }, { status: 400 });
    }

    // Check if user has permission to generate this document type
    const hasPermission = (docType.required_roles_to_generate || []).some((role: string) => 
      profile.role === role || profile.access_layer >= 9
    );

    if (!hasPermission) {
      return NextResponse.json({ 
        error: 'You do not have permission to generate this document type' 
      }, { status: 403 });
    }

    // Generate document_id using database function
    const { data: documentId, error: documentIdError } = await supabase.rpc('next_document_id', {
      p_type_code: document_type_code,
      p_env_code: null
    });

    if (documentIdError || !documentId) {
      console.error('Error generating document_id:', documentIdError);
      return NextResponse.json({ error: 'Failed to generate document ID' }, { status: 500 });
    }

    // Determine PIDU owner
    const ownerId = pidu_owner_id || user.id;

    // Initialize document data
    const documentData: any = {
      document_id: documentId,
      document_type_code,
      pidu_owner_id: ownerId,
      status: 'pending_user_verification',
      template_data,
      issued_by: user.id,
      issued_at: new Date().toISOString(),
    };

    // Add legacy_document_id if provided
    if (body.legacy_document_id) {
      documentData.legacy_document_id = body.legacy_document_id;
    }

    // Insert document
    const { data: document, error: insertError } = await supabase
      .from('documents')
      .insert(documentData)
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating document:', insertError);
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
    }

    // Generate PDF (placeholder)
    const pdfContent = generatePlaceholderPDF(document, template_data, docType);
    const pdfKey = `documents/${document.id}/document.pdf`;

    try {
      // Upload to R2
      await r2Client.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: pdfKey,
        Body: pdfContent,
        ContentType: 'application/pdf',
      }));

      // Update document with PDF URL
      const pdfUrl = `${process.env.R2_PUBLIC_URL || ''}/${pdfKey}`;
      const { error: updateError } = await supabase
        .from('documents')
        .update({ pdf_url: pdfUrl })
        .eq('id', document.id);

      if (updateError) {
        console.error('Error updating document with PDF URL:', updateError);
      }

      // Auto-link to profile if configured
      if (docType.number_to_profile_column_name && docType.link_to_profile_column_name) {
        const { error: linkError } = await supabase
          .from('profiles')
          .update({
            [docType.number_to_profile_column_name]: documentId,
            [docType.link_to_profile_column_name]: pdfUrl,
          })
          .eq('id', ownerId);

        if (linkError) {
          console.warn('Failed to auto-link document to profile:', linkError);
        }
      }

      // Trigger auto-link function for additional linking logic
      const { error: autoLinkError } = await supabase.rpc('auto_link_document_to_profile', {
        p_document_id: documentId
      });

      if (autoLinkError) {
        console.warn('Auto-link function error:', autoLinkError);
      }

    } catch (r2Error) {
      console.error('Error uploading PDF to R2:', r2Error);
      // Document is created but PDF upload failed - mark as draft
      const { error: statusUpdateError } = await supabase
        .from('documents')
        .update({ status: 'draft' })
        .eq('id', document.id);

      if (statusUpdateError) {
        console.error('Error updating document status:', statusUpdateError);
      }

      return NextResponse.json({ 
        error: 'Document created but PDF upload failed',
        documentId: document.id,
        document_id: documentId
      }, { status: 500 });
    }

    // Log audit trail
    if (docType.audit_log_enabled) {
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'create_document',
        target_type: 'document',
        target_id: document.id,
        metadata: {
          document_id: documentId,
          document_type: document_type_code,
          issued_by: profile.role,
          pidu_owner_id: ownerId,
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      data: document,
      message: 'Document created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to generate placeholder PDF
function generatePlaceholderPDF(document: any, templateData: any, docType: any): Buffer {
  const content = `
DOKUMEN DIGITAL PAROKI SANTO KLEMENS
=====================================

Jenis Dokumen: ${docType.document_name}
Nomor Dokumen: ${document.document_id}
Tanggal Terbit: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })}

=====================================
DATA DOKUMEN:
${JSON.stringify(templateData, null, 2)}

=====================================
CATATAN:
Ini adalah dokumen digital resmi yang diterbitkan oleh sistem Paroki Santo Klemens.
Dokumen ini memiliki tanda tangan digital dan jejak audit yang tidak bisa disangkal.

Untuk verifikasi autentisitas, silakan scan QR code yang tersedia di versi PDF lengkap.
  `;

  return Buffer.from(content, 'utf-8');
}