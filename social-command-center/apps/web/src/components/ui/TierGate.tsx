import { useNavigate } from 'react-router-dom';
import { useTierAccess } from '../../hooks/useBilling';

interface TierGateProps {
  requiredTier: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const TIER_LABELS: Record<string, string> = {
  PRO: 'Pro',
  PREMIUM: 'Premium',
  POWER: 'Power User',
};

export default function TierGate({ requiredTier, children, fallback }: TierGateProps) {
  const { hasAccess, tier } = useTierAccess();
  const navigate = useNavigate();

  if (hasAccess(requiredTier)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.15))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
        }}
      >
        {'\u{1F512}'}
      </div>
      <div>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}
        >
          {TIER_LABELS[requiredTier] || requiredTier} Feature
        </h3>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            maxWidth: '360px',
            lineHeight: 1.6,
          }}
        >
          This feature requires the {TIER_LABELS[requiredTier] || requiredTier} plan.
          {tier === 'FREE' ? ' Upgrade to unlock powerful tools for your content strategy.' : ' Upgrade your plan to access this feature.'}
        </p>
      </div>
      <button
        onClick={() => navigate('/pricing')}
        style={{
          padding: '10px 28px',
          background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
          border: 'none',
          borderRadius: '10px',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        View Plans
      </button>
    </div>
  );
}
