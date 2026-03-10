import { Check } from 'lucide-react';
import Header from '../components/layout/Header';
import { useCheckout, useTierAccess, useSubscription } from '../hooks/useBilling';
import { useBreakpoint } from '../hooks/useBreakpoint';

const TIERS = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    monthlyCredits: null,
    bonusLabel: null,
    features: [
      'Basic posting to all platforms',
      'AI text enhancement',
      'Content brainstorming',
      'Thread & hook generation',
      'Quote card generator',
      'Carousel & video generator',
      '500 signup credits',
    ],
    cta: 'Current Plan',
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 29,
    monthlyCredits: '3,045 credits/mo',
    bonusLabel: '5% credit bonus',
    features: [
      'Everything in Free',
      '3,045 credits included monthly',
      'Post scheduling',
      'Campaign generator',
      'Bulk post creation',
      'Basic analytics',
      'Platform-specific posts',
      '5% bonus on extra credit purchases',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: 89,
    monthlyCredits: '9,790 credits/mo',
    bonusLabel: '10% credit bonus',
    features: [
      'Everything in Pro',
      '9,790 credits included monthly',
      'Content repurposing',
      'Content strategy planner',
      'Advanced analytics',
      'Priority support',
      '10% bonus on extra credit purchases',
    ],
    cta: 'Upgrade to Premium',
  },
  {
    id: 'POWER',
    name: 'Power User',
    price: 199,
    monthlyCredits: '21,890 credits/mo',
    bonusLabel: '10% credit bonus',
    features: [
      'Everything in Premium',
      '21,890 credits included monthly',
      'Exclusive early-access features',
      'Dedicated support',
      '10% bonus on extra credit purchases',
    ],
    cta: 'Upgrade to Power',
  },
];

export default function PricingPage() {
  const { tier: currentTier } = useTierAccess();
  const checkout = useCheckout();
  const { data: subscription } = useSubscription();
  const { isMobile } = useBreakpoint();

  const handleUpgrade = (tierId: string) => {
    if (tierId === 'FREE' || tierId === currentTier) return;
    checkout.mutate(tierId);
  };

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
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '16px' : '40px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1
            style={{
              fontSize: isMobile ? '24px' : '32px',
              fontWeight: 800,
              marginBottom: '12px',
              background: 'var(--gradient-text)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Choose Your Plan
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
            Unlock powerful features to supercharge your social media strategy
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          {TIERS.map((plan) => {
            const isCurrent = currentTier === plan.id;
            const isPopular = plan.popular;
            return (
              <div
                key={plan.id}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: isPopular
                    ? '2px solid rgba(139,92,246,0.5)'
                    : '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '24px',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                }}
              >
                {isPopular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '4px 16px',
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Most Popular
                  </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{plan.name}</h3>
                  {plan.bonusLabel && (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(34,197,94,0.1)',
                        color: '#22c55e',
                        fontSize: '10px',
                        fontWeight: 700,
                      }}
                    >
                      {plan.bonusLabel}
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 800 }}>
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/mo</span>
                  )}
                  {plan.monthlyCredits && (
                    <div
                      style={{
                        marginTop: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#8b5cf6',
                      }}
                    >
                      {plan.monthlyCredits} included
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  {plan.features.map((feature) => (
                    <div key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Check
                        size={14}
                        style={{
                          color: '#22c55e',
                          marginTop: '2px',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || plan.id === 'FREE' || checkout.isPending}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    border: isCurrent
                      ? '1px solid var(--border-color)'
                      : 'none',
                    background: isCurrent
                      ? 'transparent'
                      : plan.id === 'FREE'
                        ? 'var(--bg-hover)'
                        : 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                    color: isCurrent
                      ? 'var(--text-muted)'
                      : plan.id === 'FREE'
                        ? 'var(--text-muted)'
                        : '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isCurrent || plan.id === 'FREE' ? 'default' : 'pointer',
                    opacity: checkout.isPending ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isCurrent
                    ? 'Current Plan'
                    : plan.id === 'FREE'
                      ? 'Free Forever'
                      : checkout.isPending
                        ? 'Redirecting...'
                        : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {subscription?.subscription && (
          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Manage your existing subscription from{' '}
            <a href="/settings" style={{ color: '#8b5cf6', textDecoration: 'none' }}>Settings</a>
          </p>
        )}
      </div>
    </div>
  );
}
