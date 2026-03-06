import type { PlatformAdapter, PublishParams, PublishResponse, MediaUploadParams, MediaUploadResponse, PostMetrics, ValidationResult } from './types.js';

const GRAPH_API = 'https://graph.facebook.com/v21.0';
const POLL_INTERVAL = 3000; // 3 seconds
const MAX_POLL_ATTEMPTS = 60; // 3 minutes max wait

/**
 * Instagram adapter — uses the Instagram Graph API via Facebook.
 * CRITICAL: Instagram publishing is a 2-step process:
 *   1. Create a media container
 *   2. Publish the container (after it finishes processing)
 *
 * Instagram REQUIRES publicly accessible media URLs.
 * Local URLs (localhost) will NOT work — use S3, Cloudflare R2, or a tunnel.
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
    if (mediaCount > 20) {
      errors.push('Instagram carousel allows a maximum of 20 items');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async uploadMedia(_params: MediaUploadParams): Promise<MediaUploadResponse> {
    throw new Error('Instagram uses URL-based media in container creation. Upload to S3 first.');
  }

  async publish(params: PublishParams): Promise<PublishResponse> {
    const { accessToken, content, mediaUrls, pageId, platformSpecific } = params;

    if (!pageId) throw new Error('Instagram requires pageId (IG User ID)');

    // Validate media URLs are publicly accessible
    const validUrls = (mediaUrls || []).filter((url) => {
      if (!url) return false;
      // Reject localhost/local-only URLs — Instagram can't reach them
      if (url.startsWith('/api/') || url.includes('localhost') || url.includes('127.0.0.1')) {
        console.warn(`[Instagram] Skipping local media URL (not reachable by Instagram): ${url}`);
        return false;
      }
      return true;
    });

    if (validUrls.length === 0 && (mediaUrls?.length || 0) > 0) {
      throw new Error(
        'Instagram requires publicly accessible media URLs. ' +
        'Local storage URLs cannot be reached by Instagram. ' +
        'Configure S3_BUCKET, S3_ACCESS_KEY, and S3_SECRET_KEY in your .env for cloud storage.',
      );
    }

    if (validUrls.length === 0) {
      throw new Error('Instagram posts require at least one image or video');
    }

    const mediaType = platformSpecific?.mediaType as string | undefined;

    // Carousel: multiple images/videos
    if (validUrls.length > 1) {
      return this.publishCarousel(accessToken, content, validUrls, pageId);
    }

    // Single post (image or reel)
    return this.publishSingle(accessToken, content, validUrls[0], pageId, mediaType);
  }

  private async publishSingle(
    accessToken: string,
    caption: string,
    mediaUrl: string,
    igUserId: string,
    mediaType?: string,
  ): Promise<PublishResponse> {
    // Step 1: Create media container
    const containerBody: Record<string, string> = {
      caption,
      access_token: accessToken,
    };

    const isVideo = mediaType === 'VIDEO' || mediaType === 'REELS' || this.isVideoUrl(mediaUrl);

    if (isVideo) {
      containerBody.media_type = 'REELS';
      containerBody.video_url = mediaUrl;
      containerBody.share_to_feed = 'true'; // Also share to feed, not just Reels tab
    } else {
      containerBody.image_url = mediaUrl;
    }

    console.log(`[Instagram] Creating ${isVideo ? 'REELS' : 'IMAGE'} container for IG user ${igUserId}`);

    const containerRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerBody),
    });

    if (!containerRes.ok) {
      const errorText = await containerRes.text();
      console.error(`[Instagram] Container creation failed:`, errorText);
      // Parse common Meta API errors for better diagnostics
      const diagnosticMsg = this.diagnoseMetaError(errorText);
      throw new Error(`Instagram container creation failed: ${diagnosticMsg || errorText}`);
    }

    const { id: containerId } = (await containerRes.json()) as { id: string };
    console.log(`[Instagram] Container created: ${containerId}, waiting for processing...`);

    // Step 2: Wait for container to finish processing
    await this.waitForContainer(containerId, accessToken);

    // Step 3: Publish the container
    const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    });

    if (!publishRes.ok) {
      const errorText = await publishRes.text();
      console.error(`[Instagram] Publish failed:`, errorText);
      const diagnosticMsg = this.diagnoseMetaError(errorText);
      throw new Error(`Instagram publish failed: ${diagnosticMsg || errorText}`);
    }

    const { id: mediaId } = (await publishRes.json()) as { id: string };
    console.log(`[Instagram] Published! Media ID: ${mediaId}`);

    // Fetch the permalink for the post URL
    const permalink = await this.getPermalink(mediaId, accessToken);

    return {
      platformPostId: mediaId,
      platformUrl: permalink || `https://www.instagram.com/`,
      publishedAt: new Date(),
    };
  }

  private async publishCarousel(
    accessToken: string,
    caption: string,
    mediaUrls: string[],
    igUserId: string,
  ): Promise<PublishResponse> {
    console.log(`[Instagram] Creating carousel with ${mediaUrls.length} items for IG user ${igUserId}`);

    // Create child containers (no caption on children)
    const childIds: string[] = [];

    for (const url of mediaUrls) {
      const isVideo = this.isVideoUrl(url);
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
        const errorText = await res.text();
        console.error(`[Instagram] Carousel item creation failed:`, errorText);
        const diagnosticMsg = this.diagnoseMetaError(errorText);
        throw new Error(`Instagram carousel item creation failed: ${diagnosticMsg || errorText}`);
      }

      const { id } = (await res.json()) as { id: string };
      console.log(`[Instagram] Carousel child ${childIds.length + 1} created: ${id}`);
      await this.waitForContainer(id, accessToken);
      childIds.push(id);
    }

    // Create carousel container with children as comma-separated string
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
      const errorText = await carouselRes.text();
      console.error(`[Instagram] Carousel creation failed:`, errorText);
      throw new Error(`Instagram carousel creation failed: ${errorText}`);
    }

    const { id: carouselId } = (await carouselRes.json()) as { id: string };
    console.log(`[Instagram] Carousel container created: ${carouselId}`);
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
      const errorText = await publishRes.text();
      console.error(`[Instagram] Carousel publish failed:`, errorText);
      throw new Error(`Instagram carousel publish failed: ${errorText}`);
    }

    const { id: mediaId } = (await publishRes.json()) as { id: string };
    console.log(`[Instagram] Carousel published! Media ID: ${mediaId}`);

    const permalink = await this.getPermalink(mediaId, accessToken);

    return {
      platformPostId: mediaId,
      platformUrl: permalink || `https://www.instagram.com/`,
      publishedAt: new Date(),
    };
  }

  private async waitForContainer(containerId: string, accessToken: string): Promise<void> {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      const res = await fetch(
        `${GRAPH_API}/${containerId}?fields=status_code,status&access_token=${accessToken}`,
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Instagram container status check failed: ${errorText}`);
      }

      const data = (await res.json()) as { status_code?: string; status?: string };

      if (data.status_code === 'FINISHED') return;
      if (data.status_code === 'ERROR') {
        throw new Error(`Instagram container processing failed. Status: ${data.status || 'unknown'}`);
      }

      // IN_PROGRESS — wait and retry
      if (attempt % 5 === 0) {
        console.log(`[Instagram] Container ${containerId} still processing (attempt ${attempt + 1}/${MAX_POLL_ATTEMPTS})...`);
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    }

    throw new Error('Instagram container processing timed out after 3 minutes');
  }

  /**
   * Get the permalink (public URL) for a published Instagram post.
   */
  private async getPermalink(mediaId: string, accessToken: string): Promise<string | null> {
    try {
      const res = await fetch(
        `${GRAPH_API}/${mediaId}?fields=permalink&access_token=${accessToken}`,
      );
      if (res.ok) {
        const data = (await res.json()) as { permalink?: string };
        return data.permalink || null;
      }
    } catch {
      // Non-fatal — we just won't have the permalink
    }
    return null;
  }

  /**
   * Detect if a URL points to a video based on file extension or content-type hints.
   */
  private isVideoUrl(url: string): boolean {
    const videoExtensions = /\.(mp4|mov|avi|wmv|webm|m4v|3gp)(\?|$)/i;
    return videoExtensions.test(url);
  }

  /**
   * Parse common Meta Graph API errors and return human-readable diagnostic messages.
   */
  private diagnoseMetaError(errorText: string): string | null {
    try {
      const parsed = JSON.parse(errorText);
      const code = parsed?.error?.code;
      const subcode = parsed?.error?.error_subcode;
      const msg = parsed?.error?.message || '';

      // Permission errors
      if (code === 10 || code === 200) {
        if (msg.includes('instagram_content_publish')) {
          return 'Missing instagram_content_publish permission. Ensure your Meta app has this permission approved (requires App Review for production, or add yourself as a test user in Meta Developer Dashboard).';
        }
        return `Permission denied (code ${code}). Check that your Meta app has the required permissions and the user has granted them. Error: ${msg}`;
      }

      // Invalid IG User ID
      if (code === 100 && msg.includes('does not exist')) {
        return 'Instagram Business Account ID not found. Ensure your Instagram account is a Business or Creator account linked to a Facebook Page.';
      }

      // Media URL not reachable
      if (code === 36003 || msg.includes('URL is not reachable') || msg.includes('download the media')) {
        return 'Instagram could not fetch the media URL. If using local storage, ensure your server is publicly accessible at APP_URL. Consider configuring S3 for reliable media hosting.';
      }

      // Token expired
      if (code === 190) {
        return 'Access token expired or invalid. The user needs to re-authenticate via Meta OAuth.';
      }

      // Rate limiting
      if (code === 4 || code === 32) {
        return `Rate limited by Instagram API. Wait a few minutes and try again. Error: ${msg}`;
      }

      // App not in live mode
      if (subcode === 33 || msg.includes('app is in development mode')) {
        return 'Meta app is in development mode. Only test users can publish. Either add yourself as a test user in the Meta Developer Dashboard, or submit your app for App Review to go live.';
      }

      return null;
    } catch {
      return null;
    }
  }

  async getMetrics(platformPostId: string, accessToken: string): Promise<PostMetrics> {
    const res = await fetch(
      `${GRAPH_API}/${platformPostId}?fields=like_count,comments_count,insights.metric(impressions,reach,saved)&access_token=${accessToken}`,
    );

    if (!res.ok) {
      console.warn(`Failed to fetch Instagram metrics: ${await res.text()}`);
      return {};
    }

    const data = (await res.json()) as {
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
