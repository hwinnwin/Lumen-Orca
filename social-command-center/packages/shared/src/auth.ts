import type { PlatformId } from './platforms.js';

export interface PlatformConnection {
  id: string;
  userId: string;
  platform: PlatformId;
  platformUserId: string | null;
  platformPageId: string | null;
  platformName: string | null;
  scopes: string[];
  isActive: boolean;
  tokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthState {
  state: string;
  codeVerifier?: string;
  platform: PlatformId;
  redirectUri: string;
  userId: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionStatus {
  platform: PlatformId;
  connected: boolean;
  connection: PlatformConnection | null;
  health: 'good' | 'expiring' | 'expired' | 'disconnected';
}
