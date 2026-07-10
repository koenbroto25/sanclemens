import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { r2Client } from '@/lib/r2-client';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const R2_BUCKET = process.env.R2_DOCUMENTS_BUCKET_NAME || 'paroki-klemens-private-docs';

export async function POST(request: Request) {
  try {
    // Validate authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile - require super_admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, access_layer')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only super_admin can bulk generate
    if (profile.role !== 'super_admin' && profile.access_layer < 10) {
      return NextResponse.json({ 
        error: 'Forbidden - only super_admin can bulk generate documents' 
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { documents, template_data_override } = body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json({ 
        error: 'Missing or invalid documents array' 
      }, { status: 400 });
    }

    // Limit bulk operation to 100 documents at a time
    if (documents.length > 100) {
      return NextResponse.json({ 
        error: 'Maximum 100 documents per bulk operation' 
      }, { status: 400 });
    }

    const results = [];
    const errors = [];

    // Process each document
    for (const docRequest of documents) {
      try {
        const {
          document_type_code,
          pidu_owner_id,
          template_data,
          legacy_document_id
        } = docRequest;

        if (!document_type_code || !pidu_owner_id || !template_data) {
          errors.push({
            request: docRequest,
            error: 'Missing required fields: document_type_code, pidu_owner_id, template_data'
          });
          continue;
        }

        // Get document type configuration
        const { data: docType, error: docTypeError } = await supabase
          .from('document_types_registry')
          .select('*')
          .eq('document_type_code', document_type_code)
          .eq('is_active', true)
          .single();

        if (docTypeError || !docType) {
          errors.push({
            request: docRequest,
            error: 'Invalid or inactive document type'
          });
          continue;
        }

        // Generate document_id
        const { data: documentId, error: documentIdError } = await supabase.rpc('next_document_id', {
          p_type_code: document_type_code,
          p_env_code: null // Bulk operation typically doesn't specify environment
        });

        if (documentIdError || !documentId) {
          errors.push({
            request: docRequest,
            error: 'Failed to generate document ID'
          });
          continue;
        }

        // Merge template data with override if provided
        const finalTemplateData = template_data_override 
          ? { ...template_data, ...template_data_override }
          : template_data;

        // Initialize document data
        const documentData: any = {
          document_id: documentId,
          document_type_code,
          pidu_owner_id,
          status: 'pending_user_verification',
          template_data: finalTemplateData,
          issued_by: user.id,
          issued_at: new Date().toISOString(),
        };

        if (legacy_document_id) {
          documentData.legacy_document_id = legacy_document_id;
        }

        // Insert document
        const { data: document, error: insertError } = await supabase
          .from('documents')
          .insert(documentData)
          .select('*')
          .single();

        if (insertError) {
          errors.push({
            request: docRequest,
            error: `Failed to create document: ${insertError.message}`
          });
          continue;
        }

        // Generate PDF (placeholder)
        const pdfContent = generatePlaceholderPDF(document, finalTemplateData, docType);
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
              .eq('id', pidu_owner_id);

            if (linkError) {
              console.warn('Failed to auto-link document to profile:', linkError);
            }
          }

          results.push({
            success: true,
            document_id: documentId,
            document_uuid: document.id,
            pidu_owner_id: pidu_owner_id
          });

          // Log audit trail
          if (docType.audit_log_enabled) {
            await supabase.from('audit_logs').insert({
              actor_id: user.id,
              action: 'bulk_create_document',
              target_type: 'document',
              target_id: document.id,
              metadata: {
                document_id: documentId,
                document_type: document_type_code,
                bulk_operation: true,
                pidu_owner_id: pidu_owner_id,
              }
            });
          }

        } catch (r2Error) {
          const errorMessage = r2Error instanceof Error ? r2Error.message : String(r2Error);
          console.error('Error uploading PDF to R2:', r2Error);
          errors.push({
            request: docRequest,
            error: `PDF upload failed: ${errorMessage}`
          });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error processing document in bulk:', error);
        errors.push({
          request: docRequest,
          error: errorMessage
        });
      }
    }

    // Return summary
    return NextResponse.json({
      success: true,
      message: `Bulk operation completed: ${results.length} succeeded, ${errors.length} failed`,
      results: {
        succeeded: results,
        failed: errors,
        total_requested: documents.length,
        total_succeeded: results.length,
        total_failed: errors.length
      }
    });

  } catch (error) {
    console.error('Error in POST /api/documents/admin/bulk:', error);
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