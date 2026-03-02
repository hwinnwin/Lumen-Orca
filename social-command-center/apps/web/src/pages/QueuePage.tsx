import { useState } from 'react';
import { PLATFORMS } from '@scc/shared';
import type { PlatformId } from '@scc/shared';
import { usePosts, usePublishPost, useCancelPost, useDeletePost } from '../hooks/usePosts';
import Header from '../components/layout/Header';

const PLATFORM_MAP_REVERSE: Record<string, PlatformId> = {
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
  LINKEDIN: 'linkedin',
  X: 'x',
  TIKTOK: 'tiktok',
  YOUTUBE: 'youtube',
};

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT: { bg: 'var(--bg-hover)', color: 'var(--text-tertiary)', label: 'Draft' },
  QUEUED: { bg: 'rgba(139,92,246,0.1)', color: '#a78bfa', label: 'Queued' },
  PUBLISHING: { bg: 'rgba(6,182,212,0.1)', color: '#06b6d4', label: 'Publishing' },
  PUBLISHED: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', label: 'Published' },
  PARTIAL_FAILURE: { bg: 'rgba(255,170,0,0.1)', color: '#ffaa00', label: 'Partial' },
  FAILED: { bg: 'rgba(255,68,68,0.1)', color: '#ff4444', label: 'Failed' },
};

export default function QueuePage() {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { data, isLoading } = usePosts({ status: filter, limit: 50 });
  const publishPost = usePublishPost();
  const cancelPost = useCancelPost();
  const deletePost = useDeletePost();

  const posts = data?.data || [];
  const filters = ['All', 'DRAFT', 'QUEUED', 'PUBLISHING', 'PUBLISHED', 'FAILED'];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <Header />
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px' }}>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 800,
            marginBottom: '8px',
            background: 'var(--gradient-text)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Post Queue
        </h1>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontFamily: "'IBM Plex Mono', monospace",
            marginBottom: '24px',
          }}
        >
          Track and manage your scheduled and published posts
        </p>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f === 'All' ? undefined : f)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background:
                  (f === 'All' && !filter) || filter === f
                    ? 'var(--bg-active)'
                    : 'var(--bg-tertiary)',
                border: `1px solid ${(f === 'All' && !filter) || filter === f ? 'var(--border-color)' : 'var(--border-subtle)'}`,
                color:
                  (f === 'All' && !filter) || filter === f ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {f === 'All' ? 'All' : STATUS_COLORS[f]?.label || f}
            </button>
          ))}
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading posts...
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-disabled)',
              background: 'var(--bg-tertiary)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{'\u{1F4ED}'}</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>No posts yet</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Create your first post from the Compose page
            </div>
          </div>
        )}

        {/* Post Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {posts.map((post: any) => {
            const statusInfo = STATUS_COLORS[post.status] || STATUS_COLORS.DRAFT;
            return (
              <div
                key={post.id}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  {/* Platform icons */}
                  <div style={{ display: 'flex', gap: '4px', minWidth: '80px', flexWrap: 'wrap' }}>
                    {post.platforms.map((p: string) => {
                      const platformId = PLATFORM_MAP_REVERSE[p];
                      const platform = PLATFORMS.find((pl) => pl.id === platformId);
                      const result = post.publishResults?.find((r: any) => r.platform === p);
                      const resultColor =
                        result?.status === 'SUCCESS'
                          ? '#22c55e'
                          : result?.status === 'FAILED'
                            ? '#ff4444'
                            : undefined;
                      return (
                        <span
                          key={p}
                          style={{
                            fontSize: '16px',
                            filter: resultColor
                              ? `drop-shadow(0 0 4px ${resultColor})`
                              : undefined,
                          }}
                          title={`${platform?.name || p}: ${result?.status || 'pending'}`}
                        >
                          {platform?.icon || p}
                        </span>
                      );
                    })}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        marginBottom: '8px',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '80px',
                        overflow: 'hidden',
                      }}
                    >
                      {post.content}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      <span>
                        Created: {new Date(post.createdAt).toLocaleString()}
                      </span>
                      {post.scheduledAt && (
                        <span>
                          Scheduled: {new Date(post.scheduledAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status + Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: statusInfo.bg,
                        color: statusInfo.color,
                        fontSize: '10px',
                        fontWeight: 700,
                      }}
                    >
                      {statusInfo.label}
                    </span>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['DRAFT', 'FAILED'].includes(post.status) && (
                        <button
                          onClick={() => publishPost.mutate(post.id)}
                          disabled={publishPost.isPending}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: 'rgba(139,92,246,0.1)',
                            border: '1px solid rgba(139,92,246,0.2)',
                            color: '#a78bfa',
                            fontSize: '10px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Publish
                        </button>
                      )}
                      {['DRAFT', 'QUEUED'].includes(post.status) && (
                        <button
                          onClick={() => cancelPost.mutate(post.id)}
                          disabled={cancelPost.isPending}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255,170,0,0.1)',
                            border: '1px solid rgba(255,170,0,0.2)',
                            color: '#ffaa00',
                            fontSize: '10px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      )}
                      {['DRAFT', 'QUEUED'].includes(post.status) && (
                        <button
                          onClick={() => deletePost.mutate(post.id)}
                          disabled={deletePost.isPending}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255,0,0,0.05)',
                            border: '1px solid rgba(255,0,0,0.15)',
                            color: '#ff6666',
                            fontSize: '10px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Publish Results */}
                {post.publishResults?.length > 0 && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    {post.publishResults.map((result: any) => {
                      const platformId = PLATFORM_MAP_REVERSE[result.platform];
                      const platform = PLATFORMS.find((pl) => pl.id === platformId);
                      const isSuccess = result.status === 'SUCCESS';
                      const isFailed = result.status === 'FAILED';
                      return (
                        <div
                          key={result.id}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: isSuccess
                              ? 'rgba(34,197,94,0.08)'
                              : isFailed
                                ? 'rgba(255,68,68,0.08)'
                                : 'var(--bg-tertiary)',
                            border: `1px solid ${isSuccess ? 'rgba(34,197,94,0.2)' : isFailed ? 'rgba(255,68,68,0.2)' : 'var(--border-color)'}`,
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>{platform?.icon}</span>
                          <span style={{ color: isSuccess ? '#22c55e' : isFailed ? '#ff4444' : 'var(--text-tertiary)' }}>
                            {result.status}
                          </span>
                          {result.platformUrl && (
                            <a
                              href={result.platformUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#06b6d4', textDecoration: 'none' }}
                            >
                              View
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
