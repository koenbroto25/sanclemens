import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Document ID required. Use /api/documents/verify/[id]' }, { status: 400 });
}