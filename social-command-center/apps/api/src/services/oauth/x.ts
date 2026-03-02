import { createHash, randomBytes } from 'crypto';
import { env } from '../../config/env.js';
import { storeTokens } from '../../utils/token-manager.js';

/**
 * X (Twitter) OAuth 2.0 with PKCE
 * Uses code_verifier/code_challenge for security.
 * Access tokens expire in 2 hours, refresh tokens in 6 months.
 * Refresh tokens are single-use (rotating) — store new one after each refresh.
 */

function generateCodeVerifier(): string {
  return randomBytes(64).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export function getXAuthUrl(state: string): { url: string; codeVerifier: string } {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Free tier: tweet.read + users.read + offline.access
  // Basic tier ($100/mo) adds: tweet.write, like.write, bookmark.write, list.write, etc.
  // Requesting unavailable scopes causes the authorize page to silently fail (blank page with just X logo).
  const scopes = 'tweet.read users.read offline.access';

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.X_CLIENT_ID,
    redirect_uri: env.X_REDIRECT_URI,
    scope: scopes,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return {
    url: `https://twitter.com/i/oauth2/authorize?${params}`,
    codeVerifier,
  };
}

export async function handleXCallback(
  code: string,
  codeVerifier: string,
  userId: string,
) {
  // Exchange code + code_verifier for tokens
  const basicAuth = Buffer.from(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`).toString('base64');

  console.log('[X OAuth] Token exchange -> redirect_uri:', env.X_REDIRECT_URI);
  const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: env.X_REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    const error = await tokenRes.text();
    console.error('[X OAuth] Token exchange failed:', tokenRes.status, error);
    throw new Error(`X token exchange failed: ${error}`);
  }
  console.log('[X OAuth] Token exchange successful');

  const tokenData = await tokenRes.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
  };

  // Fetch user profile
  const userRes = await fetch('https://api.twitter.com/2/users/me?user.fields=name,username,profile_image_url', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  if (!userRes.ok) {
    throw new Error(`X user fetch failed: ${await userRes.text()}`);
  }

  const userData = await userRes.json() as {
    data: {
      id: string;
      name: string;
      username: string;
    };
  };

  const connection = await storeTokens({
    userId,
    platform: 'X',
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in, // ~2 hours
    platformUserId: userData.data.id,
    platformName: `@${userData.data.username}`,
    scopes: tokenData.scope.split(' '),
  });

  return connection;
}

/**
 * Refresh an X access token.
 * IMPORTANT: X refresh tokens are single-use (rotating).
 * After refresh, both the new access_token AND refresh_token must be stored.
 */
export async function refreshXToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const basicAuth = Buffer.from(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`).toString('base64');

  const res = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`X token refresh failed: ${await res.text()}`);
  }

  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token, // New refresh token (old one is now invalid)
    expiresIn: data.expires_in,
  };
}
