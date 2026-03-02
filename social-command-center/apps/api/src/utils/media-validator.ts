import type { Platform } from '@prisma/client';

interface PlatformMediaConstraints {
  image: {
    maxSizeMb: number;
    formats: string[];
    maxWidth?: number;
    maxHeight?: number;
  };
  video: {
    maxSizeMb: number;
    maxDurationSec: number;
    formats: string[];
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
  carousel?: {
    maxItems: number;
  };
}

const CONSTRAINTS: Record<Platform, PlatformMediaConstraints> = {
  FACEBOOK: {
    image: { maxSizeMb: 10, formats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] },
    video: { maxSizeMb: 4096, maxDurationSec: 240 * 60, formats: ['video/mp4', 'video/mov'] },
  },
  INSTAGRAM: {
    image: { maxSizeMb: 8, formats: ['image/jpeg', 'image/png'], maxWidth: 1936, maxHeight: 1936 },
    video: {
      maxSizeMb: 100,
      maxDurationSec: 90,
      formats: ['video/mp4'],
      minWidth: 500,
      minHeight: 500,
    },
    carousel: { maxItems: 10 },
  },
  LINKEDIN: {
    image: { maxSizeMb: 10, formats: ['image/jpeg', 'image/png', 'image/gif'] },
    video: { maxSizeMb: 200, maxDurationSec: 600, formats: ['video/mp4'] },
  },
  X: {
    image: { maxSizeMb: 5, formats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] },
    video: { maxSizeMb: 512, maxDurationSec: 140, formats: ['video/mp4'] },
  },
  TIKTOK: {
    image: { maxSizeMb: 10, formats: ['image/jpeg', 'image/png', 'image/webp'] },
    video: {
      maxSizeMb: 4096,
      maxDurationSec: 600,
      formats: ['video/mp4', 'video/webm'],
      minWidth: 360,
      minHeight: 360,
    },
  },
  YOUTUBE: {
    image: { maxSizeMb: 2, formats: ['image/jpeg', 'image/png'] },
    video: {
      maxSizeMb: 128 * 1024, // 128 GB
      maxDurationSec: 12 * 3600,
      formats: ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/flv', 'video/webm'],
    },
  },
};

export interface ValidationError {
  field: string;
  message: string;
}

export function validateMedia(
  platform: Platform,
  mimeType: string,
  fileSizeBytes: number,
  durationSec?: number,
  width?: number,
  height?: number,
): ValidationError[] {
  const constraints = CONSTRAINTS[platform];
  const errors: ValidationError[] = [];
  const isVideo = mimeType.startsWith('video/');
  const isImage = mimeType.startsWith('image/');

  if (!isVideo && !isImage) {
    errors.push({ field: 'mimeType', message: `Unsupported media type: ${mimeType}` });
    return errors;
  }

  if (isImage) {
    const c = constraints.image;
    if (!c.formats.includes(mimeType)) {
      errors.push({ field: 'format', message: `${platform} does not support ${mimeType}. Supported: ${c.formats.join(', ')}` });
    }
    if (fileSizeBytes > c.maxSizeMb * 1024 * 1024) {
      errors.push({ field: 'size', message: `Image exceeds ${c.maxSizeMb}MB limit for ${platform}` });
    }
    if (c.maxWidth && width && width > c.maxWidth) {
      errors.push({ field: 'width', message: `Image width ${width}px exceeds ${c.maxWidth}px limit` });
    }
    if (c.maxHeight && height && height > c.maxHeight) {
      errors.push({ field: 'height', message: `Image height ${height}px exceeds ${c.maxHeight}px limit` });
    }
  }

  if (isVideo) {
    const c = constraints.video;
    if (!c.formats.includes(mimeType)) {
      errors.push({ field: 'format', message: `${platform} does not support ${mimeType}. Supported: ${c.formats.join(', ')}` });
    }
    if (fileSizeBytes > c.maxSizeMb * 1024 * 1024) {
      errors.push({ field: 'size', message: `Video exceeds ${c.maxSizeMb}MB limit for ${platform}` });
    }
    if (durationSec && durationSec > c.maxDurationSec) {
      errors.push({ field: 'duration', message: `Video exceeds ${c.maxDurationSec}s duration limit for ${platform}` });
    }
    if (c.minWidth && width && width < c.minWidth) {
      errors.push({ field: 'width', message: `Video width ${width}px below ${c.minWidth}px minimum` });
    }
    if (c.minHeight && height && height < c.minHeight) {
      errors.push({ field: 'height', message: `Video height ${height}px below ${c.minHeight}px minimum` });
    }
  }

  return errors;
}

export function validateCarousel(platform: Platform, itemCount: number): ValidationError[] {
  const constraints = CONSTRAINTS[platform];
  if (!constraints.carousel) {
    return [{ field: 'carousel', message: `${platform} does not support carousel posts` }];
  }
  if (itemCount > constraints.carousel.maxItems) {
    return [{ field: 'carousel', message: `Max ${constraints.carousel.maxItems} items for ${platform} carousel` }];
  }
  return [];
}

export { CONSTRAINTS as PLATFORM_MEDIA_CONSTRAINTS };
