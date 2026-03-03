import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Generate and verify time-limited signed URLs for public media access.
 * Used when platforms (like Instagram) need to fetch media from our server
 * and we can't require auth headers.
 *
 * Tokens are HMAC-SHA256 signed with the encryption key and expire after a set duration.
 */

const ALGORITHM = 'sha256';
const DEFAULT_TTL_SECONDS = 600; // 10 minutes — plenty for Instagram to fetch

function getSecret(): string {
  return env.ENCRYPTION_KEY;
}

/**
 * Generate a signed token for a media key.
 * The token encodes the key + expiry and is verified via HMAC.
 */
export function generateSignedMediaToken(
  mediaKey: string,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): string {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${mediaKey}:${expires}`;
  const signature = crypto
    .createHmac(ALGORITHM, getSecret())
    .update(payload)
    .digest('hex');

  // Encode as base64url so it's safe in URL paths
  const token = Buffer.from(`${payload}:${signature}`).toString('base64url');
  return token;
}

/**
 * Verify a signed media token. Returns the media key if valid, null if expired/tampered.
 */
export function verifySignedMediaToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');

    if (parts.length < 3) return null;

    // signature is the last part, expires is second-to-last, key is everything before
    const signature = parts.pop()!;
    const expires = parseInt(parts.pop()!, 10);
    const mediaKey = parts.join(':');

    if (!mediaKey || isNaN(expires)) return null;

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (now > expires) {
      console.warn(`[SignedMedia] Token expired for key: ${mediaKey.substring(0, 40)}...`);
      return null;
    }

    // Verify HMAC
    const payload = `${mediaKey}:${expires}`;
    const expectedSignature = crypto
      .createHmac(ALGORITHM, getSecret())
      .update(payload)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      console.warn(`[SignedMedia] Invalid signature for key: ${mediaKey.substring(0, 40)}...`);
      return null;
    }

    return mediaKey;
  } catch (err) {
    console.warn(`[SignedMedia] Token verification failed:`, err);
    return null;
  }
}

/**
 * Build a full public URL for a media key that Instagram (or other platforms) can fetch.
 * Requires APP_URL to be set to the public domain (e.g., https://scc.hwinnwin.com).
 */
export function buildPublicMediaUrl(mediaKey: string, ttlSeconds = DEFAULT_TTL_SECONDS): string {
  const token = generateSignedMediaToken(mediaKey, ttlSeconds);
  const baseUrl = env.APP_URL.replace(/\/$/, '');
  return `${baseUrl}/api/media/public/${token}`;
}
