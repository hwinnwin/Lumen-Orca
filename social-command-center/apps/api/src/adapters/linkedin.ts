import type { PlatformAdapter, PublishParams, PublishResponse, MediaUploadParams, MediaUploadResponse, PostMetrics, ValidationResult } from './types.js';

const API_BASE = 'https://api.linkedin.com';
const API_VERSION = '202401';

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
    if (platformMediaIds?.length) {
      postBody.content = {
        media: {
          title: '',
          id: platformMediaIds[0], // LinkedIn supports one media per post via this method
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
    // LinkedIn analytics requires additional permissions
    // Basic metrics can be fetched from the post itself
    const res = await fetch(
      `${API_BASE}/rest/socialActions/${platformPostId}?${new URLSearchParams({
        action: 'getSummary',
      })}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'LinkedIn-Version': API_VERSION,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      },
    );

    if (!res.ok) {
      console.warn(`Failed to fetch LinkedIn metrics: ${await res.text()}`);
      return {};
    }

    const data = await res.json() as {
      likesSummary?: { totalLikes: number };
      commentsSummary?: { totalFirstLevelComments: number };
      shareSummary?: { totalShares: number };
    };

    return {
      likes: data.likesSummary?.totalLikes,
      comments: data.commentsSummary?.totalFirstLevelComments,
      shares: data.shareSummary?.totalShares,
    };
  }
}
