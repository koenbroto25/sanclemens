import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyDocumentIssued, notifyApprovalRequired } from '@/lib/notifications/document-notifications';

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

    // Check if document is in pending_official_approval status
    if (document.status !== 'pending_official_approval') {
      return NextResponse.json({ 
        error: 'Document must be in pending_official_approval status',
        current_status: document.status 
      }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { action, notes } = body; // action: 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be "approve" or "reject"' 
      }, { status: 400 });
    }

    // Check authorization - only specified approver or admin can approve/reject
    const isAdmin = profile.access_layer >= 9 || profile.role === 'super_admin';
    const isApprover = document.approver_id === user.id;

    if (!isApprover && !isAdmin) {
      return NextResponse.json({ 
        error: 'Forbidden - only designated approver or admin can approve/reject' 
      }, { status: 403 });
    }

    // Update document based on action
    const updateData: any = {
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      approval_notes: notes || null,
    };

    if (action === 'approve') {
      updateData.status = 'issued';
      updateData.issued_by = document.issued_by; // Keep original issuer
      updateData.issued_at = document.issued_at; // Keep original issue date
    } else {
      updateData.status = 'draft'; // Revert to draft for revision
      updateData.approver_id = null; // Clear approver to allow reassignment
    }

    const { error: updateError } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document:', updateError);
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }

    // If approved, trigger auto-link to profile
    if (action === 'approve') {
      const { error: autoLinkError } = await supabase.rpc('auto_link_document_to_profile', {
        p_document_id: document.document_id
      });

      if (autoLinkError) {
        console.warn('Auto-link function error:', autoLinkError);
      }
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: action === 'approve' ? 'approve_document' : 'reject_document',
      target_type: 'document',
      target_id: documentId,
      metadata: {
        document_id: document.document_id,
        action: action,
        notes: notes || null,
        previous_status: 'pending_official_approval',
        new_status: updateData.status
      }
    });

    // Send notification to document owner and issuer
    if (action === 'approve') {
      // Notify document owner
      await notifyDocumentIssued(
        documentId,
        document.document_id,
        document.document_type_code,
        document.pidu_owner_id
      );
      
      // Notify issuer
      if (document.issued_by && document.issued_by !== document.pidu_owner_id) {
        await notifyDocumentIssued(
          documentId,
          document.document_id,
          document.document_type_code,
          document.issued_by
        );
      }
    } else {
      // Notify owner about rejection
      await notifyDocumentIssued(
        documentId,
        document.document_id,
        document.document_type_code,
        document.pidu_owner_id
      ).catch(() => {});
    }

    return NextResponse.json({ 
      success: true,
      message: `Document ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      status: updateData.status
    });

  } catch (error) {
    console.error('Error in POST /api/documents/[id]/approve:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}