/**
 * E2E Encryption Utilities for Companion Rohani (Bot 3)
 * 
 * This is a placeholder/example implementation. In a production environment,
 * a robust key management system (e.g., Web Crypto API with user-provided passphrase
 * or asymmetric keys) should be used to generate and manage encryption keys client-side.
 * 
 * This example uses a simple symmetric key for demonstration.
 * The actual implementation would:
 * 1. Generate a unique encryption key for each user during onboarding.
 * 2. Store the key locally (e.g., in IndexedDB or Secure Storage).
 * 3. Use the Web Crypto API with AES-GCM for encryption.
 * 4. Encrypt messages before sending to the server.
 * 5. Decrypt messages after receiving from the server.
 */

/**
 * Encrypts data with a given key and returns the ciphertext and IV.
 * @param data The string data to encrypt.
 * @returns An object containing the encrypted data (as a Uint8Array) and IV (as a string).
 */
export async function encryptData(data: string): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
    // Placeholder: In a real implementation, generate or retrieve a proper AES-GCM key.
    // For demonstration, we use a dummy key. This should NEVER be used in production.
    const dummyKey = new TextEncoder().encode('notsecurekey12345'); // 16 bytes for AES-128
    const key = await crypto.subtle.importKey(
        'raw',
        dummyKey,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12-byte IV for AES-GCM

    const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encodedData
        )
    );

    return { ciphertext, iv };
}

/**
 * Decrypts data that was encrypted with encryptData.
 * @param ciphertext The ciphertext as a Uint8Array.
 * @param iv The IV as a Uint8Array.
 * @returns The decrypted string.
 */
export async function decryptData(ciphertext: Uint8Array, iv: Uint8Array): Promise<string> {
    // Placeholder: In a real implementation, generate or retrieve a proper AES-GCM key.
    // This key MUST match the one used for encryption.
    const dummyKey = new TextEncoder().encode('notsecurekey12345'); // 16 bytes for AES-128
    const key = await crypto.subtle.importKey(
        'raw',
        dummyKey,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv.slice().buffer as ArrayBuffer },
        key,
        ciphertext.slice().buffer as ArrayBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

/**
 * Converts an ArrayBuffer or Uint8Array to a base64 string for transport.
 * @param buffer The buffer to convert.
 * @returns A base64-encoded string.
 */
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
}

/**
 * Converts a base64 string back to a Uint8Array.
 * @param base64 The base64 string to convert.
 * @returns A Uint8Array of the data.
 */
export function base64ToBuffer(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}