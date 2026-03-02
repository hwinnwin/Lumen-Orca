import type { PlatformConnection } from '@prisma/client';
import { getDecryptedTokens, isTokenExpired, storeTokens, invalidateConnection } from '../utils/token-manager.js';
import { refreshMetaToken } from '../services/oauth/meta.js';
import { refreshXToken } from '../services/oauth/x.js';
import { refreshTikTokToken } from '../services/oauth/tiktok.js';
import { refreshGoogleToken } from '../services/oauth/google.js';

/**
 * Ensure a platform connection has a valid access token.
 * Refreshes if expired or about to expire (within 5 min buffer).
 * Returns the decrypted access token ready for API calls.
 */
export async function ensureValidToken(connection: PlatformConnection): Promise<string> {
  if (!isTokenExpired(connection)) {
    const { accessToken } = getDecryptedTokens(connection);
    return accessToken;
  }

  // Token expired or about to expire — attempt refresh
  console.log(`Token expired for ${connection.platform} (${connection.platformName}), refreshing...`);

  try {
    const { accessToken, refreshToken } = getDecryptedTokens(connection);

    switch (connection.platform) {
      case 'FACEBOOK':
      case 'INSTAGRAM': {
        // Meta: Refresh long-lived token
        const result = await refreshMetaToken(accessToken);
        await storeTokens({
          userId: connection.userId,
          platform: connection.platform,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
          platformUserId: connection.platformUserId,
          platformPageId: connection.platformPageId,
          platformName: connection.platformName,
          scopes: connection.scopes,
        });
        return result.accessToken;
      }

      case 'X': {
        if (!refreshToken) throw new Error('No refresh token for X');
        // X: Rotating refresh tokens — must store new refresh token
        const result = await refreshXToken(refreshToken);
        await storeTokens({
          userId: connection.userId,
          platform: 'X',
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
          platformUserId: connection.platformUserId,
          platformName: connection.platformName,
          scopes: connection.scopes,
        });
        return result.accessToken;
      }

      case 'TIKTOK': {
        if (!refreshToken) throw new Error('No refresh token for TikTok');
        const result = await refreshTikTokToken(refreshToken);
        await storeTokens({
          userId: connection.userId,
          platform: 'TIKTOK',
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
          platformUserId: connection.platformUserId,
          platformName: connection.platformName,
          scopes: connection.scopes,
        });
        return result.accessToken;
      }

      case 'YOUTUBE': {
        if (!refreshToken) throw new Error('No refresh token for YouTube');
        const result = await refreshGoogleToken(refreshToken);
        await storeTokens({
          userId: connection.userId,
          platform: 'YOUTUBE',
          accessToken: result.accessToken,
          refreshToken: refreshToken, // Google refresh tokens don't rotate
          expiresIn: result.expiresIn,
          platformUserId: connection.platformUserId,
          platformName: connection.platformName,
          scopes: connection.scopes,
        });
        return result.accessToken;
      }

      case 'LINKEDIN': {
        // LinkedIn has no refresh mechanism — user must re-authorize
        throw new Error('LinkedIn token expired. User must re-authorize.');
      }

      default:
        throw new Error(`Unknown platform: ${connection.platform}`);
    }
  } catch (error) {
    console.error(`Token refresh failed for ${connection.platform}:`, error);
    await invalidateConnection(connection.id);
    throw error;
  }
}
