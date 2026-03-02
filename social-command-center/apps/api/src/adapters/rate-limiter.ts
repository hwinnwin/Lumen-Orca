import type { Platform } from '@prisma/client';

/**
 * In-memory rate limiter for platform API calls.
 * Uses sliding window counters per platform per user.
 * In production, use Redis for distributed rate limiting.
 */

interface RateLimit {
  maxRequests: number;
  windowMs: number;
  description: string;
}

const PLATFORM_LIMITS: Record<Platform, RateLimit> = {
  FACEBOOK: { maxRequests: 200, windowMs: 60 * 60 * 1000, description: '200/hour per user-page' },
  INSTAGRAM: { maxRequests: 25, windowMs: 24 * 60 * 60 * 1000, description: '25/24hr' },
  LINKEDIN: { maxRequests: 100, windowMs: 24 * 60 * 60 * 1000, description: '100/day' },
  X: { maxRequests: 50, windowMs: 24 * 60 * 60 * 1000, description: '50/24hr (creation)' },
  TIKTOK: { maxRequests: 50, windowMs: 24 * 60 * 60 * 1000, description: '~50/day (varies)' },
  YOUTUBE: { maxRequests: 6, windowMs: 24 * 60 * 60 * 1000, description: '~6 uploads/day (1600 units each, 10000 daily)' },
};

// In-memory store: Map<"platform:userId", timestamp[]>
const requestLog = new Map<string, number[]>();

function getKey(platform: Platform, userId: string): string {
  return `${platform}:${userId}`;
}

function cleanOldEntries(timestamps: number[], windowMs: number): number[] {
  const cutoff = Date.now() - windowMs;
  return timestamps.filter((t) => t > cutoff);
}

/**
 * Check if a publish request can be made without exceeding rate limits.
 */
export function canPublish(platform: Platform, userId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: RateLimit;
} {
  const limit = PLATFORM_LIMITS[platform];
  const key = getKey(platform, userId);

  let timestamps = requestLog.get(key) || [];
  timestamps = cleanOldEntries(timestamps, limit.windowMs);
  requestLog.set(key, timestamps);

  const remaining = Math.max(0, limit.maxRequests - timestamps.length);
  const oldestRequest = timestamps[0] || Date.now();
  const resetAt = new Date(oldestRequest + limit.windowMs);

  return {
    allowed: timestamps.length < limit.maxRequests,
    remaining,
    resetAt,
    limit,
  };
}

/**
 * Record a publish request for rate limiting.
 */
export function recordPublish(platform: Platform, userId: string): void {
  const key = getKey(platform, userId);
  let timestamps = requestLog.get(key) || [];
  const limit = PLATFORM_LIMITS[platform];
  timestamps = cleanOldEntries(timestamps, limit.windowMs);
  timestamps.push(Date.now());
  requestLog.set(key, timestamps);
}

/**
 * Get current rate limit status for all platforms for a user.
 */
export function getRateLimitStatus(userId: string): Record<Platform, {
  remaining: number;
  maxRequests: number;
  description: string;
}> {
  const result: Record<string, { remaining: number; maxRequests: number; description: string }> = {};

  for (const [platform, limit] of Object.entries(PLATFORM_LIMITS)) {
    const key = getKey(platform as Platform, userId);
    let timestamps = requestLog.get(key) || [];
    timestamps = cleanOldEntries(timestamps, limit.windowMs);
    requestLog.set(key, timestamps);

    result[platform] = {
      remaining: Math.max(0, limit.maxRequests - timestamps.length),
      maxRequests: limit.maxRequests,
      description: limit.description,
    };
  }

  return result as Record<Platform, { remaining: number; maxRequests: number; description: string }>;
}
