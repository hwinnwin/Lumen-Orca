import { Router } from 'express';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db/client.js';
import { env } from '../config/env.js';
import { authMiddleware, generateToken } from '../middleware/auth.js';
import { getOrCreateBalance } from '../services/credits.js';
import { getMetaAuthUrl, handleMetaCallback } from '../services/oauth/meta.js';
import { getLinkedInAuthUrl, handleLinkedInCallback } from '../services/oauth/linkedin.js';
import { getXAuthUrl, handleXCallback } from '../services/oauth/x.js';
import { getTikTokAuthUrl, handleTikTokCallback } from '../services/oauth/tiktok.js';
import { getGoogleAuthUrl, handleGoogleCallback } from '../services/oauth/google.js';

export const authRouter = Router();

// ─── Rate Limiting ──────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per window
  message: { error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public Routes (no JWT required) ────────────────────

authRouter.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name: name || undefined },
    });

    // Initialize credit balance with signup bonus
    await getOrCreateBalance(user.id);

    const token = generateToken(user.id, user.email);

    res.status(201).json({
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name },
      },
    });
  } catch (error) {
    console.error('Registration failed:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

authRouter.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.email);

    res.json({
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name },
      },
    });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── Protected Routes (JWT required) ────────────────────

authRouter.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ data: user });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Debug log for OAuth flow
const oauthLog: string[] = [];
function logOAuth(msg: string) {
  const entry = `[${new Date().toISOString()}] ${msg}`;
  oauthLog.push(entry);
  if (oauthLog.length > 50) oauthLog.shift();
  console.log(entry);
}

authRouter.get('/debug', authMiddleware, (_req, res) => {
  if (env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json({ log: oauthLog, stateCount: oauthStates.size });
});

// In-memory state store for OAuth flows (use Redis in production)
const oauthStates = new Map<string, {
  userId: string;
  platform: string;
  codeVerifier?: string;
  createdAt: number;
}>();

// Clean up expired states every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of oauthStates) {
    if (now - value.createdAt > 10 * 60 * 1000) {
      oauthStates.delete(key);
    }
  }
}, 10 * 60 * 1000);

function generateState(): string {
  return randomBytes(32).toString('hex');
}

function sendPopupResult(res: import('express').Response, result: { success?: string; error?: string }) {
  const params = new URLSearchParams();
  if (result.success) params.set('success', result.success);
  if (result.error) params.set('error', result.error);
  res.redirect(`${env.APP_URL}/oauth-callback?${params}`);
}

// ─── List Connections (protected) ────────────────────────

authRouter.get('/connections', authMiddleware, async (req, res) => {
  try {
    const connections = await prisma.platformConnection.findMany({
      where: { userId: req.userId },
      select: {
        id: true,
        platform: true,
        platformUserId: true,
        platformPageId: true,
        platformName: true,
        scopes: true,
        isActive: true,
        tokenExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ data: connections });
  } catch (error) {
    console.error('Failed to fetch connections:', error);
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

// ─── Disconnect (protected) ─────────────────────────────

authRouter.delete('/connections/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.platformConnection.delete({
      where: { id: req.params.id as string, userId: req.userId },
    });
    res.json({ data: { success: true } });
  } catch (error) {
    console.error('Failed to disconnect:', error);
    res.status(500).json({ error: 'Failed to disconnect platform' });
  }
});

// ─── Meta (Facebook + Instagram) ─────────────────────────
// OAuth /start routes require JWT, callbacks use state param for user identification

authRouter.get('/meta/start', authMiddleware, (req, res) => {
  if (!env.META_APP_ID || !env.META_APP_SECRET) {
    return res.status(501).json({ error: 'Meta OAuth not configured. Add META_APP_ID and META_APP_SECRET to .env' });
  }

  const state = generateState();
  oauthStates.set(state, {
    userId: req.userId,
    platform: 'meta',
    createdAt: Date.now(),
  });

  const url = getMetaAuthUrl(state);
  logOAuth(`Meta start -> redirect_uri=${env.META_REDIRECT_URI}`);
  res.redirect(url);
});

authRouter.get('/meta/callback', async (req, res) => {
  logOAuth(`Meta callback hit! query: ${JSON.stringify(req.query)}`);
  try {
    if (req.query.error) {
      logOAuth(`Meta error: ${req.query.error} - ${req.query.error_description}`);
      return sendPopupResult(res, { error: `meta_denied: ${req.query.error_description || req.query.error}` });
    }

    const { code, state } = req.query as { code?: string; state?: string };
    if (!code || !state) {
      logOAuth('Meta callback: missing code or state');
      return sendPopupResult(res, { error: 'missing_params' });
    }

    const oauthState = oauthStates.get(state);
    if (!oauthState) {
      logOAuth('Meta callback: invalid state');
      return sendPopupResult(res, { error: 'invalid_state' });
    }
    oauthStates.delete(state);

    logOAuth('Meta callback: exchanging code for tokens...');
    const results = await handleMetaCallback(code, oauthState.userId);
    logOAuth(`Meta callback: Done! ${results.length} connection(s) stored.`);
    if (results.length === 0) {
      logOAuth('Meta callback: WARNING - 0 connections. User may not have granted page access.');
    }
    sendPopupResult(res, { success: 'meta' });
  } catch (error) {
    logOAuth(`Meta callback ERROR: ${error instanceof Error ? error.message : String(error)}`);
    sendPopupResult(res, { error: 'meta_failed' });
  }
});

// ─── LinkedIn ────────────────────────────────────────────

authRouter.get('/linkedin/start', authMiddleware, (req, res) => {
  if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) {
    return res.status(501).json({ error: 'LinkedIn OAuth not configured' });
  }

  const state = generateState();
  oauthStates.set(state, {
    userId: req.userId,
    platform: 'linkedin',
    createdAt: Date.now(),
  });

  const url = getLinkedInAuthUrl(state);
  res.redirect(url);
});

authRouter.get('/linkedin/callback', async (req, res) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };
    if (!code || !state) {
      return sendPopupResult(res, { error: 'missing_params' });
    }

    const oauthState = oauthStates.get(state);
    if (!oauthState) {
      return sendPopupResult(res, { error: 'invalid_state' });
    }
    oauthStates.delete(state);

    await handleLinkedInCallback(code, oauthState.userId);
    sendPopupResult(res, { success: 'linkedin' });
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    sendPopupResult(res, { error: 'linkedin_failed' });
  }
});

// ─── X (Twitter) ─────────────────────────────────────────

authRouter.get('/x/start', authMiddleware, (req, res) => {
  if (!env.X_CLIENT_ID || !env.X_CLIENT_SECRET) {
    return res.status(501).json({ error: 'X OAuth not configured' });
  }

  const state = generateState();
  const { url, codeVerifier } = getXAuthUrl(state);

  logOAuth(`Start -> client_id=${env.X_CLIENT_ID} redirect_uri=${env.X_REDIRECT_URI}`);
  logOAuth(`State stored, count: ${oauthStates.size + 1}`);

  oauthStates.set(state, {
    userId: req.userId,
    platform: 'x',
    codeVerifier,
    createdAt: Date.now(),
  });

  res.redirect(url);
});

authRouter.get('/x/callback', async (req, res) => {
  logOAuth(`Callback hit! Full query: ${JSON.stringify(req.query)}`);
  try {
    if (req.query.error) {
      logOAuth(`X returned error: ${req.query.error} - ${req.query.error_description}`);
      return sendPopupResult(res, { error: `x_denied: ${req.query.error_description || req.query.error}` });
    }

    const { code, state } = req.query as { code?: string; state?: string };
    if (!code || !state) {
      logOAuth('ERROR: Missing code or state');
      return sendPopupResult(res, { error: 'missing_params' });
    }

    const oauthState = oauthStates.get(state);
    if (!oauthState || !oauthState.codeVerifier) {
      logOAuth(`ERROR: Invalid state - stored states: ${oauthStates.size}`);
      return sendPopupResult(res, { error: 'invalid_state' });
    }
    oauthStates.delete(state);

    logOAuth('Exchanging code for tokens...');
    await handleXCallback(code, oauthState.codeVerifier, oauthState.userId);
    logOAuth('SUCCESS! Connection stored.');
    sendPopupResult(res, { success: 'x' });
  } catch (error) {
    logOAuth(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    sendPopupResult(res, { error: 'x_failed' });
  }
});

// ─── TikTok ──────────────────────────────────────────────

authRouter.get('/tiktok/start', authMiddleware, (req, res) => {
  if (!env.TIKTOK_CLIENT_KEY || !env.TIKTOK_CLIENT_SECRET) {
    return res.status(501).json({ error: 'TikTok OAuth not configured' });
  }

  const state = generateState();
  oauthStates.set(state, {
    userId: req.userId,
    platform: 'tiktok',
    createdAt: Date.now(),
  });

  const url = getTikTokAuthUrl(state);
  res.redirect(url);
});

authRouter.get('/tiktok/callback', async (req, res) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };
    if (!code || !state) {
      return sendPopupResult(res, { error: 'missing_params' });
    }

    const oauthState = oauthStates.get(state);
    if (!oauthState) {
      return sendPopupResult(res, { error: 'invalid_state' });
    }
    oauthStates.delete(state);

    await handleTikTokCallback(code, oauthState.userId);
    sendPopupResult(res, { success: 'tiktok' });
  } catch (error) {
    console.error('TikTok callback error:', error);
    sendPopupResult(res, { error: 'tiktok_failed' });
  }
});

// ─── Google (YouTube) ────────────────────────────────────

authRouter.get('/google/start', authMiddleware, (req, res) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({ error: 'Google OAuth not configured' });
  }

  const state = generateState();
  oauthStates.set(state, {
    userId: req.userId,
    platform: 'google',
    createdAt: Date.now(),
  });

  const url = getGoogleAuthUrl(state);
  res.redirect(url);
});

authRouter.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };
    if (!code || !state) {
      return sendPopupResult(res, { error: 'missing_params' });
    }

    const oauthState = oauthStates.get(state);
    if (!oauthState) {
      return sendPopupResult(res, { error: 'invalid_state' });
    }
    oauthStates.delete(state);

    await handleGoogleCallback(code, oauthState.userId);
    sendPopupResult(res, { success: 'youtube' });
  } catch (error) {
    console.error('Google callback error:', error);
    sendPopupResult(res, { error: 'google_failed' });
  }
});
