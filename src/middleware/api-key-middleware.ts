/**
 * API Key Middleware for Bot System
 * Injects the appropriate API key into LLM provider calls
 * Priority: User's personal key > Admin pool key
 * Fallback chain: OpenRouter > Gemini > Next available > Degraded mode
 */

import { apiKeyManager, PROVIDER_CONFIGS } from '@/lib/api-key-manager'
import { maskApiKey } from '@/lib/api-key-crypto'

export interface APIKeyResult {
  key: string
  provider: string
  source: 'user' | 'admin_pool'
  keyId?: string
  model: string
  baseUrl: string
  isFallback: boolean
}

/**
 * Get API key for a bot request with fallback chain
 */
export async function getAPIKeyForBot(
  botMode: string,
  userId?: string
): Promise<APIKeyResult> {
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 1. Try to get key from user or admin pool
      const result = await apiKeyManager.getKeyForBot(botMode, userId)
      
      const providerConfig = PROVIDER_CONFIGS[result.provider as keyof typeof PROVIDER_CONFIGS]
      
      return {
        key: result.key,
        provider: result.provider,
        source: result.source,
        keyId: result.keyId,
        model: providerConfig.model,
        baseUrl: providerConfig.baseUrl,
        isFallback: attempt > 0
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
    }
  }

  // 2. Last resort: use environment fallback key (if configured)
  const fallbackKey = process.env.LLM_FALLBACK_API_KEY
  const fallbackProvider = process.env.LLM_FALLBACK_PROVIDER || 'openrouter'

  if (fallbackKey) {
    const providerConfig = PROVIDER_CONFIGS[fallbackProvider as keyof typeof PROVIDER_CONFIGS]
    return {
      key: fallbackKey,
      provider: fallbackProvider,
      source: 'admin_pool',
      model: providerConfig.model,
      baseUrl: providerConfig.baseUrl,
      isFallback: true
    }
  }

  throw lastError || new Error('No API keys available')
}

/**
 * Call LLM provider with automatic API key injection
 */
export async function callLLMWithAPIKey(
  messages: any[],
  botMode: string,
  userId?: string,
  options?: {
    temperature?: number
    maxTokens?: number
  }
): Promise<{
  content: string
  usage: { prompt_tokens: number; completion_tokens: number }
  provider: string
  keySource: string
}> {
  const startTime = Date.now()

  try {
    // 1. Get the appropriate API key
    const { key, provider, model, baseUrl, source, keyId, isFallback } = 
      await getAPIKeyForBot(botMode, userId)

    // 2. Build the request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    let endpoint: string
    let body: any

    if (provider === 'openrouter') {
      headers['Authorization'] = `Bearer ${key}`
      headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'https://paroki-stklemens.com'
      headers['X-Title'] = 'Paroki StKlemens AI'
      endpoint = `${baseUrl}/chat/completions`
      body = {
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096
      }
    } else if (provider === 'gemini') {
      endpoint = `${baseUrl}/models/${model}:generateContent?key=${key}`
      body = {
        contents: messages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 4096
        }
      }
    } else {
      throw new Error(`Unsupported provider: ${provider}`)
    }

    // 3. Make the API call
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      
      // If rate limited or quota exhausted, mark key and retry
      if (response.status === 429 || response.status === 403) {
        if (keyId && source === 'admin_pool') {
          await apiKeyManager.markKeyExhausted(keyId, errorText)
        }
        // Retry with fallback
        const fallbackResult = await getAPIKeyForBot(botMode, userId)
        return await callLLMWithAPIKey(messages, botMode, userId, options)
      }

      throw new Error(`Provider error (${response.status}): ${errorText}`)
    }

    const data = await response.json()

    // 4. Extract response based on provider
    let content: string
    let usage: { prompt_tokens: number; completion_tokens: number }

    if (provider === 'openrouter') {
      content = data.choices?.[0]?.message?.content || ''
      usage = {
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0
      }
    } else if (provider === 'gemini') {
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      usage = {
        prompt_tokens: 0, // Gemini doesn't always report this
        completion_tokens: 0
      }
    } else {
      throw new Error(`Unsupported provider: ${provider}`)
    }

    // 5. Log usage
    const responseTime = Date.now() - startTime
    await apiKeyManager.logUsage({
      user_id: userId,
      bot_mode: botMode,
      provider,
      api_key_id: source === 'admin_pool' ? keyId : undefined,
      tokens_used: usage.prompt_tokens + usage.completion_tokens,
      response_time_ms: responseTime,
      success: true
    })

    // Warn if using fallback
    if (isFallback) {
      console.warn(`⚠️ Using fallback API key for ${botMode}! Source: ${source}`)
    }

    return {
      content,
      usage,
      provider,
      keySource: source
    }

  } catch (error) {
    // Log failed attempt
    const responseTime = Date.now() - startTime
    await apiKeyManager.logUsage({
      user_id: userId,
      bot_mode: botMode,
      provider: 'unknown',
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error',
      response_time_ms: responseTime
    })

    throw error
  }
}

/**
 * Simple rate limiter for API keys
 * Returns time to wait before next request (in ms)
 */
export async function getRateLimitWait(
  provider: string,
  botMode: string
): Promise<number> {
  const config = PROVIDER_CONFIGS[provider as keyof typeof PROVIDER_CONFIGS]
  if (!config) return 0

  // For OpenRouter: 2 req/sec = 500ms between requests
  if (provider === 'openrouter') {
    return Math.ceil(1000 / (config.features as any).rate_limit_per_sec)
  }

  // For Gemini: 15 req/min = 4000ms between requests
  if (provider === 'gemini') {
    return Math.ceil(60000 / (config.features as any).rate_limit_per_min)
  }

  return 0
}
