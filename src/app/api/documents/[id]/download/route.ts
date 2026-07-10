import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { r2Client } from '@/lib/r2-client';
import { GetObjectCommand } from '@aws-sdk/client-s3';

const R2_BUCKET = process.env.R2_DOCUMENTS_BUCKET_NAME || 'paroki-klemens-private-docs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

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

    // Fetch document
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (documentError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check authorization
    const isAdmin = profile.access_layer >= 4 || profile.role === 'super_admin';
    const isOwner = document.pidu_owner_id === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check document status
    if (document.status !== 'issued') {
      return NextResponse.json({ 
        error: 'Document is not available for download',
        status: document.status 
      }, { status: 403 });
    }

    // Check if PDF URL exists
    if (!document.pdf_url) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    // Extract R2 key from pdf_url
    // Assuming pdf_url format: https://.../documents/{id}/document.pdf
    const r2Key = document.pdf_url.split('/').slice(-2).join('/');
    
    try {
      // Fetch from R2
      const response = await r2Client.send(new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
      }));

      if (!response.Body) {
        throw new Error('Empty PDF content');
      }

      // Convert stream to buffer
      const buffer = Buffer.from(await response.Body.transformToByteArray());
      
      // Return PDF with appropriate headers
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${document.document_id}.pdf"`,
          'X-Document-ID': document.document_id,
          'X-Document-Type': document.document_type_code,
        },
      });

    } catch (r2Error) {
      console.error('Error fetching PDF from R2:', r2Error);
      return NextResponse.json({ error: 'Failed to fetch PDF from storage' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in GET /api/documents/[id]/download:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}