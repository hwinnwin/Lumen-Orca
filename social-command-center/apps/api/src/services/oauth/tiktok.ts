import { env } from '../../config/env.js';
import { storeTokens } from '../../utils/token-manager.js';

/**
 * TikTok OAuth 2.0
 * Access tokens expire in 24 hours, refresh tokens in 365 days.
 */

export function getTikTokAuthUrl(state: string): string {
  const scopes = 'user.info.basic,video.publish,video.upload';

  const params = new URLSearchParams({
    client_key: env.TIKTOK_CLIENT_KEY,
    response_type: 'code',
    scope: scopes,
    redirect_uri: env.TIKTOK_REDIRECT_URI,
    state,
  });

  return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
}

export async function handleTikTokCallback(code: string, userId: string) {
  const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: env.TIKTOK_CLIENT_KEY,
      client_secret: env.TIKTOK_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: env.TIKTOK_REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    const error = await tokenRes.text();
    throw new Error(`TikTok token exchange failed: ${error}`);
  }

  const tokenData = await tokenRes.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_expires_in: number;
    open_id: string;
    scope: string;
    token_type: string;
  };

  // Fetch user info
  const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  let displayName = 'TikTok User';
  if (userRes.ok) {
    const userData = await userRes.json() as {
      data: { user: { open_id: string; display_name: string } };
    };
    displayName = userData.data.user.display_name || displayName;
  }

  const connection = await storeTokens({
    userId,
    platform: 'TIKTOK',
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in, // ~24 hours
    platformUserId: tokenData.open_id,
    platformName: displayName,
    scopes: tokenData.scope.split(','),
  });

  return connection;
}

export async function refreshTikTokToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: env.TIKTOK_CLIENT_KEY,
      client_secret: env.TIKTOK_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`TikTok token refresh failed: ${await res.text()}`);
  }

  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}
