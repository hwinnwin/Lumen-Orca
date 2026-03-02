import { PLATFORMS } from '@scc/shared';
import { usePosts } from '../hooks/usePosts';
import Header from '../components/layout/Header';

export default function AnalyticsPage() {
  const { data, isLoading } = usePosts({ status: 'PUBLISHED', limit: 20 });
  const posts = data?.data || [];

  // Aggregate basic metrics from publish results
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

    return {
      platform,
      successCount,
      failedCount,
      metrics: totalMetrics,
    };
  });

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
          Cross-platform engagement metrics
        </p>

        {/* Overview Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {[
            {
              label: 'Total Posts',
              value: posts.length,
              color: '#8b5cf6',
            },
            {
              label: 'Impressions',
              value: platformStats.reduce((sum, s) => sum + s.metrics.impressions, 0),
              color: '#06b6d4',
            },
            {
              label: 'Engagements',
              value: platformStats.reduce(
                (sum, s) => sum + s.metrics.likes + s.metrics.comments + s.metrics.shares,
                0,
              ),
              color: '#22c55e',
            },
            {
              label: 'Success Rate',
              value: (() => {
                const total = platformStats.reduce((s, p) => s + p.successCount + p.failedCount, 0);
                const success = platformStats.reduce((s, p) => s + p.successCount, 0);
                return total > 0 ? `${Math.round((success / total) * 100)}%` : 'N/A';
              })(),
              color: '#ffaa00',
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  fontFamily: "'IBM Plex Mono', monospace",
                  marginBottom: '8px',
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: card.color,
                }}
              >
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Per-Platform Breakdown */}
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 700,
            marginBottom: '16px',
            color: 'var(--text-tertiary)',
          }}
        >
          Platform Breakdown
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {platformStats.map(({ platform, successCount, failedCount, metrics }) => {
            const accent = platform.accent || platform.color;
            return (
              <div
                key={platform.id}
                style={{
                  background: platform.bg || 'var(--bg-tertiary)',
                  border: `1px solid ${accent}33`,
                  borderRadius: '16px',
                  padding: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{platform.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: accent }}>
                    {platform.name}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    fontSize: '11px',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Published</div>
                    <div style={{ color: '#22c55e', fontWeight: 700 }}>{successCount}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Failed</div>
                    <div style={{ color: '#ff4444', fontWeight: 700 }}>{failedCount}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Likes</div>
                    <div style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{metrics.likes}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Comments</div>
                    <div style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{metrics.comments}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Shares</div>
                    <div style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{metrics.shares}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Impressions</div>
                    <div style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
                      {metrics.impressions.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading analytics...
          </div>
        )}
      </div>
    </div>
  );
}
