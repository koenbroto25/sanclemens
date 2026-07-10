export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';

// Simple in-memory cache to avoid hammering upstream on rate-limit
let cachedResponse: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET() {
  const now = Date.now();

  // Serve cache if available and fresh
  if (cachedResponse && now - cachedResponse.timestamp < CACHE_TTL) {
    return NextResponse.json(cachedResponse.data);
  }

  try {
    const today = new Date();
    const year = today.getFullYear();

    const url = `https://litcal.johnromanodorazio.com/api/dev/calendar?year=${year}&locale=la`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        // Do NOT use `next.revalidate` here â€” we handle caching manually
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const status = res.status;
      // 429 Too Many Requests: serve stale cache or fallback silently
      if (status === 429) {
        if (cachedResponse) return NextResponse.json(cachedResponse.data);
        return NextResponse.json({ litcal: [] }, { status: 200 });
      }
      throw new Error(`Upstream HTTP ${status}`);
    }

    const data = await res.json();
    cachedResponse = { data, timestamp: now };
    return NextResponse.json(data);
  } catch (error) {
    // On network errors, serve stale cache if available
    if (cachedResponse) return NextResponse.json(cachedResponse.data);
    // Otherwise return empty litcal so client fallback applies
    return NextResponse.json({ litcal: [] }, { status: 200 });
  }
}
