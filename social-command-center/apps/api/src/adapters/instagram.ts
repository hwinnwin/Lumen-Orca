import type { PlatformAdapter, PublishParams, PublishResponse, MediaUploadParams, MediaUploadResponse, PostMetrics, ValidationResult } from './types.js';

const GRAPH_API = 'https://graph.facebook.com/v19.0';
const POLL_INTERVAL = 3000; // 3 seconds
const MAX_POLL_ATTEMPTS = 60; // 3 minutes max wait

/**
 * Instagram adapter — uses the Instagram Graph API via Facebook.
 * CRITICAL: Instagram publishing is a 2-step process:
 *   1. Create a media container
 *   2. Publish the container (after it finishes processing)
 */
export class InstagramAdapter implements PlatformAdapter {
  platform = 'INSTAGRAM' as const;

  validateContent(content: string, mediaCount = 0): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (content.length > 2200) {
      errors.push(`Caption exceeds Instagram's 2,200 character limit (${content.length} chars)`);
    }

    const hashtagCount = (content.match(/#\w+/g) || []).length;
    if (hashtagCount > 30) {
      errors.push(`Instagram allows a maximum of 30 hashtags (found ${hashtagCount})`);
    }
    if (hashtagCount > 10) {
      warnings.push('Using more than 10 hashtags may reduce reach');
    }

    if (mediaCount === 0) {
      errors.push('Instagram posts require at least one image or video');
    }
    if (mediaCount > 10) {
      errors.push('Instagram carousel allows a maximum of 10 items');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async uploadMedia(_params: MediaUploadParams): Promise<MediaUploadResponse> {
    // Instagram doesn't have a separate media upload step.
    // Media URLs are passed directly to the container creation.
    // The media must be publicly accessible.
    throw new Error('Instagram uses URL-based media in container creation. Upload to S3 first.');
  }

  async publish(params: PublishParams): Promise<PublishResponse> {
    const { accessToken, content, mediaUrls, pageId, platformSpecific } = params;

    if (!pageId) throw new Error('Instagram requires pageId (IG User ID)');

    const mediaType = platformSpecific?.mediaType as string | undefined;

    if (mediaUrls && mediaUrls.length > 1) {
      return this.publishCarousel(accessToken, content, mediaUrls, pageId);
    }

    // Step 1: Create media container
    const containerBody: Record<string, string> = {
      caption: content,
      access_token: accessToken,
    };

    if (mediaUrls?.[0]) {
      if (mediaType === 'VIDEO' || mediaType === 'REELS') {
        containerBody.media_type = 'REELS';
        containerBody.video_url = mediaUrls[0];
      } else {
        containerBody.image_url = mediaUrls[0];
      }
    }

    const containerRes = await fetch(`${GRAPH_API}/${pageId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerBody),
    });

    if (!containerRes.ok) {
      throw new Error(`Instagram container creation failed: ${await containerRes.text()}`);
    }

    const { id: containerId } = await containerRes.json() as { id: string };

    // Step 2: Wait for container to finish processing
    await this.waitForContainer(containerId, accessToken);

    // Step 3: Publish the container
    const publishRes = await fetch(`${GRAPH_API}/${pageId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    });

    if (!publishRes.ok) {
      throw new Error(`Instagram publish failed: ${await publishRes.text()}`);
    }

    const { id: mediaId } = await publishRes.json() as { id: string };

    return {
      platformPostId: mediaId,
      platformUrl: `https://www.instagram.com/p/${mediaId}/`,
      publishedAt: new Date(),
    };
  }

  private async publishCarousel(
    accessToken: string,
    caption: string,
    mediaUrls: string[],
    igUserId: string,
  ): Promise<PublishResponse> {
    // Create child containers (no caption on children)
    const childIds: string[] = [];

    for (const url of mediaUrls) {
      const isVideo = url.match(/\.(mp4|mov|avi|wmv)$/i);
      const body: Record<string, string> = {
        access_token: accessToken,
        is_carousel_item: 'true',
      };
      if (isVideo) {
        body.media_type = 'VIDEO';
        body.video_url = url;
      } else {
        body.image_url = url;
      }

      const res = await fetch(`${GRAPH_API}/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`Instagram carousel item creation failed: ${await res.text()}`);
      }

      const { id } = await res.json() as { id: string };
      await this.waitForContainer(id, accessToken);
      childIds.push(id);
    }

    // Create carousel container
    const carouselRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        caption,
        children: childIds,
        access_token: accessToken,
      }),
    });

    if (!carouselRes.ok) {
      throw new Error(`Instagram carousel creation failed: ${await carouselRes.text()}`);
    }

    const { id: carouselId } = await carouselRes.json() as { id: string };
    await this.waitForContainer(carouselId, accessToken);

    // Publish carousel
    const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: carouselId,
        access_token: accessToken,
      }),
    });

    if (!publishRes.ok) {
      throw new Error(`Instagram carousel publish failed: ${await publishRes.text()}`);
    }

    const { id: mediaId } = await publishRes.json() as { id: string };

    return {
      platformPostId: mediaId,
      platformUrl: `https://www.instagram.com/p/${mediaId}/`,
      publishedAt: new Date(),
    };
  }

  private async waitForContainer(containerId: string, accessToken: string): Promise<void> {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      const res = await fetch(
        `${GRAPH_API}/${containerId}?fields=status_code&access_token=${accessToken}`,
      );

      if (!res.ok) {
        throw new Error(`Instagram container status check failed: ${await res.text()}`);
      }

      const data = await res.json() as { status_code: string };

      if (data.status_code === 'FINISHED') return;
      if (data.status_code === 'ERROR') {
        throw new Error('Instagram container processing failed');
      }

      // status_code is 'IN_PROGRESS' — wait and retry
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    }

    throw new Error('Instagram container processing timed out');
  }

  async getMetrics(platformPostId: string, accessToken: string): Promise<PostMetrics> {
    const res = await fetch(
      `${GRAPH_API}/${platformPostId}?fields=like_count,comments_count,insights.metric(impressions,reach,saved)&access_token=${accessToken}`,
    );

    if (!res.ok) {
      console.warn(`Failed to fetch Instagram metrics: ${await res.text()}`);
      return {};
    }

    const data = await res.json() as {
      like_count?: number;
      comments_count?: number;
      insights?: { data: Array<{ name: string; values: Array<{ value: number }> }> };
    };

    const metrics: PostMetrics = {
      likes: data.like_count,
      comments: data.comments_count,
    };

    if (data.insights?.data) {
      for (const insight of data.insights.data) {
        const value = insight.values?.[0]?.value ?? 0;
        if (insight.name === 'impressions') metrics.impressions = value;
        if (insight.name === 'reach') metrics.reach = value;
        if (insight.name === 'saved') metrics.saves = value;
      }
    }

    return metrics;
  }
}
