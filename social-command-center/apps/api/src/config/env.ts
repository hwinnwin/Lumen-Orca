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
  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Server
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
  META_REDIRECT_URI: z.string().default('http://localhost:3001/api/auth/meta/callback'),

  // LinkedIn
  LINKEDIN_CLIENT_ID: z.string().default(''),
  LINKEDIN_CLIENT_SECRET: z.string().default(''),
  LINKEDIN_REDIRECT_URI: z.string().default('http://localhost:3001/api/auth/linkedin/callback'),

  // X (Twitter)
  X_CLIENT_ID: z.string().default(''),
  X_CLIENT_SECRET: z.string().default(''),
  X_REDIRECT_URI: z.string().default('http://localhost:3001/api/auth/x/callback'),

  // TikTok
  TIKTOK_CLIENT_KEY: z.string().default(''),
  TIKTOK_CLIENT_SECRET: z.string().default(''),
  TIKTOK_REDIRECT_URI: z.string().default('http://localhost:3001/api/auth/tiktok/callback'),

  // YouTube (Google)
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:3001/api/auth/google/callback'),

  // S3
  S3_BUCKET: z.string().default(''),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().default(''),
  S3_SECRET_KEY: z.string().default(''),
  S3_ENDPOINT: z.string().default(''),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().default(''),
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

  // Log configured OAuth providers on startup
  const configured = [];
  if (parsed.data.META_APP_ID) configured.push('Meta');
  if (parsed.data.LINKEDIN_CLIENT_ID) configured.push('LinkedIn');
  if (parsed.data.X_CLIENT_ID) configured.push('X');
  if (parsed.data.TIKTOK_CLIENT_KEY) configured.push('TikTok');
  if (parsed.data.GOOGLE_CLIENT_ID) configured.push('Google/YouTube');
  console.log(`OAuth configured: ${configured.length > 0 ? configured.join(', ') : 'none'}`);

  return parsed.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
