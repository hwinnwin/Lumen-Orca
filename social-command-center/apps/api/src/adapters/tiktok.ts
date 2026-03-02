import type { PlatformAdapter, PublishParams, PublishResponse, MediaUploadParams, MediaUploadResponse, PostMetrics, ValidationResult } from './types.js';

const API_BASE = 'https://open.tiktokapis.com/v2';

/**
 * TikTok adapter — Content Posting API v2.
 * CRITICAL: Posts go to creator's inbox by default, not published directly.
 * Direct posting requires additional app review approval from TikTok.
 */
export class TikTokAdapter implements PlatformAdapter {
  platform = 'TIKTOK' as const;

  validateContent(content: string, _mediaCount = 0): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (content.length > 2200) {
      errors.push(`Caption exceeds TikTok's 2,200 character limit (${content.length} chars)`);
    }

    warnings.push('TikTok API posts go to creator inbox for review (unless Direct Post permission is granted)');

    return { valid: errors.length === 0, errors, warnings };
  }

  async uploadMedia(_params: MediaUploadParams): Promise<MediaUploadResponse> {
    // TikTok upload happens as part of the publish flow
    throw new Error('TikTok media upload is part of the publish flow. Use publish() directly.');
  }

  async publish(params: PublishParams): Promise<PublishResponse> {
    const { accessToken, content, mediaUrls, platformSpecific } = params;

    const mediaType = platformSpecific?.mediaType as string || 'VIDEO';
    const privacyLevel = platformSpecific?.privacyLevel as string || 'SELF_ONLY';

    if (mediaType === 'PHOTO' && mediaUrls?.length) {
      return this.publishPhoto(accessToken, content, mediaUrls, privacyLevel);
    }

    return this.publishVideo(accessToken, content, mediaUrls?.[0] || '', privacyLevel);
  }

  private async publishVideo(
    accessToken: string,
    caption: string,
    videoUrl: string,
    privacyLevel: string,
  ): Promise<PublishResponse> {
    const body = {
      post_info: {
        title: caption,
        privacy_level: privacyLevel,
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: 'PULL_FROM_URL' as const,
        video_url: videoUrl,
      },
    };

    const res = await fetch(`${API_BASE}/post/publish/video/init/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`TikTok video publish init failed: ${await res.text()}`);
    }

    const data = await res.json() as {
      data: {
        publish_id: string;
      };
      error: { code: string; message: string };
    };

    if (data.error?.code !== 'ok') {
      throw new Error(`TikTok publish error: ${data.error.message}`);
    }

    // Poll for publish status
    const publishId = data.data.publish_id;
    const finalStatus = await this.waitForPublish(publishId, accessToken);

    return {
      platformPostId: publishId,
      platformUrl: finalStatus.url || null,
      publishedAt: new Date(),
    };
  }

  private async publishPhoto(
    accessToken: string,
    caption: string,
    photoUrls: string[],
    privacyLevel: string,
  ): Promise<PublishResponse> {
    const body = {
      post_info: {
        title: caption,
        privacy_level: privacyLevel,
        disable_comment: false,
      },
      source_info: {
        source: 'PULL_FROM_URL' as const,
        photo_cover_index: 0,
        photo_images: photoUrls,
      },
      media_type: 'PHOTO',
    };

    const res = await fetch(`${API_BASE}/post/publish/content/init/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`TikTok photo publish init failed: ${await res.text()}`);
    }

    const data = await res.json() as {
      data: { publish_id: string };
      error: { code: string; message: string };
    };

    if (data.error?.code !== 'ok') {
      throw new Error(`TikTok publish error: ${data.error.message}`);
    }

    return {
      platformPostId: data.data.publish_id,
      platformUrl: null,
      publishedAt: new Date(),
    };
  }

  private async waitForPublish(
    publishId: string,
    accessToken: string,
  ): Promise<{ url?: string }> {
    const maxAttempts = 30;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const res = await fetch(`${API_BASE}/post/publish/status/fetch/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publish_id: publishId }),
      });

      if (!res.ok) {
        throw new Error(`TikTok status check failed: ${await res.text()}`);
      }

      const data = await res.json() as {
        data: {
          status: string;
          publicaly_available_post_id?: string[];
        };
      };

      if (data.data.status === 'PUBLISH_COMPLETE') {
        const postId = data.data.publicaly_available_post_id?.[0];
        return { url: postId ? `https://www.tiktok.com/@/video/${postId}` : undefined };
      }

      if (data.data.status === 'FAILED') {
        throw new Error('TikTok publish failed');
      }

      // PROCESSING_UPLOAD or SENDING_TO_USER_INBOX
      await new Promise((r) => setTimeout(r, 5000));
    }

    // If we've exhausted attempts, the post might be in the inbox
    return {};
  }

  async getMetrics(_platformPostId: string, _accessToken: string): Promise<PostMetrics> {
    // TikTok metrics API requires additional scopes
    // Return empty metrics for now
    return {};
  }
}
