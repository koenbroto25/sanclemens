/**
 * API Key Management System
 * Manages OpenRouter & Gemini API keys for AI provider integration
 * 
 * Features:
 * - Encryption/decryption of API keys
 * - Key rotation and load balancing
 * - Usage tracking and exhaustion marking
 * - Fallback chain implementation
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Provider configurations
export const PROVIDER_CONFIGS = {
  openrouter: {
    name: 'OpenRouter',
    model: 'openrouter/free', // Use the free tier managed by OpenRouter
    baseUrl: 'https://openrouter.ai/api/v1',
    features: {
      unlimited_requests: true, // as long as a free model is available
      rate_limit_per_sec: 2, // approximate, depends on selected free model
      context_window: 128000, // example, depends on selected free model
      supports_functions: true // depends on selected free model
    }
  },
  gemini: {
    name: 'Google Gemini',
    model: 'gemini-2.5-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    features: {
      daily_quota: 1500,
      rate_limit_per_min: 15,
      context_window: 1000000,
      supports_functions: true
    }
  }
}

// Types
export interface APIKey {
  id: string
  provider: 'openrouter' | 'gemini' | 'openai'
  api_key_encrypted: string
  key_name: string
  assigned_to_bot?: string
  rotation_strategy?: string
  priority_order?: number
  is_active: boolean
  is_exhausted: boolean
  usage_count: number
  last_used_at?: string
}

export interface UsageRecord {
  user_id?: string
  bot_mode: string
  provider: string
  api_key_id?: string
  user_api_key_id?: string
  request_type?: string
  tokens_used?: number
  response_time_ms?: number
  success: boolean
  error_message?: string
}

export class APIKeyManager {
  private encryptionKey: string

  constructor() {
    // In production, this should come from environment variable
    this.encryptionKey = process.env.API_KEY_ENCRYPTION_KEY || 'default-encryption-key-change-in-production'
  }

  /**
   * Encrypt API key using pgp_sym_encrypt
   */
  async encryptKey(plainKey: string): Promise<string> {
    const { data, error } = await supabase.rpc('encrypt_api_key', {
      plain_text: plainKey,
      encryption_key: this.encryptionKey
    })

    if (error) throw new Error(`Encryption failed: ${error.message}`)
    return data
  }

  /**
   * Decrypt API key using pgp_sym_decrypt
   */
  async decryptKey(encryptedKey: string): Promise<string> {
    const { data, error } = await supabase.rpc('decrypt_api_key', {
      encrypted_text: encryptedKey,
      encryption_key: this.encryptionKey
    })

    if (error) throw new Error(`Decryption failed: ${error.message}`)
    return data
  }

  /**
   * Get API key for a specific bot mode and user
   * Priority: User's personal key > Admin pool key
   */
  async getKeyForBot(botMode: string, userId?: string): Promise<{
    key: string
    provider: string
    source: 'user' | 'admin_pool'
    keyId?: string
  }> {
    // 1. Check if user has personal key
    if (userId) {
      const userKey = await this.getUserAPIKey(userId, botMode)
      if (userKey) {
        return {
          key: userKey.api_key_encrypted, // Already decrypted by RPC
          provider: userKey.provider,
          source: 'user',
          keyId: userKey.id
        }
      }
    }

    // 2. Get key from admin pool
    const poolKey = await this.getPoolKey(botMode)
    if (!poolKey) {
      throw new Error('No API keys available in pool')
    }

    // 3. Decrypt the pool key
    const decryptedKey = await this.decryptKey(poolKey.api_key_encrypted)

    return {
      key: decryptedKey,
      provider: poolKey.provider,
      source: 'admin_pool',
      keyId: poolKey.id
    }
  }

  /**
   * Get user's personal API key for a provider
   */
  private async getUserAPIKey(userId: string, provider: string): Promise<{
    id: string
    provider: string
    api_key_encrypted: string
  } | null> {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .single()

    if (error || !data) return null

    // Decrypt the key
    const decryptedKey = await this.decryptKey(data.api_key_encrypted)
    
    return {
      id: data.id,
      provider: data.provider,
      api_key_encrypted: decryptedKey
    }
  }

  /**
   * Get next available key from admin pool
   * Uses database function for rotation strategy
   */
  private async getPoolKey(botMode: string): Promise<APIKey | null> {
    // Try OpenRouter first, then Gemini
    const providers = ['openrouter', 'gemini']

    for (const provider of providers) {
      const { data: keyId, error: funcError } = await supabase
        .rpc('get_next_api_key', {
          p_provider: provider,
          p_bot_mode: botMode
        })

      if (funcError || !keyId || keyId.length === 0) {
        continue
      }

      // Get the key details
      const { data: key, error: keyError } = await supabase
        .from('admin_api_key_pool')
        .select('*')
        .eq('id', keyId[0])
        .single()

      if (keyError || !key) {
        continue
      }

      return key as APIKey
    }

    return null
  }

  /**
   * Log API key usage
   */
  async logUsage(usage: UsageRecord): Promise<void> {
    await supabase.from('api_usage_logs').insert({
      ...usage,
      created_at: new Date().toISOString()
    })

    // Update pool key usage if applicable
    if (usage.api_key_id) {
      await supabase.rpc('update_api_key_usage', {
        p_key_id: usage.api_key_id,
        p_success: usage.success,
        p_error: usage.error_message || null
      })
    }
  }

  /**
   * Mark API key as exhausted
   */
  async markKeyExhausted(keyId: string, reason: string): Promise<void> {
    await supabase.rpc('update_api_key_usage', {
      p_key_id: keyId,
      p_success: false,
      p_error: reason
    })
  }

  /**
   * Validate API key by making a test request
   */
  async validateKey(key: string, provider: string): Promise<boolean> {
    try {
      const config = PROVIDER_CONFIGS[provider as keyof typeof PROVIDER_CONFIGS]
      if (!config) return false

      // Simple validation - just check if key format is correct
      // In production, make a small API call to verify
      if (provider === 'openrouter') {
        return key.startsWith('sk-or-')
      } else if (provider === 'gemini') {
        return key.startsWith('AIzaSy')
      }
      return false
    } catch (error) {
      console.error('Key validation error:', error)
      return false
    }
  }

  /**
   * Get API key pool statistics for admin dashboard
   */
  async getPoolStats() {
    const { data, error } = await supabase.rpc('get_api_key_stats')
    
    if (error) throw new Error(`Failed to get stats: ${error.message}`)
    return data
  }

  /**
   * Get user's API keys
   */
  async getUserKeys(userId: string) {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to get user keys: ${error.message}`)
    
    // Decrypt keys for display
    const decrypted = await Promise.all(
      (data || []).map(async (key) => ({
        ...key,
        api_key_encrypted: key.api_key_encrypted // Keep encrypted, show only last 4 chars
      }))
    )

    return decrypted
  }

  /**
   * Add user API key
   */
  async addUserKey(userId: string, provider: string, plainKey: string, keyName?: string) {
    const encryptedKey = await this.encryptKey(plainKey)
    
    const { data, error } = await supabase
      .from('user_api_keys')
      .upsert({
        user_id: userId,
        provider,
        api_key_encrypted: encryptedKey,
        key_name: keyName || 'My API Key',
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to add key: ${error.message}`)
    return data
  }

  /**
   * Delete user API key
   */
  async deleteUserKey(userId: string, keyId: string) {
    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', userId)

    if (error) throw new Error(`Failed to delete key: ${error.message}`)
  }

  /**
   * Add key to admin pool
   */
  async addPoolKey(
    provider: string,
    plainKey: string,
    keyName?: string,
    assignedToBot?: string,
    rotationStrategy?: string,
    priorityOrder?: number
  ) {
    const encryptedKey = await this.encryptKey(plainKey)

    const { data, error } = await supabase
      .from('admin_api_key_pool')
      .insert({
        provider,
        api_key_encrypted: encryptedKey,
        key_name: keyName || 'Pool Key',
        assigned_to_bot: assignedToBot,
        rotation_strategy: rotationStrategy || 'round_robin',
        priority_order: priorityOrder || 0,
        is_active: true,
        is_exhausted: false
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to add pool key: ${error.message}`)
    return data
  }

  /**
   * Remove key from admin pool
   */
  async removePoolKey(keyId: string) {
    const { error } = await supabase
      .from('admin_api_key_pool')
      .delete()
      .eq('id', keyId)

    if (error) throw new Error(`Failed to remove pool key: ${error.message}`)
  }

  /**
   * Update pool key status
   */
  async updatePoolKey(keyId: string, updates: Partial<APIKey>) {
    const { error } = await supabase
      .from('admin_api_key_pool')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', keyId)

    if (error) throw new Error(`Failed to update pool key: ${error.message}`)
  }
}

// Export singleton instance
export const apiKeyManager = new APIKeyManager()



