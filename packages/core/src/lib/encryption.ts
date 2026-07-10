// packages/core/src/lib/encryption.ts (CLIENT-SIDE ONLY)

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256; // in bits
const PBKDF2_ITERATIONS = 100_000;

export async function deriveKeyFromPIN(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false, // extractable = false (key cannot be exported)
    ['encrypt', 'decrypt']
  );
}

// Encrypt a message using the derived CryptoKey
export async function encryptMessage(key: CryptoKey, plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM recommended IV length is 12 bytes
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv },
    key,
    encoded
  );

  const ciphertext = btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer)));
  const ivString = btoa(String.fromCharCode(...iv));

  return { ciphertext, iv: ivString };
}

// Decrypt a message using the derived CryptoKey
export async function decryptMessage(key: CryptoKey, ciphertext: string, iv: string): Promise<string> {
  const ivBuffer = new Uint8Array(atob(iv).split('').map(char => char.charCodeAt(0)));
  const ciphertextBuffer = new Uint8Array(atob(ciphertext).split('').map(char => char.charCodeAt(0)));

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: ivBuffer },
    key,
    ciphertextBuffer
  );

  return new TextDecoder().decode(decryptedBuffer);
}

// Generate a new salt for PBKDF2
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16)); // Recommended salt length is 16 bytes
}

// CATATAN KRITIS:
// - Key TIDAK pernah dikirim ke server
// - Key TIDAK pernah disimpan ke localStorage/sessionStorage (hanya sementara di memory CryptoKey object)
// - Jika user lupa PIN: data TIDAK bisa dipulihkan â€” by design
