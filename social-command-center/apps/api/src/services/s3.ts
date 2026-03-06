import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Whether S3 is configured (has bucket + credentials) */
export const isS3Configured = Boolean(env.S3_BUCKET && env.S3_ACCESS_KEY && env.S3_SECRET_KEY);

/** Local uploads directory (used when S3 is not configured) */
const LOCAL_UPLOADS_DIR = resolve(__dirname, '../../../../uploads');

// Ensure local uploads directory exists
if (!isS3Configured) {
  if (!existsSync(LOCAL_UPLOADS_DIR)) {
    mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
  }
  console.log(`[Storage] Using local filesystem: ${LOCAL_UPLOADS_DIR}`);
} else {
  console.log(`[Storage] Using S3 bucket: ${env.S3_BUCKET}`);
}

const s3Client = new S3Client({
  region: env.S3_REGION,
  ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT, forcePathStyle: true } : {}),
  credentials:
    env.S3_ACCESS_KEY && env.S3_SECRET_KEY
      ? { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY }
      : undefined,
});

/**
 * Generate a storage key for user media.
 * Format: users/{userId}/media/{uuid}/{filename}
 */
export function generateMediaKey(userId: string, filename: string): string {
  const uuid = randomUUID();
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `users/${userId}/media/${uuid}/${sanitized}`;
}

/**
 * Generate a presigned URL for uploading directly to S3.
 * When S3 is not configured, returns a local upload URL.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  maxSizeBytes?: number,
): Promise<{ url: string; key: string }> {
  if (!isS3Configured) {
    // Return a local upload URL — the media router handles the actual upload
    return { url: `/media/local-upload/${encodeURIComponent(key)}`, key };
  }

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ...(maxSizeBytes ? { ContentLength: maxSizeBytes } : {}),
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return { url, key };
}

/**
 * Generate a presigned URL for downloading from S3.
 */
export async function getPresignedDownloadUrl(key: string): Promise<string> {
  if (!isS3Configured) {
    return `/api/media/local/${encodeURIComponent(key)}`;
  }

  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Upload a buffer directly to storage (used by media processing pipeline).
 */
export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (!isS3Configured) {
    const filePath = resolve(LOCAL_UPLOADS_DIR, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return getObjectUrl(key);
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  if (env.S3_ENDPOINT) {
    return `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`;
  }
  return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
}

/**
 * Get the public URL for a stored object.
 */
export function getObjectUrl(key: string): string {
  if (!isS3Configured) {
    return `/api/media/local/${encodeURIComponent(key)}`;
  }
  if (env.S3_ENDPOINT) {
    return `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`;
  }
  return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
}

/**
 * Delete an object from storage.
 */
export async function deleteObject(key: string): Promise<void> {
  if (!isS3Configured) {
    const filePath = resolve(LOCAL_UPLOADS_DIR, key);
    try {
      await fs.unlink(filePath);
    } catch {
      // File may not exist
    }
    return;
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    }),
  );
}

/**
 * Get the storage key for a processed media variant.
 */
export function getVariantKey(originalKey: string, variant: string, ext?: string): string {
  const dir = path.dirname(originalKey);
  const base = path.basename(originalKey, path.extname(originalKey));
  const extension = ext || path.extname(originalKey);
  return `${dir}/variants/${base}-${variant}${extension}`;
}

/**
 * Save a file to local storage (used by the local upload endpoint).
 */
export async function saveToLocalStorage(key: string, buffer: Buffer): Promise<string> {
  const filePath = resolve(LOCAL_UPLOADS_DIR, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return getObjectUrl(key);
}

/**
 * Read a file from local storage.
 */
export async function readFromLocalStorage(key: string): Promise<Buffer | null> {
  const filePath = resolve(LOCAL_UPLOADS_DIR, key);
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

/**
 * Download a stored object back to a Buffer.
 * Works with both S3 and local filesystem.
 */
export async function downloadBuffer(key: string): Promise<Buffer> {
  if (!isS3Configured) {
    const filePath = resolve(LOCAL_UPLOADS_DIR, key);
    return fs.readFile(filePath);
  }

  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  });

  const response = await s3Client.send(command);
  const stream = response.Body as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export { s3Client, LOCAL_UPLOADS_DIR };
