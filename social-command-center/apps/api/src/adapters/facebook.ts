import type { PlatformAdapter, PublishParams, PublishResponse, MediaUploadParams, MediaUploadResponse, PostMetrics, ValidationResult } from './types.js';

const GRAPH_API = 'https://graph.facebook.com/v21.0';

export class FacebookAdapter implements PlatformAdapter {
  platform = 'FACEBOOK' as const;

  validateContent(content: string, mediaCount = 0): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (content.length > 63206) {
      errors.push(`Content exceeds Facebook's 63,206 character limit (${content.length} chars)`);
    }
    if (content.length > 5000) {
      warnings.push('Posts over 5,000 characters may be truncated in previews');
    }
    if (mediaCount > 10) {
      errors.push('Facebook allows a maximum of 10 images per post');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async uploadMedia(params: MediaUploadParams): Promise<MediaUploadResponse> {
    const { accessToken, fileBuffer, mimeType, pageId } = params;

    if (!pageId) throw new Error('Facebook requires a pageId for media upload');

    if (mimeType.startsWith('video/')) {
      return this.uploadVideo(accessToken, fileBuffer, pageId);
    }

    // Image upload — upload as unpublished photo
    const formData = new FormData();
    formData.append('source', new Blob([new Uint8Array(fileBuffer)], { type: mimeType }));
    formData.append('published', 'false');
    formData.append('access_token', accessToken);

    const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Facebook image upload failed: ${await res.text()}`);
    }

    const data = await res.json() as { id: string };
    return { platformMediaId: data.id };
  }

  private async uploadVideo(accessToken: string, fileBuffer: Buffer, pageId: string): Promise<MediaUploadResponse> {
    // Resumable upload for video
    // Step 1: Start upload
    const startRes = await fetch(`${GRAPH_API}/${pageId}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        upload_phase: 'start',
        file_size: fileBuffer.length,
        access_token: accessToken,
      }),
    });

    if (!startRes.ok) {
      throw new Error(`Facebook video upload start failed: ${await startRes.text()}`);
    }

    const startData = await startRes.json() as {
      video_id: string;
      upload_session_id: string;
      start_offset: string;
      end_offset: string;
    };

    // Step 2: Upload chunks
    let startOffset = parseInt(startData.start_offset);
    let endOffset = parseInt(startData.end_offset);

    while (startOffset < fileBuffer.length) {
      const chunk = fileBuffer.subarray(startOffset, endOffset);
      const chunkForm = new FormData();
      chunkForm.append('upload_phase', 'transfer');
      chunkForm.append('upload_session_id', startData.upload_session_id);
      chunkForm.append('start_offset', startOffset.toString());
      chunkForm.append('video_file_chunk', new Blob([new Uint8Array(chunk)]));
      chunkForm.append('access_token', accessToken);

      const chunkRes = await fetch(`${GRAPH_API}/${pageId}/videos`, {
        method: 'POST',
        body: chunkForm,
      });

      if (!chunkRes.ok) {
        throw new Error(`Facebook video chunk upload failed: ${await chunkRes.text()}`);
      }

      const chunkData = await chunkRes.json() as {
        start_offset: string;
        end_offset: string;
      };
      startOffset = parseInt(chunkData.start_offset);
      endOffset = parseInt(chunkData.end_offset);
    }

    // Step 3: Finish upload
    const finishRes = await fetch(`${GRAPH_API}/${pageId}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        upload_phase: 'finish',
        upload_session_id: startData.upload_session_id,
        access_token: accessToken,
      }),
    });

    if (!finishRes.ok) {
      throw new Error(`Facebook video upload finish failed: ${await finishRes.text()}`);
    }

    return { platformMediaId: startData.video_id };
  }

  async publish(params: PublishParams): Promise<PublishResponse> {
    const { accessToken, content, platformMediaIds, pageId } = params;

    if (!pageId) throw new Error('Facebook requires a pageId (Page ID) for publishing');

    const body: Record<string, unknown> = {
      message: content,
      access_token: accessToken,
    };

    // If there are pre-uploaded photo IDs, attach them
    if (platformMediaIds?.length) {
      platformMediaIds.forEach((id, i) => {
        body[`attached_media[${i}]`] = `{"media_fbid":"${id}"}`;
      });
    }

    const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Facebook publish failed: ${error}`);
    }

    const data = await res.json() as { id: string };
    return {
      platformPostId: data.id,
      platformUrl: `https://www.facebook.com/${data.id}`,
      publishedAt: new Date(),
    };
  }

  async getMetrics(platformPostId: string, accessToken: string): Promise<PostMetrics> {
    const res = await fetch(
      `${GRAPH_API}/${platformPostId}?fields=insights.metric(post_impressions,post_engaged_users,post_reactions_by_type_total)&access_token=${accessToken}`,
    );

    if (!res.ok) {
      console.warn(`Failed to fetch Facebook metrics: ${await res.text()}`);
      return {};
    }

    const data = await res.json() as {
      insights?: { data: Array<{ name: string; values: Array<{ value: number }> }> };
    };

    const metrics: PostMetrics = {};
    if (data.insights?.data) {
      for (const insight of data.insights.data) {
        const value = insight.values?.[0]?.value ?? 0;
        if (insight.name === 'post_impressions') metrics.impressions = value;
        if (insight.name === 'post_engaged_users') metrics.clicks = value;
      }
    }

    return metrics;
  }
}
