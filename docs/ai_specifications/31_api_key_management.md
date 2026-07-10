# BAB XXXI — API Key Management System: OpenRouter & Gemini Integration

## 31.1 Overview

Sistem manajemen API key mengintegrasikan **OpenRouter** (`openrouter/free`) dan **Google Gemini Flash 2.5** (free tier) untuk memberikan akses AI yang berkelanjutan tanpa biaya operasional bagi paroki.

### Konsep Dasar:
- **Dual Provider Strategy**: Kombinasi OpenRouter + Gemini untuk redundancy dan load balancing
- **Shared Pool Model**: Admin memasukkan API keys (5-20 keys) yang dibagi untuk semua bot
- **Personal Key Option**: User dapat memasukkan API key pribadi untuk unlimited access
- **Zero Cost**: Kedua provider memiliki free tier yang cukup untuk kebutuhan paroki

---

## 31.2 Provider Configuration

### 31.2.1 OpenRouter (`openrouter/free`)

**Provider Details:**
- **Model**: `openrouter/free` (managed by OpenRouter, auto-selects available free models)
- **Cost**: Free (no daily limit, rate limited by underlying model)
- **Rate Limit**: Varies by underlying model, typically ~2-3 req/sec per key
- **Use Case**: Primary provider untuk public bots (Bot 1, Bot 2)
- **Advantage**: Always free, self-healing against individual model quota exhaustion

**Configuration:**
```typescript
{
  provider: 'openrouter',
  model: 'openrouter/free',
  base_url: 'https://openrouter.ai/api/v1',
  features: {
    unlimited_requests: true, // as long as a free model is available
    rate_limit_per_sec: 2, // approximate, depends on selected free model
    context_window: 128000, // example, depends on selected free model
    supports_functions: true // depends on selected free model
  }
}
```

### 31.2.2 Google Gemini Flash 2.5 (Free Tier)

**Provider Details:**
- **Model**: `gemini-2.5-flash`
- **Cost**: Free tier
- **Quota**: 1,500 requests/day + 15 req/min
- **Use Case**: Secondary provider untuk companion bots (Bot 3), fallback untuk OpenRouter
- **Advantage**: Higher quality, faster response, better theological reasoning

**Configuration:**
```typescript
{
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  base_url: 'https://generativelanguage.googleapis.com/v1beta',
  features: {
    daily_quota: 1500,
    rate_limit_per_min: 15,
    context_window: 1000000,
    supports_functions: true
  }
}
```

### 31.2.3 Fallback Chain

```
Primary: OpenRouter (openrouter/free)
    ↓ (if rate limited / error from selected free model)
Secondary: Gemini Flash 2.5
    ↓ (if quota exhausted)
Tertiary: Next OpenRouter key from pool (re-attempt with openrouter/free)
    ↓ (if all keys exhausted)
Fallback: User's personal key (if available)
    ↓ (if no personal key)
Degraded Mode: "Mohon maaf, sistem AI sedang sibuk. Coba lagi dalam 1 menit."
```

---

## 31.3 Database Schema

### 31.3.1 User API Keys Table

```sql
CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('openrouter', 'gemini', 'openai')),
    api_key_encrypted TEXT NOT NULL,
    key_name VARCHAR(100) DEFAULT 'My API Key',
    is_active BOOLEAN DEFAULT TRUE,
    last_validated_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, provider)
);

-- Index for fast lookup
CREATE INDEX idx_user_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX idx_user_api_keys_provider ON public.user_api_keys(provider);

-- RLS
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API keys"
    ON public.user_api_keys FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

### 31.3.2 Admin API Key Pool Table

```sql
CREATE TABLE IF NOT EXISTS public.admin_api_key_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('openrouter', 'gemini', 'openai')),
    api_key_encrypted TEXT NOT NULL,
    key_name VARCHAR(100) DEFAULT 'Pool Key',
    assigned_to_bot VARCHAR(50), -- 'bot_public', 'bot_companion', 'bot_administrative', null=all
    rotation_strategy VARCHAR(50) DEFAULT 'round_robin' 
        CHECK (rotation_strategy IN ('round_robin', 'least_used', 'random', 'priority')),
    priority_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_exhausted BOOLEAN DEFAULT FALSE,
    last_error TEXT,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_api_key_pool_provider ON public.admin_api_key_pool(provider);
CREATE INDEX idx_admin_api_key_pool_assigned_bot ON public.admin_api_key_pool(assigned_to_bot);
CREATE INDEX idx_admin_api_key_pool_active ON public.admin_api_key_pool(is_active, is_exhausted);

-- RLS
ALTER TABLE public.admin_api_key_pool ENABLE ROW LEVEL SECURITY;

-- Only super_admin and admin_ict can manage
CREATE POLICY "Super admin can manage API key pool"
    ON public.admin_api_key_pool FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('super_admin', 'operator_ict')
        )
    );
```

### 31.3.3 API Usage Logs Table

```sql
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    bot_mode VARCHAR(50),
    provider VARCHAR(50) NOT NULL,
    api_key_id UUID REFERENCES public.admin_api_key_pool(id) ON DELETE SET NULL,
    user_api_key_id UUID REFERENCES public.user_api_keys(id) ON DELETE SET NULL,
    request_type VARCHAR(50), -- 'chat', 'retrieval', 'embedding'
    tokens_used INTEGER,
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_usage_logs_user_id ON public.api_usage_logs(user_id);
CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs(created_at);
CREATE INDEX idx_api_usage_logs_provider ON public.api_usage_logs(provider);

-- RLS
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
    ON public.api_usage_logs FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage"
    ON public.api_usage_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND access_layer >= 5
        )
    );
```

---

## 31.4 Backend Implementation

### 31.4.1 Core API Key Manager

**File:** `src/lib/api-key-manager.ts`

**Responsibilities:**
- Encrypt/decrypt API keys (using Supabase pgcrypto)
- Select appropriate key based on strategy
- Track usage and mark exhausted keys
- Implement fallback chain
- Log all usage

**Key Functions:**
```typescript
class APIKeyManager {
  // Encryption
  async encryptKey(plainKey: string): Promise<string>
  async decryptKey(encryptedKey: string): Promise<string>
  
  // Key Selection
  async getKeyForBot(botMode: string, userId?: string): Promise<APIKey>
  async getNextKey(provider: string, strategy: string): Promise<APIKey>
  
  // Usage Tracking
  async logUsage(usage: UsageRecord): Promise<void>
  async markKeyExhausted(keyId: string, reason: string): Promise<void>
  
  // Validation
  async validateKey(key: string, provider: string): Promise<boolean>
}
```

### 31.4.2 Middleware Integration

**File:** `src/middleware/api-key-middleware.ts`

**Integration Points:**
1. **Knowledge Retriever API** - Inject API key based on bot mode
2. **Bot Chat API** - Select key per request
3. **User Settings API** - Validate personal keys

**Flow:**
```typescript
export async function withAPIKey(req: Request, botMode: string) {
  // 1. Check if user provided personal key
  const userKey = await getUserAPIKey(req.user.id)
  
  if (userKey) {
    // Use user's key directly
    return { key: userKey, provider: userKey.provider }
  }
  
  // 2. Get key from admin pool
  const poolKey = await getPoolKey(botMode)
  
  if (!poolKey) {
    throw new Error('No API keys available')
  }
  
  // 3. Log usage
  await logKeyUsage(poolKey.id, botMode)
  
  return { key: poolKey, provider: poolKey.provider }
}
```

---

## 31.5 User Interface Specifications

### 31.5.1 Admin API Key Management Page

**Location:** `app/admin/settings/api-keys/page.tsx`

**Features:**
1. **Add API Key Form**
   - Provider selection (OpenRouter / Gemini)
   - API key input (password field)
   - Key label (optional)
   - Bot assignment (which bot uses this key)
   - Priority order

2. **Key Pool Dashboard**
   - Table showing all keys
   - Columns: Provider, Label, Assigned Bot, Usage Count, Last Used, Status, Actions
   - Filters: By provider, by bot, by status
   - Search: By key name

3. **Usage Statistics**
   - Chart: Requests per day per provider
   - Table: Top 10 most used keys
   - Metrics: Total requests, avg response time, error rate
   - Cost savings: "You saved $X by using free tiers"

4. **Rotation Settings**
   - Strategy: Round Robin / Least Used / Random / Priority
   - Auto-disable threshold: Mark key as exhausted after X failures
   - Alert: Email notification when pool < 3 keys

### 31.5.2 User Settings Page

**Location:** `app/(dashboard)/settings/api-keys/page.tsx`

**Features:**
1. **Personal API Key Input**
   - OpenRouter key input with validation button
   - Gemini key input with validation button
   - Show/hide toggle for key visibility
   - Delete key button

2. **Technical Guide Modal**
   - Step-by-step screenshots
   - Links to OpenRouter dashboard
   - Links to Google AI Studio
   - FAQ: "Is it safe?", "How much does it cost?", "What if quota runs out?"

3. **Benefits Section**
   ```
   "Dengan API key pribadi Anda:
   - Akses unlimited (dengan rate limit provider)
   - Prioritas tinggi
   - Tidak membebani paroki
   - Privasi terjaga"
   ```

---

## 31.6 API Integration Pattern

### 31.6.1 Request Flow

```typescript
async function callLLMProvider(messages: Message[], botMode: string, userId?: string) {
  try {
    // 1. Get API key
    const { key, provider } = await APIKeyManager.getKeyForBot(botMode, userId)
    
    // 2. Call provider
    const response = await fetch(provider.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: provider.model,
        messages: messages,
        // ... other params
      })
    })
    
    // 3. Log success
    await APIKeyManager.logUsage({
      user_id: userId,
      bot_mode: botMode,
      provider: provider.name,
      success: true,
      tokens_used: response.usage.total_tokens
    })
    
    return await response.json()
    
  } catch (error) {
    // 4. Mark key as exhausted if quota/rate limit
    if (isQuotaError(error)) {
      await APIKeyManager.markKeyExhausted(key.id, error.message)
    }
    
    // 5. Retry with next key
    return await callLLMProvider(messages, botMode, userId)
  }
}
```

### 31.6.2 Response Format

```typescript
interface LLMResponse {
  content: string
  provider: string
  model: string
  api_key_source: 'user' | 'admin_pool'
  pool_key_id?: string
  tokens_used: number
  response_time_ms: number
}
```

---

## 31.7 Security & Privacy

### 31.7.1 Encryption

- **At Rest**: API keys encrypted using `pgp_sym_encrypt` with server-side encryption key
- **In Transit**: Always HTTPS
- **In Memory**: Decrypted only when needed, immediately discarded after use
- **Admin Access**: Admins can manage keys but cannot view plaintext

### 31.7.2 Access Control

```sql
-- Users can only manage their own keys
CREATE POLICY "Users can manage own API keys"
    ON public.user_api_keys FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Super admin and ICT can manage pool
CREATE POLICY "Admins can manage pool"
    ON public.admin_api_key_pool FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('super_admin', 'operator_ict')
        )
    );
```

### 31.7.3 Audit Trail

- All key usage logged in `api_usage_logs`
- Track: who, when, which bot, which provider, success/failure
- Admin can view aggregated stats (cannot see individual user keys)

---

## 31.8 Cost Analysis & Benefits

### 31.8.1 Free Tier Limits

| Provider | Model | Free Quota | Est. Coverage |
|----------|-------|------------|---------------|
| OpenRouter | GLM-4.5-Air | Unlimited req | Primary (unlimited) |
| Google | Gemini Flash 2.5 | 1,500/day | Secondary (high quality) |

### 31.8.2 Usage Scenarios

**Scenario A: Small Parish (50 active users)**
- Avg 5 messages/user/day = 250 requests/day
- **Coverage**: 1 OpenRouter key unlimited + 1 Gemini key (1,500/day) = MORE THAN ENOUGH
- **Cost**: $0/month

**Scenario B: Medium Parish (200 active users)**
- Avg 10 messages/user/day = 2,000 requests/day
- **Coverage**: 5 OpenRouter keys (500 each) + 2 Gemini keys (750 each) = COMFORTABLE
- **Cost**: $0/month

**Scenario C: Large Parish (500+ users)**
- Avg 15 messages/user/day = 7,500 requests/day
- **Coverage**: 10 OpenRouter keys + 5 Gemini keys = ADEQUATE
- **Cost**: $0/month

### 31.8.3 Benefits

1. **Zero Operational Cost**: Both providers offer generous free tiers
2. **Redundancy**: If one provider is down, other covers
3. **Scalability**: Easy to add more keys as user base grows
4. **Privacy**: Users can use personal keys (parish never sees them)
5. **Sustainability**: No monthly AI bill for parish

---

## 31.9 Implementation Checklist

### Immediate (Week 1-2):
- [ ] Create database migration for API key tables
- [ ] Implement encryption/decryption utilities
- [ ] Create `APIKeyManager` class
- [ ] Build admin API endpoints
- [ ] Build user API endpoints

### Short-term (Week 3-4):
- [ ] Create admin UI page
- [ ] Create user settings page
- [ ] Integration with bot middleware
- [ ] Add usage logging
- [ ] Implement key rotation logic

### Medium-term (Month 2):
- [ ] Add usage statistics dashboard
- [ ] Implement fallback chain
- [ ] Add key validation on input
- [ ] Create user documentation
- [ ] Security audit

### Long-term (Month 3+):
- [ ] Add more providers (OpenAI, Anthropic as fallback paid options)
- [ ] Implement smart routing (route theological queries to better models)
- [ ] Add cost prediction for paid tiers
- [ ] Create admin alerts for low key pool

---

## 31.10 User Documentation Template

### 31.10.1 How to Get Free API Key

```
CARA MEMPEROLEH API KEY GRATIS:

1. OPENROUTER (Disarankan untuk penggunaan umum)
   Langkah-langkah:
   1. Buka https://openrouter.ai
   2. Klik "Sign Up" (bisa pakai Google account)
   3. Setelah login, klik profil > "Keys"
   4. Klik "Create Key"
   5. Beri nama: "Paroki StKlemens-1"
   6. Copy key yang dimulai dengan "sk-or-..."
   7. Paste di kolom API Key OpenRouter di bawah
   8. Klik "Validasi" untuk memastikan key bekerja
   
   Batas: Unlimited requests (rate limited)

2. GOOGLE GEMINI (Disarankan untuk companion mode)
   Langkah-langkah:
   1. Buka https://aistudio.google.com
   2. Login dengan Google account
   3. Klik "Get API Key"
   4. Jika belum ada project, create new project "Paroki-App"
   5. Klik "Create API Key"
   6. Copy key yang dimulai dengan "AIzaSy..."
   7. Paste di kolom API Key Gemini di bawah
   8. Klik "Validasi"
   
   Batas: 1,500 requests/day

APAKAH AMAN?
- API key disimpan terenkripsi di server
- Admin paroki tidak bisa melihat key Anda
- Key hanya digunakan untuk bot requests
- Anda bisa menghapus key kapan saja
```

---
**END OF CHAPTER 31**