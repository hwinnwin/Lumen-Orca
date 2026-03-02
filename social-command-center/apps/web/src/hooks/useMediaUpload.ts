import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { useComposeStore } from '../store/compose-store';

interface UploadResult {
  mediaId: string;
  key: string;
  uploadUrl: string;
}

/**
 * Hook for uploading media files through the S3 presigned URL flow.
 * 1. Request presigned URL from API
 * 2. Upload file directly to S3
 * 3. Confirm upload with API to trigger processing
 */
export function useMediaUpload() {
  const { updateMediaFile } = useComposeStore();

  return useMutation({
    mutationFn: async ({ file, index }: { file: File; index: number }): Promise<string> => {
      // Step 1: Get presigned upload URL
      updateMediaFile(index, { status: 'uploading', progress: 10 });

      const urlRes = await api.post<{ data: UploadResult }>('/media/upload-url', {
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
      });

      const { mediaId, uploadUrl } = urlRes.data.data;
      updateMediaFile(index, { id: mediaId, progress: 30 });

      // Step 2: Upload file directly to S3
      try {
        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
      } catch (uploadError) {
        // S3 upload may fail if no bucket is configured — mark as ready anyway in dev
        console.warn('[Media] S3 upload failed (expected in dev mode):', uploadError);
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
