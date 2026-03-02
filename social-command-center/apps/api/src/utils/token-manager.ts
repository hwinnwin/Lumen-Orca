import { prisma } from '../db/client.js';
import { encryptToken, decryptToken } from './crypto.js';
import type { Platform, PlatformConnection } from '@prisma/client';

interface StoreTokensParams {
  userId: string;
  platform: Platform;
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number; // seconds until expiry
  platformUserId?: string | null;
  platformPageId?: string | null;
  platformName?: string | null;
  scopes?: string[];
}

interface DecryptedTokens {
  accessToken: string;
  refreshToken: string | null;
}

/**
 * Encrypt and store OAuth tokens for a platform connection.
 */
export async function storeTokens(params: StoreTokensParams): Promise<PlatformConnection> {
  const {
    userId,
    platform,
    accessToken,
    refreshToken,
    expiresIn,
    platformUserId,
    platformPageId,
    platformName,
    scopes = [],
  } = params;

  const encrypted = encryptToken(accessToken);
  let encryptedRefresh: string | null = null;

  if (refreshToken) {
    const refreshEnc = encryptToken(refreshToken);
    // Store refresh token encrypted data with the same IV for simplicity
    // In production, you might want separate IVs
    encryptedRefresh = `${refreshEnc.iv}:${refreshEnc.encrypted}`;
  }

  const tokenExpiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 1000)
    : null;

  return prisma.platformConnection.upsert({
    where: {
      userId_platform: { userId, platform },
    },
    update: {
      accessToken: encrypted.encrypted,
      refreshToken: encryptedRefresh,
      tokenIv: encrypted.iv,
      tokenExpiresAt,
      platformUserId,
      platformPageId,
      platformName,
      scopes,
      isActive: true,
      updatedAt: new Date(),
    },
    create: {
      userId,
      platform,
      accessToken: encrypted.encrypted,
      refreshToken: encryptedRefresh,
      tokenIv: encrypted.iv,
      tokenExpiresAt,
      platformUserId,
      platformPageId,
      platformName,
      scopes,
      isActive: true,
    },
  });
}

/**
 * Retrieve and decrypt tokens for a platform connection.
 */
export function getDecryptedTokens(connection: PlatformConnection): DecryptedTokens {
  const accessToken = decryptToken(connection.accessToken, connection.tokenIv);

  let refreshToken: string | null = null;
  if (connection.refreshToken) {
    const [refreshIv, refreshEncrypted] = connection.refreshToken.split(':');
    refreshToken = decryptToken(refreshEncrypted, refreshIv);
  }

  return { accessToken, refreshToken };
}

/**
 * Check if a connection's token is expired or about to expire.
 */
export function isTokenExpired(connection: PlatformConnection, bufferMinutes = 5): boolean {
  if (!connection.tokenExpiresAt) return false;
  const buffer = bufferMinutes * 60 * 1000;
  return connection.tokenExpiresAt.getTime() - buffer <= Date.now();
}

/**
 * Mark a connection as inactive (token invalid).
 */
export async function invalidateConnection(connectionId: string): Promise<void> {
  await prisma.platformConnection.update({
    where: { id: connectionId },
    data: { isActive: false },
  });
}

/**
 * Get all connections for a user.
 */
export async function getUserConnections(userId: string) {
  return prisma.platformConnection.findMany({
    where: { userId, isActive: true },
  });
}

/**
 * Get a specific platform connection for a user.
 */
export async function getUserPlatformConnection(userId: string, platform: Platform) {
  return prisma.platformConnection.findUnique({
    where: {
      userId_platform: { userId, platform },
    },
  });
}
