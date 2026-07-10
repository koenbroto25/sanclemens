import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyApprovalRequired } from '@/lib/notifications/document-notifications';

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

    // Check authorization - only owner or admin can send for approval
    const isAdmin = profile.access_layer >= 4 || profile.role === 'super_admin';
    const isOwner = document.pidu_owner_id === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check document status
    if (document.status !== 'pending_user_verification') {
      return NextResponse.json({ 
        error: 'Document must be in pending_user_verification status to send for approval',
        current_status: document.status 
      }, { status: 400 });
    }

    // Parse request body for approver info
    const body = await request.json();
    const { approver_id, notes } = body;

    // Update document status
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'pending_official_approval',
        verified_by: user.id,
        user_verified_at: new Date().toISOString(),
        approver_id: approver_id || null,
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document status:', updateError);
      return NextResponse.json({ error: 'Failed to update document status' }, { status: 500 });
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'send_for_approval',
      target_type: 'document',
      target_id: documentId,
      metadata: {
        document_id: document.document_id,
        approver_id: approver_id,
        notes: notes || null
      }
    });

    // Send notification to approver if provided
    if (approver_id) {
      await notifyApprovalRequired(
        documentId,
        document.document_id,
        document.document_type_code,
        approver_id
      ).catch((err) => console.error('Error sending approval notification:', err));
    }

    return NextResponse.json({ 
      success: true,
      message: 'Document sent for approval successfully',
      status: 'pending_official_approval',
      approver_id: approver_id
    });

  } catch (error) {
    console.error('Error in POST /api/documents/[id]/send-for-approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}