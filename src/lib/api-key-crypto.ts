/**
 * API Key Encryption Utilities
 * Uses Supabase's pgp_sym_encrypt/pgp_sym_decrypt for secure key storage
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Encrypt plaintext using pgp_sym_encrypt
 */
export async function encryptApiKey(plainText: string, encryptionKey: string): Promise<string> {
  const { data, error } = await supabase.rpc('encrypt_api_key', {
    plain_text: plainText,
    encryption_key: encryptionKey
  })

  if (error) {
    throw new Error(`Encryption failed: ${error.message}`)
  }

  return data
}

/**
 * Decrypt ciphertext using pgp_sym_decrypt
 */
export async function decryptApiKey(encryptedText: string, encryptionKey: string): Promise<string> {
  const { data, error } = await supabase.rpc('decrypt_api_key', {
    encrypted_text: encryptedText,
    encryption_key: encryptionKey
  })

  if (error) {
    throw new Error(`Decryption failed: ${error.message}`)
  }

  return data
}

/**
 * Mask API key for display (show only last 4 characters)
 */
export function maskApiKey(key: string, visibleChars: number = 4): string {
  if (!key || key.length <= visibleChars) {
    return key
  }
  return '*'.repeat(key.length - visibleChars) + key.slice(-visibleChars)
}

/**
 * Validate API key format
 */
export function validateApiKeyFormat(key: string, provider: string): boolean {
  switch (provider) {
    case 'openrouter':
      // OpenRouter keys start with sk-or-
      return key.startsWith('sk-or-') && key.length >= 20
    case 'gemini':
      // Gemini keys start with AIzaSy
      return key.startsWith('AIzaSy') && key.length >= 30
    case 'openai':
      // OpenAI keys start with sk-
      return key.startsWith('sk-') && key.length >= 20
    default:
      return false
  }
}

/**
 * Get encryption key from environment
 * In production, this should be a strong, randomly generated key
 */
export function getEncryptionKey(): string {
  const key = process.env.API_KEY_ENCRYPTION_KEY
  if (!key) {
    throw new Error('API_KEY_ENCRYPTION_KEY environment variable is not set')
  }
  return key
}
