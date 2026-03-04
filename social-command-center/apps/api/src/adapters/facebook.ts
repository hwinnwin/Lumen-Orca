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

  async uploadMedia(params: MediaUploadParams & { description?: string }): Promise<MediaUploadResponse> {
    const { accessToken, fileBuffer, mimeType, pageId, description } = params;

    if (!pageId) throw new Error('Facebook requires a pageId for media upload');

    if (mimeType.startsWith('video/')) {
      return this.uploadVideo(accessToken, fileBuffer, pageId, description);
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

  /**
   * Upload and publish a video to a Facebook Page.
   * Uses a simple single-request form-data upload (works for files up to 1 GB).
   * The video is published directly with the description included.
   * Returns the video_id which doubles as the post ID.
   */
  private async uploadVideo(accessToken: string, fileBuffer: Buffer, pageId: string, description?: string): Promise<MediaUploadResponse> {
    console.log(`[Facebook] Uploading video (${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB) to page ${pageId}`);

    const formData = new FormData();
    formData.append('source', new Blob([new Uint8Array(fileBuffer)], { type: 'video/mp4' }), 'video.mp4');
    formData.append('access_token', accessToken);
    if (description) {
      formData.append('description', description);
    }

    const res = await fetch(`${GRAPH_API}/${pageId}/videos`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Facebook] Video upload failed:`, errorText);
      throw new Error(`Facebook video upload failed: ${errorText}`);
    }

    const data = await res.json() as { id: string };
    console.log(`[Facebook] Video uploaded successfully, video_id: ${data.id}`);
    return { platformMediaId: data.id, isVideo: true };
  }

  async publish(params: PublishParams): Promise<PublishResponse> {
    const { accessToken, content, platformMediaIds, pageId, platformSpecific } = params;

    if (!pageId) throw new Error('Facebook requires a pageId (Page ID) for publishing');

    const isVideo = platformSpecific?.mediaType === 'REELS';

    // Videos are already published during the upload phase (description included in finish step).
    // We just need to return the video ID. No separate feed post needed.
    if (isVideo && platformMediaIds?.length) {
      const videoId = platformMediaIds[0];
      console.log(`[Facebook] Video already published during upload: ${videoId}`);
      return {
        platformPostId: videoId,
        platformUrl: `https://www.facebook.com/${pageId}/videos/${videoId}`,
        publishedAt: new Date(),
      };
    }

    // Photo/text posts — publish via feed endpoint
    const formParams = new URLSearchParams();
    formParams.append('message', content);
    formParams.append('access_token', accessToken);

    // Attach pre-uploaded photo IDs
    if (platformMediaIds?.length) {
      platformMediaIds.forEach((id, i) => {
        formParams.append(`attached_media[${i}]`, JSON.stringify({ media_fbid: id }));
      });
    }

    const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
      method: 'POST',
      body: formParams,
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
