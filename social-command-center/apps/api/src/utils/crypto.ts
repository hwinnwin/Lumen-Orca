import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  // Use first 32 bytes of the encryption key
  const key = Buffer.from(env.ENCRYPTION_KEY, 'utf-8');
  if (key.length < 32) {
    // Pad with zeros if too short (dev mode)
    return Buffer.concat([key, Buffer.alloc(32 - key.length)]);
  }
  return key.subarray(0, 32);
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns: { encrypted: base64(ciphertext + authTag), iv: hex }
 */
export function encryptToken(plaintext: string): { encrypted: string; iv: string } {
  const iv = randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine ciphertext and auth tag
  const combined = Buffer.concat([encrypted, authTag]);

  return {
    encrypted: combined.toString('base64'),
    iv: iv.toString('hex'),
  };
}

/**
 * Decrypt a token encrypted with encryptToken.
 */
export function decryptToken(encryptedBase64: string, ivHex: string): string {
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const combined = Buffer.from(encryptedBase64, 'base64');

  // Split ciphertext and auth tag
  const ciphertext = combined.subarray(0, combined.length - AUTH_TAG_LENGTH);
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}
