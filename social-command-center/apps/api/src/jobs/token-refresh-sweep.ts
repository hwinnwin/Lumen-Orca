import { prisma } from '../db/client.js';
import { ensureValidToken } from '../middleware/token-refresh.js';

/**
 * Proactive token refresh sweep.
 * Finds connections expiring within the next 10 minutes and refreshes them.
 * Run this as a BullMQ repeatable job (every 30 minutes) or via setInterval.
 */
/**
 * Start the token refresh sweep on a 30-minute interval.
 */
export function startTokenRefreshSweep(): void {
  // Run once on startup after a short delay
  setTimeout(() => runTokenRefreshSweep(), 10_000);
  // Then every 30 minutes
  setInterval(() => runTokenRefreshSweep(), 30 * 60 * 1000);
  console.log('[Token Sweep] Scheduled every 30 minutes');
}

export async function runTokenRefreshSweep(): Promise<void> {
  try {
    const bufferMinutes = 10;
    const threshold = new Date(Date.now() + bufferMinutes * 60 * 1000);

    console.log(`[Token Sweep] Looking for tokens expiring before ${threshold.toISOString()}`);

    const expiringConnections = await prisma.platformConnection.findMany({
      where: {
        isActive: true,
        tokenExpiresAt: {
          lte: threshold,
        },
      },
    });

    console.log(`[Token Sweep] Found ${expiringConnections.length} connections to refresh`);

    for (const connection of expiringConnections) {
      try {
        await ensureValidToken(connection);
        console.log(`[Token Sweep] Refreshed ${connection.platform} for user ${connection.userId}`);
      } catch (error) {
        console.error(
          `[Token Sweep] Failed to refresh ${connection.platform} for user ${connection.userId}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  } catch (error) {
    // Don't let DB connectivity issues crash the process
    console.error('[Token Sweep] Sweep failed (will retry next interval):', error instanceof Error ? error.message : error);
  }
}
