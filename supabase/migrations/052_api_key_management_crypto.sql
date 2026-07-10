-- Migration 051b: API Key Encryption Functions
-- Purpose: Add pgp_sym_encrypt/pgp_sym_decrypt wrapper functions for API keys
-- Required by: src/lib/api-key-manager.ts
-- Created: 2026-06-17

-- ============================================
-- ENCRYPTION FUNCTIONS FOR API KEYS
-- ============================================

-- Function to encrypt API key
CREATE OR REPLACE FUNCTION public.encrypt_api_key(
    plain_text TEXT,
    encryption_key TEXT
)
RETURNS TEXT AS $$
DECLARE
    encrypted TEXT;
BEGIN
    -- Encrypt using pgp_sym with the provided encryption key
    encrypted := pgp_sym_encrypt(plain_text, encryption_key, 'compress-algo=zstd, cipher-algo=aes256');
    RETURN encrypted;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Function to decrypt API key
CREATE OR REPLACE FUNCTION public.decrypt_api_key(
    encrypted_text TEXT,
    encryption_key TEXT
)
RETURNS TEXT AS $$
DECLARE
    decrypted TEXT;
BEGIN
    -- Decrypt using pgp_sym with the provided encryption key
    decrypted := pgp_sym_decrypt(encrypted_text::bytea, encryption_key, 'compress-algo=zstd, cipher-algo=aes256');
    RETURN decrypted;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- ============================================
-- GRANTS
-- ============================================

-- Allow authenticated users to call encryption functions
-- (for their own keys only - RLS will restrict access to records)
GRANT EXECUTE ON FUNCTION public.encrypt_api_key(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_api_key(TEXT, TEXT) TO authenticated;

-- Allow service_role to call for backend operations
GRANT EXECUTE ON FUNCTION public.encrypt_api_key(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_api_key(TEXT, TEXT) TO service_role;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION public.encrypt_api_key(TEXT, TEXT) IS 'Encrypts plaintext using pgp_sym_encrypt with AES256 encryption. Used for storing API keys securely.';
COMMENT ON FUNCTION public.decrypt_api_key(TEXT, TEXT) IS 'Decrypts ciphertext using pgp_sym_decrypt. Used for retrieving API keys from database.';