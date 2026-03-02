import { env } from '../../config/env.js';
import { storeTokens } from '../../utils/token-manager.js';

/**
 * LinkedIn OAuth 2.0
 * Note: LinkedIn 3-legged OAuth tokens expire in 60 days with NO refresh mechanism.
 * Users must re-authorize when tokens expire.
 */

export function getLinkedInAuthUrl(state: string): string {
  const scopes = 'openid profile w_member_social';

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.LINKEDIN_CLIENT_ID,
    redirect_uri: env.LINKEDIN_REDIRECT_URI,
    state,
    scope: scopes,
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
}

export async function handleLinkedInCallback(code: string, userId: string) {
  // Exchange code for access token
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: env.LINKEDIN_CLIENT_ID,
      client_secret: env.LINKEDIN_CLIENT_SECRET,
      redirect_uri: env.LINKEDIN_REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    const error = await tokenRes.text();
    throw new Error(`LinkedIn token exchange failed: ${error}`);
  }

  const tokenData = await tokenRes.json() as {
    access_token: string;
    expires_in: number;
    scope: string;
  };

  // Fetch user profile for member URN
  const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  if (!profileRes.ok) {
    throw new Error(`LinkedIn profile fetch failed: ${await profileRes.text()}`);
  }

  const profile = await profileRes.json() as {
    sub: string;
    name: string;
    email?: string;
    picture?: string;
  };

  // Store connection (no refresh token for LinkedIn)
  const connection = await storeTokens({
    userId,
    platform: 'LINKEDIN',
    accessToken: tokenData.access_token,
    expiresIn: tokenData.expires_in, // ~60 days
    platformUserId: profile.sub, // Member URN sub
    platformName: profile.name,
    scopes: tokenData.scope.split(' '),
  });

  return connection;
}

// LinkedIn does NOT support token refresh for 3-legged OAuth.
// When the token expires, the user must re-authorize.
