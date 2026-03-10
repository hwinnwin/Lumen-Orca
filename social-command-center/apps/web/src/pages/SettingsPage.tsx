import { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings, useChangePassword } from '../hooks/useSettings';
import { useUIStore } from '../store/ui-store';
import { useConnections } from '../hooks/useConnections';
import { useSubscription, usePortal, useCancelSubscription, useResumeSubscription, useAutoTopUp, useUpdateAutoTopUp } from '../hooks/useBilling';
import { useAuthStore } from '../store/auth-store';
import { PLATFORMS } from '@scc/shared';
import { toast } from 'sonner';
import Header from '../components/layout/Header';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useNavigate } from 'react-router-dom';

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const changePasswordMutation = useChangePassword();
  const { data: connections } = useConnections();
  const { data: subscription } = useSubscription();
  const portal = usePortal();
  const cancelSub = useCancelSubscription();
  const resumeSub = useResumeSubscription();
  const { data: autoTopUp } = useAutoTopUp();
  const updateAutoTopUp = useUpdateAutoTopUp();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const { isMobile } = useBreakpoint();

  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [defaultTone, setDefaultTone] = useState('professional');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (settings) {
      setName(settings.name || '');
      setTimezone(settings.timezone || 'UTC');
      setDefaultTone(settings.settings?.defaultTone || 'professional');
      setNotificationsEnabled(settings.settings?.notificationsEnabled !== false);
    }
  }, [settings]);

  const handleSaveProfile = async () => {
    try {
      await updateSettings.mutateAsync({
        name: name.trim() || undefined,
        timezone,
        settings: { defaultTone, notificationsEnabled },
      });
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Fill in both password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword)) {
      toast.error('Password must be at least 8 characters with 1 uppercase and 1 lowercase letter');
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Failed to change password — check your current password');
    }
  };

  const connectedPlatforms = connections || [];

  const sectionStyle: React.CSSProperties = {
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    fontFamily: "'IBM Plex Mono', monospace",
    marginBottom: '8px',
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontFamily: "'Sora', sans-serif",
    outline: 'none',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Header />
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading settings...
        </div>
      </div>
    );
  }

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
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px' }}>
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
          Settings
        </h1>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontFamily: "'IBM Plex Mono', monospace",
            marginBottom: '32px',
          }}
        >
          Manage your profile, preferences, and security
        </p>

        {/* Profile Section */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-secondary)' }}>
            Profile
          </h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <div
                style={{
                  ...inputStyle,
                  background: 'var(--bg-hover)',
                  color: 'var(--text-muted)',
                  cursor: 'not-allowed',
                }}
              >
                {settings?.email}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Account Created</label>
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                {settings?.createdAt ? new Date(settings.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }) : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-secondary)' }}>
            Preferences
          </h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Theme</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['light', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { if (theme !== t) toggleTheme(); }}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '8px',
                      background: theme === t ? 'var(--bg-active)' : 'transparent',
                      border: `1px solid ${theme === t ? 'var(--border-color)' : 'var(--border-subtle)'}`,
                      color: theme === t ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {t === 'light' ? '\u2600\uFE0F' : '\u{1F319}'} {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Default AI Tone</label>
              <select
                value={defaultTone}
                onChange={(e) => setDefaultTone(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {['professional', 'casual', 'inspirational', 'humorous', 'storytelling', 'emperor-mode'].map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ ...labelStyle, marginBottom: 0, flex: 1 }}>Toast Notifications</label>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  background: notificationsEnabled ? '#22c55e' : 'var(--bg-hover)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: '3px',
                    left: notificationsEnabled ? '23px' : '3px',
                    transition: 'left 0.2s ease',
                  }}
                />
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={updateSettings.isPending}
            style={{
              ...buttonStyle,
              marginTop: '20px',
              opacity: updateSettings.isPending ? 0.5 : 1,
            }}
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Subscription & Billing */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-secondary)' }}>
            Subscription & Billing
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '8px',
                background: (user?.tier || 'FREE') === 'FREE'
                  ? 'var(--bg-hover)'
                  : 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.15))',
                border: (user?.tier || 'FREE') === 'FREE'
                  ? '1px solid var(--border-color)'
                  : '1px solid rgba(139,92,246,0.3)',
                color: (user?.tier || 'FREE') === 'FREE' ? 'var(--text-muted)' : '#8b5cf6',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {user?.tier || 'FREE'}
            </span>
            {subscription?.subscription && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                {subscription.subscription.cancelAtPeriodEnd ? 'Cancels' : 'Renews'}{' '}
                {new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>

          {(subscription?.bonusRate ?? 0) > 0 && (
            <div
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.15)',
                fontSize: '12px',
                color: '#22c55e',
                fontWeight: 600,
                marginBottom: '16px',
              }}
            >
              {Math.round((subscription?.bonusRate ?? 0) * 100)}% bonus on all credit purchases
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(user?.tier || 'FREE') === 'FREE' ? (
              <button
                onClick={() => navigate('/pricing')}
                style={{
                  ...buttonStyle,
                  fontSize: '12px',
                  padding: '8px 20px',
                }}
              >
                Upgrade Plan
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/pricing')}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Change Plan
                </button>
                <button
                  onClick={() => portal.mutate()}
                  disabled={portal.isPending}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: portal.isPending ? 0.5 : 1,
                  }}
                >
                  {portal.isPending ? 'Opening...' : 'Manage Billing'}
                </button>
                {subscription?.subscription?.cancelAtPeriodEnd ? (
                  <button
                    onClick={() => {
                      resumeSub.mutate(undefined, {
                        onSuccess: () => toast.success('Subscription resumed'),
                        onError: () => toast.error('Failed to resume subscription'),
                      });
                    }}
                    disabled={resumeSub.isPending}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '10px',
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.3)',
                      color: '#22c55e',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      opacity: resumeSub.isPending ? 0.5 : 1,
                    }}
                  >
                    {resumeSub.isPending ? 'Resuming...' : 'Resume Subscription'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (!confirm('Cancel your subscription? You\'ll keep access until the end of your billing period.')) return;
                      cancelSub.mutate(undefined, {
                        onSuccess: () => toast.success('Subscription will cancel at end of billing period'),
                        onError: () => toast.error('Failed to cancel subscription'),
                      });
                    }}
                    disabled={cancelSub.isPending}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '10px',
                      background: 'transparent',
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: '#ef4444',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      opacity: cancelSub.isPending ? 0.5 : 1,
                    }}
                  >
                    {cancelSub.isPending ? 'Canceling...' : 'Cancel Subscription'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Auto Top-Up — only show for paid users */}
          {user?.tier && user.tier !== 'FREE' && (
            <>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '20px 0' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>
                Auto Top-Up
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
                When enabled, your card on file will be automatically charged when your credit balance
                drops below the threshold. This ensures uninterrupted access to AI features.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <label style={{ ...labelStyle, marginBottom: 0, flex: 1 }}>Enable Auto Top-Up</label>
                <button
                  onClick={() => {
                    const newEnabled = !autoTopUp?.enabled;
                    updateAutoTopUp.mutate(
                      {
                        enabled: newEnabled,
                        threshold: autoTopUp?.threshold,
                        amount: autoTopUp?.amount,
                      },
                      {
                        onSuccess: () =>
                          toast.success(newEnabled ? 'Auto top-up enabled' : 'Auto top-up disabled'),
                        onError: (err: any) =>
                          toast.error(err?.response?.data?.error || 'Failed to update auto top-up'),
                      },
                    );
                  }}
                  disabled={updateAutoTopUp.isPending}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    background: autoTopUp?.enabled ? '#22c55e' : 'var(--bg-hover)',
                    border: 'none',
                    cursor: updateAutoTopUp.isPending ? 'wait' : 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s ease',
                    opacity: updateAutoTopUp.isPending ? 0.5 : 1,
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#fff',
                      position: 'absolute',
                      top: '3px',
                      left: autoTopUp?.enabled ? '23px' : '3px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>

              {autoTopUp?.enabled && (
                <div style={{ display: 'grid', gap: '12px', maxWidth: '300px' }}>
                  <div>
                    <label style={labelStyle}>Top-up when balance drops below</label>
                    <select
                      value={autoTopUp?.threshold ?? 100}
                      onChange={(e) =>
                        updateAutoTopUp.mutate(
                          { enabled: true, threshold: Number(e.target.value), amount: autoTopUp?.amount },
                          { onSuccess: () => toast.success('Threshold updated') },
                        )
                      }
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value={50}>50 credits ($0.50)</option>
                      <option value={100}>100 credits ($1.00)</option>
                      <option value={250}>250 credits ($2.50)</option>
                      <option value={500}>500 credits ($5.00)</option>
                      <option value={1000}>1,000 credits ($10.00)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Amount to top up</label>
                    <select
                      value={autoTopUp?.amount ?? 1000}
                      onChange={(e) =>
                        updateAutoTopUp.mutate(
                          { enabled: true, threshold: autoTopUp?.threshold, amount: Number(e.target.value) },
                          { onSuccess: () => toast.success('Top-up amount updated') },
                        )
                      }
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value={500}>500 credits ($5.00)</option>
                      <option value={1000}>1,000 credits ($10.00)</option>
                      <option value={2500}>2,500 credits ($25.00)</option>
                      <option value={5000}>5,000 credits ($50.00)</option>
                      <option value={10000}>10,000 credits ($100.00)</option>
                    </select>
                  </div>
                </div>
              )}

              {!autoTopUp?.hasPaymentMethod && !autoTopUp?.enabled && (
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.15)',
                    fontSize: '12px',
                    color: '#f59e0b',
                    fontWeight: 500,
                    marginTop: '8px',
                  }}
                >
                  Add a payment method via "Manage Billing" to enable auto top-up.
                </div>
              )}
            </>
          )}
        </div>

        {/* Connected Platforms */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-secondary)' }}>
            Connected Platforms
          </h2>

          {connectedPlatforms.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              No platforms connected. Go to the{' '}
              <a href="/connections" style={{ color: '#8b5cf6', textDecoration: 'none' }}>
                Connections page
              </a>{' '}
              to link your accounts.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {connectedPlatforms.map((conn: any) => {
                const platform = PLATFORMS.find((p) => p.id === conn.platform.toLowerCase());
                return (
                  <div
                    key={conn.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'var(--bg-hover)',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{platform?.icon || conn.platform}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {platform?.name || conn.platform}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                        {conn.platformName || conn.platformUserId || 'Connected'}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: conn.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(255,68,68,0.1)',
                        color: conn.isActive ? '#22c55e' : '#ff4444',
                        fontSize: '10px',
                        fontWeight: 700,
                      }}
                    >
                      {conn.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Change Password */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-secondary)' }}>
            Security
          </h2>

          <div style={{ display: 'grid', gap: '12px', maxWidth: '400px' }}>
            <div>
              <label style={labelStyle}>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={changePasswordMutation.isPending}
            style={{
              ...buttonStyle,
              marginTop: '16px',
              background: 'var(--bg-active)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              opacity: changePasswordMutation.isPending ? 0.5 : 1,
            }}
          >
            {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
