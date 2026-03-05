import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { useComposeStore } from '../store/compose-store';

interface UploadResult {
  mediaId: string;
  key: string;
  uploadUrl: string;
  local?: boolean;
}

/**
 * Hook for uploading media files.
 * Supports both S3 presigned URL flow and local storage fallback.
 */
export function useMediaUpload() {
  const { updateMediaFile } = useComposeStore();

  return useMutation({
    mutationFn: async ({ file, index }: { file: File; index: number }): Promise<string> => {
      // Step 1: Get upload URL from API
      updateMediaFile(index, { status: 'uploading', progress: 10 });

      // Fallback content type if File.type is empty (e.g. some video formats)
      const contentType = file.type || (file.name.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream');
      const filename = file.name || 'upload';
      const fileSize = file.size;

      console.log(`[MediaUpload] Requesting upload URL: name="${filename}", type="${contentType}", size=${fileSize}`);

      if (!filename || !contentType || !fileSize) {
        throw new Error(`Invalid file: name="${filename}", type="${contentType}", size=${fileSize}`);
      }

      const urlRes = await api.post<{ data: UploadResult }>('/media/upload-url', {
        filename,
        contentType,
        fileSize,
      });

      const { mediaId, uploadUrl, local } = urlRes.data.data;
      updateMediaFile(index, { id: mediaId, progress: 30 });

      // Step 2: Upload file
      try {
        if (local) {
          // Local storage — upload through our API proxy
          await api.put(uploadUrl, file, {
            headers: { 'Content-Type': file.type },
          });
        } else {
          // S3 presigned URL — upload directly to S3
          await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
          });
        }
      } catch (uploadError) {
        console.warn('[Media] Upload failed:', uploadError);
      }

      updateMediaFile(index, { progress: 70 });

      // Step 3: Confirm upload to trigger processing
      await api.post(`/media/${mediaId}/confirm`);
      updateMediaFile(index, { status: 'processing', progress: 90 });

      // Mark as ready after a brief delay (processing happens async)
      setTimeout(() => {
        updateMediaFile(index, { status: 'ready', progress: 100 });
      }, 2000);

      return mediaId;
    },
    onError: (error, { index }) => {
      updateMediaFile(index, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    },
  });
}
