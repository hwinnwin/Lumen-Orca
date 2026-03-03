import { useState } from 'react';
import { PLATFORMS } from '@scc/shared';
import type { PlatformId } from '@scc/shared';
import { usePosts } from '../hooks/usePosts';
import Header from '../components/layout/Header';

const PLATFORM_MAP_REVERSE: Record<string, PlatformId> = {
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
  LINKEDIN: 'linkedin',
  X: 'x',
  TIKTOK: 'tiktok',
  YOUTUBE: 'youtube',
};

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'QUEUED', label: 'Queued' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'PARTIAL_FAILURE', label: 'Partial' },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#888',
  QUEUED: '#ffaa00',
  PUBLISHING: '#06b6d4',
  PUBLISHED: '#22c55e',
  PARTIAL_FAILURE: '#f97316',
  FAILED: '#ff4444',
};

export default function AnalyticsPage() {
  const { data, isLoading } = usePosts({ status: 'PUBLISHED', limit: 50 });
  const allData = usePosts({ limit: 50 });
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  // Post history state
  const [historyFilter, setHistoryFilter] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_LIMIT = 15;
  const historyQuery = usePosts({
    status: historyFilter || undefined,
    page: historyPage,
    limit: HISTORY_LIMIT,
  });
  const historyPosts = historyQuery?.data?.data || [];
  const historyMeta = historyQuery?.data?.meta || { total: 0, page: 1, limit: HISTORY_LIMIT };
  const totalPages = Math.ceil((historyMeta.total || 0) / HISTORY_LIMIT);

  const posts = data?.data || [];
  const allPosts = allData?.data?.data || [];

  // Aggregate metrics
  const platformStats = PLATFORMS.map((platform) => {
    const platformKey = platform.id.toUpperCase();
    const results = posts.flatMap((post: any) =>
      post.publishResults?.filter((r: any) => r.platform === platformKey) || [],
    );
    const successCount = results.filter((r: any) => r.status === 'SUCCESS').length;
    const failedCount = results.filter((r: any) => r.status === 'FAILED').length;
    const totalMetrics = results.reduce(
      (acc: any, r: any) => {
        if (r.metrics) {
          acc.likes += r.metrics.likes || 0;
          acc.comments += r.metrics.comments || 0;
          acc.shares += r.metrics.shares || 0;
          acc.impressions += r.metrics.impressions || 0;
        }
        return acc;
      },
      { likes: 0, comments: 0, shares: 0, impressions: 0 },
    );
    return { platform, successCount, failedCount, metrics: totalMetrics };
  });

  const totalPublished = platformStats.reduce((s, p) => s + p.successCount, 0);
  const totalFailed = platformStats.reduce((s, p) => s + p.failedCount, 0);
  const totalImpressions = platformStats.reduce((s, p) => s + p.metrics.impressions, 0);
  const totalEngagements = platformStats.reduce(
    (s, p) => s + p.metrics.likes + p.metrics.comments + p.metrics.shares, 0,
  );
  const successRate = totalPublished + totalFailed > 0
    ? Math.round((totalPublished / (totalPublished + totalFailed)) * 100) : 0;
  const engagementRate = totalImpressions > 0
    ? ((totalEngagements / totalImpressions) * 100).toFixed(1) : '0';

  // Activity last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const dailyActivity = last7Days.map((day) => {
    const dayEnd = new Date(day);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const count = allPosts.filter((p: any) => {
      const created = new Date(p.createdAt);
      return created >= day && created < dayEnd;
    }).length;
    return { label: day.toLocaleDateString('en-US', { weekday: 'short' }), count };
  });
  const maxDaily = Math.max(...dailyActivity.map((d) => d.count), 1);

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
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px' }}>
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
          Analytics
        </h1>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontFamily: "'IBM Plex Mono', monospace",
            marginBottom: '32px',
          }}
        >
          Cross-platform engagement metrics and performance insights
        </p>

        {/* Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '32px' }}>
          {[
            { label: 'Published', value: posts.length, color: '#8b5cf6', sub: `${allPosts.length} total` },
            { label: 'Impressions', value: totalImpressions.toLocaleString(), color: '#06b6d4', sub: 'total reach' },
            { label: 'Engagements', value: totalEngagements.toLocaleString(), color: '#22c55e', sub: `${engagementRate}% rate` },
            { label: 'Success Rate', value: `${successRate}%`, color: '#ffaa00', sub: `${totalPublished}/${totalPublished + totalFailed}` },
            { label: 'Platforms', value: platformStats.filter((s) => s.successCount > 0).length, color: '#f472b6', sub: 'active' },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '18px',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace", marginBottom: '6px' }}>
                {card.label}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
          {/* Weekly Activity */}
          <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Posts This Week
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
              {dailyActivity.map((day, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#8b5cf6', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {day.count || ''}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: `${Math.max((day.count / maxDaily) * 80, 4)}px`,
                      background: day.count > 0 ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)' : 'var(--bg-hover)',
                      borderRadius: '4px',
                    }}
                  />
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {day.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Distribution */}
          <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Platform Distribution
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {platformStats
                .filter((s) => s.successCount > 0)
                .sort((a, b) => b.successCount - a.successCount)
                .map(({ platform, successCount }) => {
                  const maxCount = Math.max(...platformStats.map((s) => s.successCount), 1);
                  return (
                    <div key={platform.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px', width: '24px' }}>{platform.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-hover)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(successCount / maxCount) * 100}%`, background: platform.accent || platform.color, borderRadius: '4px' }} />
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: platform.accent || platform.color, fontFamily: "'IBM Plex Mono', monospace", minWidth: '24px', textAlign: 'right' as const }}>
                        {successCount}
                      </span>
                    </div>
                  );
                })}
              {platformStats.every((s) => s.successCount === 0) && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No published posts yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Platform Breakdown Grid */}
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-tertiary)' }}>Platform Breakdown</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
          {platformStats.map(({ platform, successCount, failedCount, metrics }) => {
            const accent = platform.accent || platform.color;
            return (
              <div key={platform.id} style={{ background: platform.bg || 'var(--bg-tertiary)', border: `1px solid ${accent}33`, borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '20px' }}>{platform.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: accent }}>{platform.name}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace" }}>
                  <div><div style={{ color: 'var(--text-muted)' }}>Published</div><div style={{ color: '#22c55e', fontWeight: 700 }}>{successCount}</div></div>
                  <div><div style={{ color: 'var(--text-muted)' }}>Failed</div><div style={{ color: '#ff4444', fontWeight: 700 }}>{failedCount}</div></div>
                  <div><div style={{ color: 'var(--text-muted)' }}>Likes</div><div style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{metrics.likes}</div></div>
                  <div><div style={{ color: 'var(--text-muted)' }}>Comments</div><div style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{metrics.comments}</div></div>
                  <div><div style={{ color: 'var(--text-muted)' }}>Shares</div><div style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{metrics.shares}</div></div>
                  <div><div style={{ color: 'var(--text-muted)' }}>Impressions</div><div style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{metrics.impressions.toLocaleString()}</div></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Posts Performance */}
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-tertiary)' }}>Recent Post Performance</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {posts.length === 0 && !isLoading && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
              No published posts yet. Create and publish posts to see performance metrics here.
            </div>
          )}
          {posts.slice(0, 10).map((post: any) => {
            const isExpanded = expandedPost === post.id;
            const postResults = post.publishResults || [];
            const totalLikes = postResults.reduce((s: number, r: any) => s + (r.metrics?.likes || 0), 0);
            const totalComments = postResults.reduce((s: number, r: any) => s + (r.metrics?.comments || 0), 0);
            const totalShares = postResults.reduce((s: number, r: any) => s + (r.metrics?.shares || 0), 0);
            const totalImp = postResults.reduce((s: number, r: any) => s + (r.metrics?.impressions || 0), 0);

            return (
              <div key={post.id} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                <div
                  onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                  style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }}
                >
                  <div style={{ display: 'flex', gap: '4px', minWidth: '60px' }}>
                    {post.platforms.map((p: string) => {
                      const pid = PLATFORM_MAP_REVERSE[p];
                      const pl = PLATFORMS.find((x) => x.id === pid);
                      return <span key={p} style={{ fontSize: '14px' }}>{pl?.icon || p}</span>;
                    })}
                  </div>
                  <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.content}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace" }}>
                    <span style={{ color: '#ff6b6b' }}>{totalLikes} {'\u2764\uFE0F'}</span>
                    <span style={{ color: '#06b6d4' }}>{totalComments} {'\u{1F4AC}'}</span>
                    <span style={{ color: '#22c55e' }}>{totalShares} {'\u{1F504}'}</span>
                    <span style={{ color: '#8b5cf6' }}>{totalImp.toLocaleString()} imp</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', transition: 'transform 0.2s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    {'\u25BC'}
                  </span>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ padding: '12px 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '120px', overflow: 'hidden' }}>
                      {post.content}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {postResults.map((result: any) => {
                        const pid = PLATFORM_MAP_REVERSE[result.platform];
                        const pl = PLATFORMS.find((x) => x.id === pid);
                        const m = result.metrics || {};
                        return (
                          <div key={result.id} style={{ flex: '1 1 200px', padding: '12px', borderRadius: '10px', background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span>{pl?.icon}</span>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: pl?.accent || pl?.color }}>{pl?.name || result.platform}</span>
                              <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: result.status === 'SUCCESS' ? 'rgba(34,197,94,0.1)' : 'rgba(255,68,68,0.1)', color: result.status === 'SUCCESS' ? '#22c55e' : '#ff4444' }}>
                                {result.status}
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', fontSize: '10px', fontFamily: "'IBM Plex Mono', monospace" }}>
                              {[
                                { label: 'Likes', val: m.likes || 0 },
                                { label: 'Comments', val: m.comments || 0 },
                                { label: 'Shares', val: m.shares || 0 },
                                { label: 'Impressions', val: m.impressions || 0 },
                              ].map((met) => (
                                <div key={met.label}>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '9px' }}>{met.label}</div>
                                  <div style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{met.val}</div>
                                </div>
                              ))}
                            </div>
                            {result.platformUrl && (
                              <a href={result.platformUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '8px', fontSize: '10px', color: '#06b6d4', textDecoration: 'none' }}>
                                View on {pl?.name} {'\u2192'}
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                      Published: {new Date(post.createdAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ═══════════ POST HISTORY ═══════════ */}
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', marginTop: '32px', color: 'var(--text-tertiary)' }}>Post History</h2>

        {/* Status filter tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setHistoryFilter(f.value); setHistoryPage(1); }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: historyFilter === f.value ? 'var(--bg-active)' : 'var(--bg-tertiary)',
                border: `1px solid ${historyFilter === f.value ? '#8b5cf6' : 'var(--border-color)'}`,
                color: historyFilter === f.value ? '#8b5cf6' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'IBM Plex Mono', monospace",
                transition: 'all 0.15s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Post list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {historyQuery?.isLoading && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading posts...</div>
          )}
          {!historyQuery?.isLoading && historyPosts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
              No posts found{historyFilter ? ` with status "${historyFilter}"` : ''}.
            </div>
          )}
          {historyPosts.map((post: any) => {
            const isOpen = expandedPost === `h-${post.id}`;
            const results = post.publishResults || [];
            const statusColor = STATUS_COLORS[post.status] || '#888';
            return (
              <div key={post.id} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                <div
                  onClick={() => setExpandedPost(isOpen ? null : `h-${post.id}`)}
                  style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  {/* Status dot */}
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor, flexShrink: 0 }} />

                  {/* Platform icons */}
                  <div style={{ display: 'flex', gap: '3px', minWidth: '50px', flexShrink: 0 }}>
                    {post.platforms.map((p: string) => {
                      const pid = PLATFORM_MAP_REVERSE[p];
                      const pl = PLATFORMS.find((x) => x.id === pid);
                      return <span key={p} style={{ fontSize: '13px' }}>{pl?.icon || p}</span>;
                    })}
                  </div>

                  {/* Content preview */}
                  <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                    {post.content || '(no content)'}
                  </div>

                  {/* Status badge */}
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: `${statusColor}18`,
                    color: statusColor,
                    fontFamily: "'IBM Plex Mono', monospace",
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}>
                    {post.status.replace('_', ' ')}
                  </span>

                  {/* Date */}
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0, minWidth: '80px', textAlign: 'right' as const }}>
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>

                  {/* Expand arrow */}
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    {'\u25BC'}
                  </span>
                </div>

                {isOpen && (
                  <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--border-subtle)' }}>
                    {/* Full content */}
                    <div style={{ padding: '12px 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto' }}>
                      {post.content}
                    </div>

                    {/* Schedule info */}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '10px', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--text-muted)', marginBottom: '10px' }}>
                      <span>Created: {new Date(post.createdAt).toLocaleString()}</span>
                      {post.scheduledAt && <span>Scheduled: {new Date(post.scheduledAt).toLocaleString()}</span>}
                      {post.scheduleType !== 'IMMEDIATE' && <span>Type: {post.scheduleType}</span>}
                    </div>

                    {/* Publish results */}
                    {results.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {results.map((result: any) => {
                          const pid = PLATFORM_MAP_REVERSE[result.platform];
                          const pl = PLATFORMS.find((x) => x.id === pid);
                          const m = result.metrics || {};
                          return (
                            <div key={result.id} style={{ flex: '1 1 200px', padding: '12px', borderRadius: '10px', background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span>{pl?.icon}</span>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: pl?.accent || pl?.color }}>{pl?.name || result.platform}</span>
                                <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: result.status === 'SUCCESS' ? 'rgba(34,197,94,0.1)' : 'rgba(255,68,68,0.1)', color: result.status === 'SUCCESS' ? '#22c55e' : '#ff4444' }}>
                                  {result.status}
                                </span>
                              </div>
                              {result.status === 'SUCCESS' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', fontSize: '10px', fontFamily: "'IBM Plex Mono', monospace" }}>
                                  {[
                                    { label: 'Likes', val: m.likes || 0 },
                                    { label: 'Comments', val: m.comments || 0 },
                                    { label: 'Shares', val: m.shares || 0 },
                                    { label: 'Impressions', val: m.impressions || 0 },
                                  ].map((met) => (
                                    <div key={met.label}>
                                      <div style={{ color: 'var(--text-muted)', fontSize: '9px' }}>{met.label}</div>
                                      <div style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{met.val}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {result.status === 'FAILED' && result.error && (
                                <div style={{ fontSize: '10px', color: '#ff4444', fontFamily: "'IBM Plex Mono', monospace" }}>
                                  {result.error}
                                </div>
                              )}
                              {result.platformUrl && (
                                <a href={result.platformUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '8px', fontSize: '10px', color: '#06b6d4', textDecoration: 'none' }}>
                                  View on {pl?.name} {'\u2192'}
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
            <button
              onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
              disabled={historyPage <= 1}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: historyPage <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: historyPage <= 1 ? 'default' : 'pointer',
                opacity: historyPage <= 1 ? 0.5 : 1,
              }}
            >
              {'\u2190'} Prev
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
              {historyPage} / {totalPages}
            </span>
            <button
              onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
              disabled={historyPage >= totalPages}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: historyPage >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: historyPage >= totalPages ? 'default' : 'pointer',
                opacity: historyPage >= totalPages ? 0.5 : 1,
              }}
            >
              Next {'\u2192'}
            </button>
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading analytics...</div>
        )}
      </div>
    </div>
  );
}
