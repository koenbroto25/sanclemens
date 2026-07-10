import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyDocumentIssued } from '@/lib/notifications/document-notifications';

export async function POST(
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

    // Check authorization - only allow revoke if:
    // 1. User is admin (access_layer >= 9 or super_admin)
    // 2. User is the issuer
    const isAdmin = profile.access_layer >= 9 || profile.role === 'super_admin';
    const isIssuer = document.issued_by === user.id;

    if (!isAdmin && !isIssuer) {
      return NextResponse.json({ 
        error: 'Forbidden - only admin or issuer can revoke' 
      }, { status: 403 });
    }

    // Check if document is already revoked
    if (document.status === 'revoked') {
      return NextResponse.json({ 
        error: 'Document is already revoked' 
      }, { status: 400 });
    }

    // Parse request body for revocation reason
    const body = await request.json();
    const { reason } = body;

    // Update document status to revoked
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
        revocation_reason: reason || 'No reason provided'
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error revoking document:', updateError);
      return NextResponse.json({ error: 'Failed to revoke document' }, { status: 500 });
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'revoke_document',
      target_type: 'document',
      target_id: documentId,
      metadata: {
        document_id: document.document_id,
        reason: reason || 'No reason provided',
        previous_status: document.status
      }
    });

    // Send notification to document owner
    await notifyDocumentIssued(
      documentId,
      document.document_id,
      document.document_type_code,
      document.pidu_owner_id
    ).catch((err) => console.error('Error sending revocation notification:', err));

    return NextResponse.json({ 
      success: true,
      message: 'Document revoked successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/documents/revoke/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}