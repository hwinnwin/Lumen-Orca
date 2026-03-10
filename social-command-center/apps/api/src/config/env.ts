import { z } from 'zod';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the monorepo root (resolve relative to this file, not CWD)
const monorepoRoot = resolve(__dirname, '../../../../');
dotenv.config({ path: resolve(monorepoRoot, '.env') });
// Also load local .env from apps/api/ if it exists
dotenv.config({ path: resolve(__dirname, '../../.env') });

const envSchema = z.object({
  // Database — Railway provides DATABASE_URL with postgresql:// scheme
  DATABASE_URL: z.string().min(1),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Server — Railway sets PORT automatically
  PORT: z.coerce.number().optional(),
  API_PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_URL: z.string().default('http://localhost:5173'),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32).default('dev-encryption-key-change-in-production-32chars!'),

  // JWT
  JWT_SECRET: z.string().default('dev-jwt-secret-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Meta (Facebook + Instagram)
  META_APP_ID: z.string().default(''),
  META_APP_SECRET: z.string().default(''),
  META_REDIRECT_URI: z.string().optional(),

  // LinkedIn
  LINKEDIN_CLIENT_ID: z.string().default(''),
  LINKEDIN_CLIENT_SECRET: z.string().default(''),
  LINKEDIN_REDIRECT_URI: z.string().optional(),

  // X (Twitter)
  X_CLIENT_ID: z.string().default(''),
  X_CLIENT_SECRET: z.string().default(''),
  X_REDIRECT_URI: z.string().optional(),

  // TikTok
  TIKTOK_CLIENT_KEY: z.string().default(''),
  TIKTOK_CLIENT_SECRET: z.string().default(''),
  TIKTOK_REDIRECT_URI: z.string().optional(),

  // YouTube (Google)
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_REDIRECT_URI: z.string().optional(),

  // S3
  S3_BUCKET: z.string().default(''),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().default(''),
  S3_SECRET_KEY: z.string().default(''),
  S3_ENDPOINT: z.string().default(''),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().default(''),

  // Replicate (AI image generation)
  REPLICATE_API_TOKEN: z.string().default(''),

  // OpenAI (Whisper transcription for captions)
  OPENAI_API_KEY: z.string().default(''),

  // Stripe
  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  STRIPE_PRICE_PRO: z.string().default(''),
  STRIPE_PRICE_PREMIUM: z.string().default(''),
  STRIPE_PRICE_POWER: z.string().default(''),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment variables:');
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  const data = parsed.data;

  // Auto-derive OAuth redirect URIs from APP_URL if not explicitly set.
  // In production APP_URL = https://scc.hwinnwin.com, so callbacks become
  // https://scc.hwinnwin.com/api/auth/{provider}/callback automatically.
  // In dev, fallback to https://localhost:3001 for local SSL.
  const baseUrl = data.NODE_ENV === 'production'
    ? data.APP_URL
    : `https://localhost:${data.API_PORT}`;

  data.META_REDIRECT_URI = data.META_REDIRECT_URI || `${baseUrl}/api/auth/meta/callback`;
  data.LINKEDIN_REDIRECT_URI = data.LINKEDIN_REDIRECT_URI || `${baseUrl}/api/auth/linkedin/callback`;
  data.X_REDIRECT_URI = data.X_REDIRECT_URI || `${baseUrl}/api/auth/x/callback`;
  data.TIKTOK_REDIRECT_URI = data.TIKTOK_REDIRECT_URI || `${baseUrl}/api/auth/tiktok/callback`;
  data.GOOGLE_REDIRECT_URI = data.GOOGLE_REDIRECT_URI || `${baseUrl}/api/auth/google/callback`;

  console.log(`OAuth redirect base: ${baseUrl}`);

  // Log configured OAuth providers on startup
  const configured = [];
  if (data.META_APP_ID) configured.push('Meta');
  if (data.LINKEDIN_CLIENT_ID) configured.push('LinkedIn');
  if (data.X_CLIENT_ID) configured.push('X');
  if (data.TIKTOK_CLIENT_KEY) configured.push('TikTok');
  if (data.GOOGLE_CLIENT_ID) configured.push('Google/YouTube');
  if (data.STRIPE_SECRET_KEY) configured.push('Stripe');
  console.log(`OAuth configured: ${configured.length > 0 ? configured.join(', ') : 'none'}`);

  return data;
}

// After loadEnv(), all redirect URIs are guaranteed to be strings (auto-derived if not set)
type LoadedEnv = Omit<z.infer<typeof envSchema>, 'META_REDIRECT_URI' | 'LINKEDIN_REDIRECT_URI' | 'X_REDIRECT_URI' | 'TIKTOK_REDIRECT_URI' | 'GOOGLE_REDIRECT_URI'> & {
  META_REDIRECT_URI: string;
  LINKEDIN_REDIRECT_URI: string;
  X_REDIRECT_URI: string;
  TIKTOK_REDIRECT_URI: string;
  GOOGLE_REDIRECT_URI: string;
};

export const env = loadEnv() as LoadedEnv;
export type Env = LoadedEnv;
