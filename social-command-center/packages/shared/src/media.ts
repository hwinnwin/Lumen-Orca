export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}

export enum MediaStatus {
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9';

export interface MediaVariant {
  aspectRatio: AspectRatio;
  url: string;
  key: string;
  width: number;
  height: number;
}

export interface MediaAsset {
  id: string;
  userId: string;
  originalUrl: string;
  originalKey: string;
  type: MediaType;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  altText: string | null;
  thumbnailUrl: string | null;
  variants: MediaVariant[];
  status: MediaStatus;
  createdAt: string;
}

export interface UploadUrlRequest {
  filename: string;
  contentType: string;
  fileSize: number;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  mediaId: string;
  key: string;
}

export interface PlatformMediaLimits {
  maxImageSize: number;
  maxVideoSize: number;
  maxVideoDuration: number;
  supportedImageFormats: string[];
  supportedVideoFormats: string[];
  maxImagesPerPost: number;
  maxVideosPerPost: number;
}
