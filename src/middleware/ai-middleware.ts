/**
 * AI Middleware for API key rotation, rate limiting, and request validation
 * Part of AI v6.0 architecture
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// API Key pool for rotation
let currentKeyIndex = 0;
let keyPool: string[] = [];

/**
 * Initialize API key pool from environment variables
 */
export function initializeKeyPool() {
  const keys: string[] = [];
  
  // Load up to 150 API keys from environment
  for (let i = 1; i <= 150; i++) {
    const key = process.env[`GOOGLE_API_KEY_${i}`];
    if (key) {
      keys.push(key);
    }
  }

  // Fallback to single key if pool not configured
  if (keys.length === 0 && process.env.GOOGLE_API_KEY_1) {
    keys.push(process.env.GOOGLE_API_KEY_1);
  }

  keyPool = keys;
  currentKeyIndex = 0;

  return keys.length;
}

/**
 * Get next API key from pool (round-robin with health check)
 */
export function getNextApiKey(): string | null {
  if (keyPool.length === 0) {
    initializeKeyPool();
  }

  if (keyPool.length === 0) {
    return null;
  }

  const key = keyPool[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % keyPool.length;

  return key;
}

/**
 * Rate limiting middleware
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * AI Middleware - wraps API route handlers
 */
export function withAIMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    rateLimit?: number;
    windowMs?: number;
    requireAuth?: boolean;
  } = {}
) {
  return async (req: NextRequest) => {
    const {
      rateLimit = 100,
      windowMs = 60000,
      requireAuth = false
    } = options;

    // Initialize key pool if needed
    if (keyPool.length === 0) {
      initializeKeyPool();
    }

    // Rate limiting by IP
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip, rateLimit, windowMs)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Add API key to request headers for downstream use
    const apiKey = getNextApiKey();
    if (apiKey) {
      req.headers.set('x-ai-api-key', apiKey);
    }

    // Continue to handler
    return handler(req);
  };
}

/**
 * Validate request body for AI endpoints
 */
export function validateAIRequest(body: any): { valid: boolean; error?: string } {
  if (!body) {
    return { valid: false, error: 'Request body is required' };
  }

  if (typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  // Common validations
  if (body.bot_id && typeof body.bot_id !== 'string') {
    return { valid: false, error: 'bot_id must be a string' };
  }

  if (body.message && typeof body.message !== 'string') {
    return { valid: false, error: 'message must be a string' };
  }

  if (body.message && body.message.length > 10000) {
    return { valid: false, error: 'Message too long (max 10000 characters)' };
  }

  return { valid: true };
}

/**
 * Log AI usage metrics
 */
export function logAIUsage(metrics: {
  userId?: string;
  botId: string;
  tokensUsed?: number;
  retrievalPath: string;
  success: boolean;
  latency: number;
}) {
  // In production, send to analytics service
  console.log('[AI Usage]', JSON.stringify(metrics));
}