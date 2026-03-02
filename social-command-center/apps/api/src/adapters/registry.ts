import type { Platform } from '@prisma/client';
import type { PlatformAdapter } from './types.js';
import { FacebookAdapter } from './facebook.js';
import { InstagramAdapter } from './instagram.js';
import { LinkedInAdapter } from './linkedin.js';
import { XAdapter } from './x.js';
import { TikTokAdapter } from './tiktok.js';
import { YouTubeAdapter } from './youtube.js';

const adapters = new Map<Platform, PlatformAdapter>();

function initAdapters() {
  adapters.set('FACEBOOK', new FacebookAdapter());
  adapters.set('INSTAGRAM', new InstagramAdapter());
  adapters.set('LINKEDIN', new LinkedInAdapter());
  adapters.set('X', new XAdapter());
  adapters.set('TIKTOK', new TikTokAdapter());
  adapters.set('YOUTUBE', new YouTubeAdapter());
}

initAdapters();

/**
 * Get the platform adapter for a given platform.
 */
export function getAdapter(platform: Platform): PlatformAdapter {
  const adapter = adapters.get(platform);
  if (!adapter) {
    throw new Error(`No adapter registered for platform: ${platform}`);
  }
  return adapter;
}

/**
 * Get all registered platform adapters.
 */
export function getAllAdapters(): PlatformAdapter[] {
  return Array.from(adapters.values());
}
