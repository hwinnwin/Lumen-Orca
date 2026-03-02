import { PLATFORMS } from '@scc/shared';

interface LiveStatusBadgeProps {
  platform: string;
  status: 'pending' | 'publishing' | 'success' | 'failed';
}

const STATUS_STYLES: Record<string, { color: string; pulse: boolean; label: string }> = {
  pending: { color: 'var(--text-muted)', pulse: false, label: 'Pending' },
  publishing: { color: '#06b6d4', pulse: true, label: 'Publishing...' },
  success: { color: '#22c55e', pulse: false, label: 'Published' },
  failed: { color: '#ff4444', pulse: false, label: 'Failed' },
};

export default function LiveStatusBadge({ platform, status }: LiveStatusBadgeProps) {
  const platformConfig = PLATFORMS.find((p) => p.id === platform.toLowerCase());
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '20px',
        background: `${style.color}11`,
        border: `1px solid ${style.color}33`,
        fontSize: '10px',
        fontWeight: 600,
      }}
    >
      <span style={{ fontSize: '12px' }}>{platformConfig?.icon || platform}</span>
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: style.color,
          boxShadow: style.pulse ? `0 0 8px ${style.color}88` : 'none',
          animation: style.pulse ? 'pulse-glow 1.5s ease-in-out infinite' : 'none',
        }}
      />
      <span style={{ color: style.color }}>{style.label}</span>
    </div>
  );
}
