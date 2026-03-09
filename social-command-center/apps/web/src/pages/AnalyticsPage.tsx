import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PLATFORMS } from '@scc/shared';
import type { PlatformId } from '@scc/shared';
import { fetchAnalytics, api } from '../services/api';
import { usePosts } from '../hooks/usePosts';
import Header from '../components/layout/Header';
import { useBreakpoint } from '../hooks/useBreakpoint';

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

const RANGE_OPTIONS = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
];

function getPlatformConfig(platformKey: string) {
  const pid = PLATFORM_MAP_REVERSE[platformKey];
  return PLATFORMS.find((x) => x.id === pid);
}

export default function AnalyticsPage() {
  const [range, setRange] = useState(30);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { isMobile, isTablet } = useBreakpoint();

  // Server-aggregated analytics
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', range],
    queryFn: () => fetchAnalytics(range),
    refetchInterval: 30_000,
  });

  // Post history (existing pagination)
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

  const overview = analytics?.overview || { totalPosts: 0, publishedCount: 0, draftCount: 0, failedCount: 0, successRate: 0, activePlatforms: 0 };
  const engagement = analytics?.engagement || { totalImpressions: 0, totalLikes: 0, totalComments: 0, totalShares: 0, engagementRate: 0 };
  const dailyActivity: Array<{ date: string; posts: number }> = analytics?.dailyActivity || [];
  const platformBreakdown: Array<{ platform: string; published: number; failed: number; likes: number; comments: number; shares: number; impressions: number }> = analytics?.platformBreakdown || [];
  const recentPublished: any[] = analytics?.recentPublished || [];
  const topPosts: Array<{ id: string; content: string; platforms: string[]; totalEngagement: number; topPlatform: string }> = analytics?.topPosts || [];

  // Daily activity chart — show last N bars (max 30)
  const chartDays = dailyActivity.slice(-Math.min(range, 30));
  const maxDaily = Math.max(...chartDays.map((d) => d.posts), 1);

  const totalEngagements = engagement.totalLikes + engagement.totalComments + engagement.totalShares;

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
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '16px' : '32px' }}>
        {/* Title + Range Picker */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? '16px' : '0', marginBottom: '32px' }}>
          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                marginBottom: '4px',
                background: 'var(--gradient-text)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Analytics
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", margin: 0 }}>
              Cross-platform performance & engagement
              {analytics?.metricsFreshness?.lastFetchedAt && (
                <span style={{ marginLeft: '12px', color: 'var(--text-muted)', opacity: 0.7 }}>
                  Metrics updated {new Date(analytics.metricsFreshness.lastFetchedAt).toLocaleString()}
                </span>
              )}
              {analytics?.metricsFreshness?.unfetchedCount > 0 && (
                <span style={{ marginLeft: '8px', color: '#ffaa00' }}>
                  ({analytics.metricsFreshness.unfetchedCount} post{analytics.metricsFreshness.unfetchedCount > 1 ? 's' : ''} awaiting metrics)
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={async () => {
                setRefreshing(true);
                try {
                  const res = await api.post('/analytics/refresh-metrics');
                  const d = res.data.data;
                  toast.success(d.message || `Refreshed ${d.refreshed} metric(s)`);
                  queryClient.invalidateQueries({ queryKey: ['analytics'] });
                } catch {
                  toast.error('Failed to refresh metrics');
                } finally {
                  setRefreshing(false);
                }
              }}
              disabled={refreshing}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: refreshing ? 'var(--bg-hover)' : 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: refreshing ? 'var(--text-muted)' : '#06b6d4',
                fontSize: '11px',
                fontWeight: 700,
                cursor: refreshing ? 'default' : 'pointer',
                fontFamily: "'IBM Plex Mono', monospace",
                transition: 'all 0.15s ease',
                opacity: refreshing ? 0.6 : 1,
              }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
            </button>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-tertiary)', borderRadius: '10px', padding: '3px', border: '1px solid var(--border-color)' }}>
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRange(opt.value)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: range === opt.value ? 'var(--bg-active)' : 'transparent',
                    border: range === opt.value ? '1px solid #8b5cf6' : '1px solid transparent',
                    color: range === opt.value ? '#8b5cf6' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: "'IBM Plex Mono', monospace",
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading analytics...</div>
        )}

        {!isLoading && (
          <>
            {/* Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: isMobile ? '10px' : '14px', marginBottom: '32px' }}>
              {[
                { label: 'Total Posts', value: overview.totalPosts, color: '#8b5cf6', sub: `${overview.draftCount} drafts` },
                { label: 'Published', value: overview.publishedCount, color: '#22c55e', sub: `${overview.successRate}% success` },
                { label: 'Impressions', value: engagement.totalImpressions.toLocaleString(), color: '#06b6d4', sub: 'total reach' },
                { label: 'Engagements', value: totalEngagements.toLocaleString(), color: '#f472b6', sub: `${engagement.engagementRate}% rate` },
                { label: 'Platforms', value: overview.activePlatforms, color: '#ffaa00', sub: `active (last ${range}d)` },
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
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : '20px', marginBottom: '32px' }}>
              {/* Daily Activity */}
              <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Post Activity ({range}d)
                </div>
                {chartDays.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No posts in this period</div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: range <= 7 ? '8px' : '3px', height: '120px' }}>
                    {chartDays.map((day, i) => {
                      const d = new Date(day.date);
                      const showLabel = range <= 7 || i % Math.ceil(chartDays.length / 7) === 0;
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          {day.posts > 0 && (
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#8b5cf6', fontFamily: "'IBM Plex Mono', monospace" }}>
                              {day.posts}
                            </div>
                          )}
                          <div
                            style={{
                              width: '100%',
                              height: `${Math.max((day.posts / maxDaily) * 80, 4)}px`,
                              background: day.posts > 0 ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)' : 'var(--bg-hover)',
                              borderRadius: '4px',
                            }}
                          />
                          {showLabel && (
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                              {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Platform Distribution */}
              <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Platform Distribution
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {platformBreakdown
                    .filter((s) => s.published > 0)
                    .sort((a, b) => b.published - a.published)
                    .map((entry) => {
                      const pl = getPlatformConfig(entry.platform);
                      const maxCount = Math.max(...platformBreakdown.map((s) => s.published), 1);
                      const accent = pl?.accent || pl?.color || '#888';
                      return (
                        <div key={entry.platform} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '16px', width: '24px' }}>{pl?.icon || entry.platform}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-hover)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(entry.published / maxCount) * 100}%`, background: accent, borderRadius: '4px' }} />
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: accent, fontFamily: "'IBM Plex Mono', monospace", minWidth: '24px', textAlign: 'right' as const }}>
                            {entry.published}
                          </span>
                        </div>
                      );
                    })}
                  {platformBreakdown.filter((s) => s.published > 0).length === 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No published posts yet</div>
                  )}
                </div>
              </div>
            </div>

            {/* Engagement Summary */}
            {totalEngagements > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '14px', marginBottom: '32px' }}>
                {[
                  { label: 'Likes', value: engagement.totalLikes, icon: '\u2764\uFE0F', color: '#ff6b6b' },
                  { label: 'Comments', value: engagement.totalComments, icon: '\u{1F4AC}', color: '#06b6d4' },
                  { label: 'Shares', value: engagement.totalShares, icon: '\u{1F504}', color: '#22c55e' },
                  { label: 'Impressions', value: engagement.totalImpressions, icon: '\u{1F441}', color: '#8b5cf6' },
                ].map((stat) => (
                  <div key={stat.label} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{stat.icon}</span>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: stat.color }}>{stat.value.toLocaleString()}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Platform Breakdown Grid */}
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-tertiary)' }}>Platform Breakdown</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
              {platformBreakdown.length === 0
                ? PLATFORMS.map((platform) => {
                    const accent = platform.accent || platform.color;
                    return (
                      <div key={platform.id} style={{ background: platform.bg || 'var(--bg-tertiary)', border: `1px solid ${accent}33`, borderRadius: '16px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                          <span style={{ fontSize: '20px' }}>{platform.icon}</span>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: accent }}>{platform.name}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No activity yet</div>
                      </div>
                    );
                  })
                : platformBreakdown.map((entry) => {
                    const pl = getPlatformConfig(entry.platform);
                    const accent = pl?.accent || pl?.color || '#888';
                    return (
                      <div key={entry.platform} style={{ background: pl?.bg || 'var(--bg-tertiary)', border: `1px solid ${accent}33`, borderRadius: '16px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                          <span style={{ fontSize: '20px' }}>{pl?.icon || entry.platform}</span>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: accent }}>{pl?.name || entry.platform}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace" }}>
                          <div><div style={{ color: 'var(--text-muted)' }}>Published</div><div style={{ color: '#22c55e', fontWeight: 700 }}>{entry.published}</div></div>
                          <div><div style={{ color: 'var(--text-muted)' }}>Failed</div><div style={{ color: '#ff4444', fontWeight: 700 }}>{entry.failed}</div></div>
                          <div><div style={{ color: 'var(--text-muted)' }}>Likes</div><div style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{entry.likes}</div></div>
                          <div><div style={{ color: 'var(--text-muted)' }}>Comments</div><div style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{entry.comments}</div></div>
                          <div><div style={{ color: 'var(--text-muted)' }}>Shares</div><div style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{entry.shares}</div></div>
                          <div><div style={{ color: 'var(--text-muted)' }}>Impressions</div><div style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{entry.impressions.toLocaleString()}</div></div>
                        </div>
                      </div>
                    );
                  })
              }
            </div>

            {/* Top Posts */}
            {topPosts.length > 0 && (
              <>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-tertiary)' }}>Top Posts by Engagement</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
                  {topPosts.map((post, i) => (
                    <div key={post.id} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#8b5cf6', fontFamily: "'IBM Plex Mono', monospace", minWidth: '24px' }}>#{i + 1}</span>
                      <div style={{ display: 'flex', gap: '3px', minWidth: '50px' }}>
                        {post.platforms.map((p: string) => {
                          const pl = getPlatformConfig(p);
                          return <span key={p} style={{ fontSize: '13px' }}>{pl?.icon || p}</span>;
                        })}
                      </div>
                      <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                        {post.content}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#22c55e', fontFamily: "'IBM Plex Mono', monospace" }}>
                          {post.totalEngagement}
                        </span>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>engagements</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Recent Post Performance */}
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-tertiary)' }}>Recent Post Performance</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
              {recentPublished.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                  No published posts yet. Create and publish posts to see performance metrics here.
                </div>
              )}
              {recentPublished.map((post: any) => {
                const isExpanded = expandedPost === post.id;
                const postResults = post.publishResults || [];
                const pLikes = postResults.reduce((s: number, r: any) => s + (r.metrics?.likes || 0), 0);
                const pComments = postResults.reduce((s: number, r: any) => s + (r.metrics?.comments || 0), 0);
                const pShares = postResults.reduce((s: number, r: any) => s + (r.metrics?.shares || 0), 0);
                const pImp = postResults.reduce((s: number, r: any) => s + (r.metrics?.impressions || 0), 0);

                return (
                  <div key={post.id} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                    <div
                      onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                      style={{ padding: isMobile ? '12px 14px' : '16px 20px', cursor: 'pointer', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '8px' : '14px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '14px' }}>
                        <div style={{ display: 'flex', gap: '4px', minWidth: isMobile ? undefined : '60px' }}>
                          {post.platforms.map((p: string) => {
                            const pl = getPlatformConfig(p);
                            return <span key={p} style={{ fontSize: '14px' }}>{pl?.icon || p}</span>;
                          })}
                        </div>
                        <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                          {post.content}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', transition: 'transform 0.2s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                          {'\u25BC'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: isMobile ? '10px' : '16px', fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", flexWrap: 'wrap' }}>
                        <span style={{ color: '#ff6b6b' }}>{pLikes} {'\u2764\uFE0F'}</span>
                        <span style={{ color: '#06b6d4' }}>{pComments} {'\u{1F4AC}'}</span>
                        <span style={{ color: '#22c55e' }}>{pShares} {'\u{1F504}'}</span>
                        <span style={{ color: '#8b5cf6' }}>{pImp.toLocaleString()} imp</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border-subtle)' }}>
                        <div style={{ padding: '12px 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '120px', overflow: 'hidden' }}>
                          {post.content}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {postResults.map((result: any, idx: number) => {
                            const pl = getPlatformConfig(result.platform);
                            const m = result.metrics || {};
                            return (
                              <div key={idx} style={{ flex: '1 1 200px', padding: '12px', borderRadius: '10px', background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                  <span>{pl?.icon}</span>
                                  <span style={{ fontSize: '12px', fontWeight: 700, color: pl?.accent || pl?.color }}>{pl?.name || result.platform}</span>
                                  <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: result.status === 'SUCCESS' ? 'rgba(34,197,94,0.1)' : 'rgba(255,68,68,0.1)', color: result.status === 'SUCCESS' ? '#22c55e' : '#ff4444' }}>
                                    {result.status}
                                  </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '4px', fontSize: '10px', fontFamily: "'IBM Plex Mono', monospace" }}>
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
          </>
        )}

        {/* ═══════════ POST HISTORY ═══════════ */}
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', marginTop: '32px', color: 'var(--text-tertiary)' }}>Post History</h2>

        {/* Status filter tabs */}
        <div style={{ display: 'flex', gap: isMobile ? '4px' : '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
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
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                  <div style={{ display: 'flex', gap: '3px', minWidth: '50px', flexShrink: 0 }}>
                    {post.platforms.map((p: string) => {
                      const pl = getPlatformConfig(p);
                      return <span key={p} style={{ fontSize: '13px' }}>{pl?.icon || p}</span>;
                    })}
                  </div>
                  <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                    {post.content || '(no content)'}
                  </div>
                  <span style={{
                    fontSize: '9px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                    background: `${statusColor}18`, color: statusColor,
                    fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.05em', textTransform: 'uppercase', flexShrink: 0,
                  }}>
                    {post.status.replace('_', ' ')}
                  </span>
                  {!isMobile && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0, minWidth: '80px', textAlign: 'right' as const }}>
                      {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    {'\u25BC'}
                  </span>
                </div>

                {isOpen && (
                  <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ padding: '12px 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto' }}>
                      {post.content}
                    </div>
                    <div style={{ display: 'flex', gap: isMobile ? '8px' : '16px', fontSize: '10px', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--text-muted)', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <span>Created: {new Date(post.createdAt).toLocaleString()}</span>
                      {post.scheduledAt && <span>Scheduled: {new Date(post.scheduledAt).toLocaleString()}</span>}
                      {post.scheduleType !== 'IMMEDIATE' && <span>Type: {post.scheduleType}</span>}
                    </div>
                    {results.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {results.map((result: any) => {
                          const pl = getPlatformConfig(result.platform);
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
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '4px', fontSize: '10px', fontFamily: "'IBM Plex Mono', monospace" }}>
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
                padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: historyPage <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                fontSize: '11px', fontWeight: 700,
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
                padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: historyPage >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)',
                fontSize: '11px', fontWeight: 700,
                cursor: historyPage >= totalPages ? 'default' : 'pointer',
                opacity: historyPage >= totalPages ? 0.5 : 1,
              }}
            >
              Next {'\u2192'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
