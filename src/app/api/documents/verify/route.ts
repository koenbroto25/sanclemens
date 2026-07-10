import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    // No authentication required for public verification
    const supabase = createClient();

    // Fetch document with issuer info
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select(`
        *,
        issuer:profiles!documents_issued_by_fkey(id, full_name, role),
        verifier:profiles!documents_verified_by_fkey(id, full_name, role),
        approver:profiles!documents_approved_by_fkey(id, full_name, role)
      `)
      .eq('document_id', documentId)
      .single();

    if (documentError || !document) {
      return NextResponse.json({ 
        valid: false,
        error: 'Document not found' 
      }, { status: 404 });
    }

    // Check if document is issued
    const isValid = document.status === 'issued';

    // Return verification info (public information only)
    return NextResponse.json({
      valid: isValid,
      document_id: document.document_id,
      document_type: document.document_type_code,
      issued_at: document.issued_at,
      issued_by: document.issuer ? {
        name: document.issuer.full_name,
        role: document.issuer.role
      } : null,
      verified_at: document.user_verified_at,
      verified_by: document.verifier ? {
        name: document.verifier.full_name,
        role: document.verifier.role
      } : null,
      approved_at: document.approved_at,
      approved_by: document.approver ? {
        name: document.approver.full_name,
        role: document.approver.role
      } : null,
      digital_signature: document.digital_signature,
      // Note: We don't expose pdf_url or sensitive data here
    });

  } catch (error) {
    console.error('Error in GET /api/documents/verify/[id]:', error);
    return NextResponse.json({ 
      valid: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
