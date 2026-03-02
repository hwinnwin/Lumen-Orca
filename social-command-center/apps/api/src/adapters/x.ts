import type { PlatformAdapter, PublishParams, PublishResponse, MediaUploadParams, MediaUploadResponse, PostMetrics, ValidationResult } from './types.js';

const TWEETS_API = 'https://api.twitter.com/2';
const UPLOAD_API = 'https://upload.twitter.com/1.1/media/upload.json';
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

/**
 * X (Twitter) adapter.
 * CRITICAL: v2 for tweets, v1.1 for media upload.
 * Thread support via reply chaining.
 */
export class XAdapter implements PlatformAdapter {
  platform = 'X' as const;

  validateContent(content: string, _mediaCount = 0): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (content.length > 280) {
      errors.push(`Tweet exceeds 280 character limit (${content.length} chars)`);
    }
    if (content.length > 250) {
      warnings.push('Close to character limit — URLs count as 23 chars');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async uploadMedia(params: MediaUploadParams): Promise<MediaUploadResponse> {
    const { accessToken, fileBuffer, mimeType } = params;

    const isVideo = mimeType.startsWith('video/');
    const mediaCategory = isVideo ? 'tweet_video' : 'tweet_image';

    // Step 1: INIT
    const initBody = new URLSearchParams({
      command: 'INIT',
      total_bytes: fileBuffer.length.toString(),
      media_type: mimeType,
      media_category: mediaCategory,
    });

    const initRes = await fetch(UPLOAD_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: initBody,
    });

    if (!initRes.ok) {
      throw new Error(`X media INIT failed: ${await initRes.text()}`);
    }

    const initData = await initRes.json() as { media_id_string: string };
    const mediaId = initData.media_id_string;

    // Step 2: APPEND (chunked)
    let segmentIndex = 0;
    let offset = 0;

    while (offset < fileBuffer.length) {
      const chunk = fileBuffer.subarray(offset, offset + CHUNK_SIZE);
      const appendForm = new FormData();
      appendForm.append('command', 'APPEND');
      appendForm.append('media_id', mediaId);
      appendForm.append('segment_index', segmentIndex.toString());
      appendForm.append('media_data', new Blob([new Uint8Array(chunk)]));

      const appendRes = await fetch(UPLOAD_API, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: appendForm,
      });

      if (!appendRes.ok) {
        throw new Error(`X media APPEND failed at segment ${segmentIndex}: ${await appendRes.text()}`);
      }

      offset += CHUNK_SIZE;
      segmentIndex++;
    }

    // Step 3: FINALIZE
    const finalizeBody = new URLSearchParams({
      command: 'FINALIZE',
      media_id: mediaId,
    });

    const finalizeRes = await fetch(UPLOAD_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: finalizeBody,
    });

    if (!finalizeRes.ok) {
      throw new Error(`X media FINALIZE failed: ${await finalizeRes.text()}`);
    }

    const finalizeData = await finalizeRes.json() as {
      media_id_string: string;
      processing_info?: {
        state: string;
        check_after_secs: number;
      };
    };

    // Step 4: STATUS (poll for video processing)
    if (finalizeData.processing_info) {
      await this.waitForProcessing(mediaId, accessToken);
    }

    return { platformMediaId: mediaId };
  }

  private async waitForProcessing(mediaId: string, accessToken: string): Promise<void> {
    const maxAttempts = 60;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statusRes = await fetch(
        `${UPLOAD_API}?command=STATUS&media_id=${mediaId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!statusRes.ok) {
        throw new Error(`X media STATUS check failed: ${await statusRes.text()}`);
      }

      const statusData = await statusRes.json() as {
        processing_info: {
          state: string;
          check_after_secs?: number;
          error?: { message: string };
        };
      };

      if (statusData.processing_info.state === 'succeeded') return;
      if (statusData.processing_info.state === 'failed') {
        throw new Error(
          `X media processing failed: ${statusData.processing_info.error?.message || 'Unknown error'}`,
        );
      }

      const waitSecs = statusData.processing_info.check_after_secs || 5;
      await new Promise((r) => setTimeout(r, waitSecs * 1000));
    }

    throw new Error('X media processing timed out');
  }

  async publish(params: PublishParams): Promise<PublishResponse> {
    const { accessToken, content, platformMediaIds, platformSpecific } = params;

    const replyToId = platformSpecific?.replyToTweetId as string | undefined;

    const tweetBody: Record<string, unknown> = {
      text: content,
    };

    if (platformMediaIds?.length) {
      tweetBody.media = {
        media_ids: platformMediaIds,
      };
    }

    if (replyToId) {
      tweetBody.reply = {
        in_reply_to_tweet_id: replyToId,
      };
    }

    const res = await fetch(`${TWEETS_API}/tweets`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetBody),
    });

    if (!res.ok) {
      const errorText = await res.text();
      // Check for rate limit
      if (res.status === 429) {
        const retryAfter = res.headers.get('retry-after') || '60';
        throw new Error(`X rate limited. Retry after ${retryAfter}s. ${errorText}`);
      }
      throw new Error(`X publish failed: ${errorText}`);
    }

    const data = await res.json() as {
      data: { id: string; text: string };
    };

    return {
      platformPostId: data.data.id,
      platformUrl: `https://x.com/i/web/status/${data.data.id}`,
      publishedAt: new Date(),
    };
  }

  /**
   * Publish a thread (chain of reply tweets).
   */
  async publishThread(accessToken: string, tweets: string[], mediaIds?: string[][]): Promise<PublishResponse[]> {
    const results: PublishResponse[] = [];

    for (let i = 0; i < tweets.length; i++) {
      const result = await this.publish({
        accessToken,
        content: tweets[i],
        platformMediaIds: mediaIds?.[i],
        platformSpecific: i > 0 ? { replyToTweetId: results[i - 1].platformPostId } : undefined,
      });
      results.push(result);
    }

    return results;
  }

  async getMetrics(platformPostId: string, accessToken: string): Promise<PostMetrics> {
    const res = await fetch(
      `${TWEETS_API}/tweets/${platformPostId}?tweet.fields=public_metrics`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!res.ok) {
      console.warn(`Failed to fetch X metrics: ${await res.text()}`);
      return {};
    }

    const data = await res.json() as {
      data: {
        public_metrics: {
          retweet_count: number;
          reply_count: number;
          like_count: number;
          quote_count: number;
          impression_count: number;
        };
      };
    };

    return {
      likes: data.data.public_metrics.like_count,
      comments: data.data.public_metrics.reply_count,
      shares: data.data.public_metrics.retweet_count + data.data.public_metrics.quote_count,
      impressions: data.data.public_metrics.impression_count,
    };
  }
}
