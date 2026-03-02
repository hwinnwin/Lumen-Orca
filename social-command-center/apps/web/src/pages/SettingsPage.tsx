import { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings, useChangePassword } from '../hooks/useSettings';
import { useUIStore } from '../store/ui-store';
import { useConnections } from '../hooks/useConnections';
import { PLATFORMS } from '@scc/shared';
import { toast } from 'sonner';
import Header from '../components/layout/Header';

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
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

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
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
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
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '32px' }}>
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
