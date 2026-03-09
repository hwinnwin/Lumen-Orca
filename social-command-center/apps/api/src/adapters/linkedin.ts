import type { PlatformAdapter, PublishParams, PublishResponse, MediaUploadParams, MediaUploadResponse, PostMetrics, ValidationResult } from './types.js';

const API_BASE = 'https://api.linkedin.com';
const API_VERSION = '202602';

/**
 * LinkedIn adapter — uses the LinkedIn Posts API (v2).
 * Media upload is multi-step: register upload → PUT binary → reference URN in post.
 */
export class LinkedInAdapter implements PlatformAdapter {
  platform = 'LINKEDIN' as const;

  validateContent(content: string, mediaCount = 0): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (content.length > 3000) {
      errors.push(`Content exceeds LinkedIn's 3,000 character limit (${content.length} chars)`);
    }
    if (content.length > 1300) {
      warnings.push('Posts over 1,300 characters will be truncated with "see more"');
    }
    if (mediaCount > 20) {
      errors.push('LinkedIn allows a maximum of 20 images per post');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async uploadMedia(params: MediaUploadParams): Promise<MediaUploadResponse> {
    const { accessToken, fileBuffer, mimeType } = params;

    const isVideo = mimeType.startsWith('video/');
    const endpoint = isVideo ? '/rest/videos' : '/rest/images';

    // Step 1: Register upload
    const registerBody = isVideo
      ? {
          initializeUploadRequest: {
            owner: `urn:li:person:${params.pageId}`, // Using pageId as memberUrn here
            fileSizeBytes: fileBuffer.length,
            uploadCaptions: false,
            uploadThumbnail: false,
          },
        }
      : {
          initializeUploadRequest: {
            owner: `urn:li:person:${params.pageId}`,
          },
        };

    const registerRes = await fetch(`${API_BASE}${endpoint}?action=initializeUpload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': API_VERSION,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(registerBody),
    });

    if (!registerRes.ok) {
      throw new Error(`LinkedIn upload registration failed: ${await registerRes.text()}`);
    }

    const registerData = await registerRes.json() as {
      value: {
        uploadUrl: string;
        image?: string;
        video?: string;
      };
    };

    // Step 2: Upload binary
    const uploadRes = await fetch(registerData.value.uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': mimeType,
      },
      body: new Uint8Array(fileBuffer),
    });

    if (!uploadRes.ok) {
      throw new Error(`LinkedIn binary upload failed: ${await uploadRes.text()}`);
    }

    const assetUrn = registerData.value.image || registerData.value.video || '';

    return { platformMediaId: assetUrn };
  }

  async publish(params: PublishParams): Promise<PublishResponse> {
    const { accessToken, content, platformMediaIds, platformSpecific } = params;

    const memberUrn = platformSpecific?.memberUrn as string;
    if (!memberUrn) throw new Error('LinkedIn requires memberUrn for publishing');

    const postBody: Record<string, unknown> = {
      author: `urn:li:person:${memberUrn}`,
      commentary: content,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
    };

    // Attach media if present
    if (platformMediaIds?.length === 1) {
      // Single image — use the simple media content type
      postBody.content = {
        media: {
          title: '',
          id: platformMediaIds[0],
        },
      };
    } else if (platformMediaIds && platformMediaIds.length >= 2) {
      // Multiple images — use LinkedIn's multiImage content type (2-20 images)
      postBody.content = {
        multiImage: {
          images: platformMediaIds.map((id) => ({ id })),
        },
      };
    }

    const res = await fetch(`${API_BASE}/rest/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': API_VERSION,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postBody),
    });

    if (!res.ok) {
      throw new Error(`LinkedIn publish failed: ${await res.text()}`);
    }

    // LinkedIn returns the post URN in the x-restli-id header
    const postUrn = res.headers.get('x-restli-id') || '';

    return {
      platformPostId: postUrn,
      platformUrl: postUrn
        ? `https://www.linkedin.com/feed/update/${postUrn}/`
        : null,
      publishedAt: new Date(),
    };
  }

  async getMetrics(platformPostId: string, accessToken: string): Promise<PostMetrics> {
    // Use socialMetadata API (replaces deprecated socialActions).
    // Requires w_member_social scope (already granted).
    // Returns reactionSummaries (by type) and commentSummary (count + topLevelCount).
    const encodedUrn = encodeURIComponent(platformPostId);
    const res = await fetch(
      `${API_BASE}/rest/socialMetadata/${encodedUrn}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'LinkedIn-Version': API_VERSION,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.log(`[LinkedIn] socialMetadata error ${res.status} for ${platformPostId}: ${errText.slice(0, 300)}`);
      return {};
    }

    const rawBody = await res.text();
    console.log(`[LinkedIn] socialMetadata response for ${platformPostId}: ${rawBody.slice(0, 500)}`);

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawBody);
    } catch {
      console.log(`[LinkedIn] Failed to parse socialMetadata response for ${platformPostId}`);
      return {};
    }

    // Sum all reaction types (LIKE, PRAISE, EMPATHY, INTEREST, MAYBE, APPRECIATION)
    let totalReactions = 0;
    const reactionSummaries = data.reactionSummaries as Record<string, { count?: number }> | undefined;
    if (reactionSummaries) {
      for (const reaction of Object.values(reactionSummaries)) {
        totalReactions += reaction.count ?? 0;
      }
    }

    const commentSummary = data.commentSummary as { count?: number; topLevelCount?: number } | undefined;

    const metrics: PostMetrics = {
      likes: totalReactions,
      comments: commentSummary?.topLevelCount ?? commentSummary?.count ?? 0,
    };

    console.log(`[LinkedIn] Metrics for ${platformPostId}: reactions=${metrics.likes} comments=${metrics.comments}`);
    return metrics;
  }
}
