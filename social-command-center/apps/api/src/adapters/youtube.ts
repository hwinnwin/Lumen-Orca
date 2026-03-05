import type { PlatformAdapter, PublishParams, PublishResponse, MediaUploadParams, MediaUploadResponse, PostMetrics, ValidationResult } from './types.js';

const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/youtube/v3';
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

/**
 * YouTube adapter — YouTube Data API v3 with resumable upload protocol.
 * CRITICAL: Each upload costs 1600 quota units. Daily limit is 10,000 units (~6 uploads/day).
 */
export class YouTubeAdapter implements PlatformAdapter {
  platform = 'YOUTUBE' as const;

  validateContent(content: string, _mediaCount = 0): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (content.length > 5000) {
      errors.push(`Description exceeds YouTube's 5,000 character limit (${content.length} chars)`);
    }

    warnings.push('YouTube upload costs 1,600 API quota units (~6 uploads/day on default quota)');

    return { valid: errors.length === 0, errors, warnings };
  }

  async uploadMedia(_params: MediaUploadParams): Promise<MediaUploadResponse> {
    // YouTube media upload is part of the video publish flow
    throw new Error('YouTube media upload is integrated with publish(). Use publish() directly.');
  }

  async publish(params: PublishParams): Promise<PublishResponse> {
    const { accessToken, content, platformSpecific } = params;

    const title = (platformSpecific?.title as string) || content.substring(0, 100);
    const description = content;
    const tags = (platformSpecific?.tags as string[]) || [];
    const privacyStatus = (platformSpecific?.privacyStatus as string) || 'public';
    const isShort = (platformSpecific?.isShort as boolean) || false;
    const videoBuffer = platformSpecific?.videoBuffer as Buffer;

    if (!videoBuffer) {
      throw new Error('YouTube requires a video buffer for publishing');
    }

    // For Shorts, add #Shorts to title
    const finalTitle = isShort && !title.includes('#Shorts')
      ? `${title} #Shorts`
      : title;

    // Step 1: Initiate resumable upload
    const metadata = {
      snippet: {
        title: finalTitle,
        description,
        tags,
        categoryId: '22', // People & Blogs (default)
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    };

    const initRes = await fetch(
      `${UPLOAD_API}/videos?uploadType=resumable&part=snippet,status`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Length': videoBuffer.length.toString(),
          'X-Upload-Content-Type': 'video/mp4',
        },
        body: JSON.stringify(metadata),
      },
    );

    if (!initRes.ok) {
      const errBody = await initRes.text();
      console.error(`[YouTube] Upload init failed (${initRes.status}):`, errBody);
      throw new Error(`YouTube upload init failed (${initRes.status}): ${errBody}`);
    }

    const uploadUri = initRes.headers.get('location');
    if (!uploadUri) {
      throw new Error('YouTube upload init did not return upload URI');
    }

    // Step 2: Upload video in chunks
    let offset = 0;

    while (offset < videoBuffer.length) {
      const end = Math.min(offset + CHUNK_SIZE, videoBuffer.length);
      const chunk = videoBuffer.subarray(offset, end);

      const chunkRes = await fetch(uploadUri, {
        method: 'PUT',
        headers: {
          'Content-Length': chunk.length.toString(),
          'Content-Range': `bytes ${offset}-${end - 1}/${videoBuffer.length}`,
          'Content-Type': 'video/mp4',
        },
        body: new Uint8Array(chunk),
      });

      if (chunkRes.status === 200 || chunkRes.status === 201) {
        // Upload complete
        const videoData = await chunkRes.json() as {
          id: string;
          snippet: { title: string };
        };

        return {
          platformPostId: videoData.id,
          platformUrl: `https://www.youtube.com/watch?v=${videoData.id}`,
          publishedAt: new Date(),
        };
      }

      if (chunkRes.status === 308) {
        // Resume incomplete — continue uploading
        const range = chunkRes.headers.get('range');
        if (range) {
          const match = range.match(/bytes=0-(\d+)/);
          if (match) {
            offset = parseInt(match[1]) + 1;
            continue;
          }
        }
      }

      if (!chunkRes.ok) {
        throw new Error(`YouTube chunk upload failed at offset ${offset}: ${await chunkRes.text()}`);
      }

      offset = end;
    }

    throw new Error('YouTube upload completed but no video ID returned');
  }

  async getMetrics(platformPostId: string, accessToken: string): Promise<PostMetrics> {
    const res = await fetch(
      `${YOUTUBE_API}/videos?id=${platformPostId}&part=statistics`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!res.ok) {
      console.warn(`Failed to fetch YouTube metrics: ${await res.text()}`);
      return {};
    }

    const data = await res.json() as {
      items: Array<{
        statistics: {
          viewCount: string;
          likeCount: string;
          commentCount: string;
          favoriteCount: string;
        };
      }>;
    };

    const stats = data.items?.[0]?.statistics;
    if (!stats) return {};

    return {
      views: parseInt(stats.viewCount) || 0,
      likes: parseInt(stats.likeCount) || 0,
      comments: parseInt(stats.commentCount) || 0,
    };
  }
}
