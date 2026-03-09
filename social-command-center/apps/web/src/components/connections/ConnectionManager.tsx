import { useEffect, useCallback } from 'react';
import { PLATFORMS } from '@scc/shared';
import type { PlatformId } from '@scc/shared';
import { useConnections, useDisconnect } from '../../hooks/useConnections';
import Header from '../layout/Header';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const PLATFORM_MAP: Record<string, PlatformId> = {
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
  LINKEDIN: 'linkedin',
  X: 'x',
  TIKTOK: 'tiktok',
  YOUTUBE: 'youtube',
};

function getConnectionHealth(tokenExpiresAt: string | null): 'good' | 'expiring' | 'expired' {
  if (!tokenExpiresAt) return 'good';
  const expiresAt = new Date(tokenExpiresAt).getTime();
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;

  if (expiresAt <= now) return 'expired';
  if (expiresAt - now < 3 * dayInMs) return 'expiring';
  return 'good';
}

const healthColors = {
  good: '#22c55e',
  expiring: '#ffaa00',
  expired: '#ff4444',
  disconnected: 'var(--text-muted)',
};

export default function ConnectionManager() {
  const { data: connections, isLoading, refetch } = useConnections();
  const disconnect = useDisconnect();
  const { isMobile } = useBreakpoint();

  // Listen for OAuth popup completion messages.
  // The callback HTML is served from the API server (port 3001), not the Vite dev server,
  // because Twitter redirects directly to the API's callback URL.
  const handleMessage = useCallback((event: MessageEvent) => {
    const allowedOrigins = [window.location.origin, 'https://localhost:3001', 'http://localhost:3001'];
    if (!allowedOrigins.includes(event.origin)) return;
    try {
      const data = JSON.parse(event.data);
      if (data.success || data.error) {
        refetch();
      }
    } catch {
      // Not a JSON message, ignore
    }
  }, [refetch]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const connectPlatform = (platformId: PlatformId) => {
    const platformRoute: Record<PlatformId, string> = {
      facebook: 'meta',
      instagram: 'meta',
      linkedin: 'linkedin',
      x: 'x',
      tiktok: 'tiktok',
      youtube: 'google',
    };
    // Pass JWT token as query param since popups can't send Authorization headers
    const token = localStorage.getItem('scc-token');
    const url = `/api/auth/${platformRoute[platformId]}/start${token ? `?token=${token}` : ''}`;
    window.open(url, '_blank', 'width=600,height=700');
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
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '16px' : '32px' }}>
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
          Connected Accounts
        </h1>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontFamily: "'IBM Plex Mono', monospace",
            marginBottom: '32px',
          }}
        >
          Manage your social platform connections
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px',
          }}
        >
          {PLATFORMS.map((platform) => {
            const connection = connections?.find(
              (c) => PLATFORM_MAP[c.platform] === platform.id,
            );
            const isConnected = connection?.isActive;
            const health = isConnected
              ? getConnectionHealth(connection?.tokenExpiresAt ?? null)
              : 'disconnected';
            const accent = platform.accent || platform.color;

            return (
              <div
                key={platform.id}
                style={{
                  background: isConnected
                    ? platform.bg
                    : 'var(--bg-tertiary)',
                  border: `1.5px solid ${isConnected ? accent : 'var(--border-color)'}`,
                  borderRadius: '16px',
                  padding: '20px',
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '24px',
                      fontWeight: 800,
                      color: isConnected ? accent : 'var(--text-muted)',
                    }}
                  >
                    {platform.icon}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: isConnected ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      }}
                    >
                      {platform.name}
                    </div>
                    {isConnected && connection?.platformName && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-tertiary)',
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}
                      >
                        {connection.platformName}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      marginLeft: 'auto',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: healthColors[health],
                      boxShadow:
                        health === 'good'
                          ? `0 0 8px ${healthColors.good}88`
                          : 'none',
                    }}
                  />
                </div>

                {isConnected ? (
                  <div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: healthColors[health],
                        marginBottom: '12px',
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      {health === 'good' && 'Connected'}
                      {health === 'expiring' && 'Token expiring soon'}
                      {health === 'expired' && 'Token expired \u2014 reconnect'}
                    </div>
                    <button
                      onClick={() => disconnect.mutate(connection.id)}
                      disabled={disconnect.isPending}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'rgba(255,0,0,0.08)',
                        border: '1px solid rgba(255,0,0,0.2)',
                        borderRadius: '8px',
                        color: '#ff6666',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: "'Sora', sans-serif",
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => connectPlatform(platform.id)}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: `linear-gradient(135deg, ${accent}22, ${accent}11)`,
                      border: `1px solid ${accent}44`,
                      borderRadius: '8px',
                      color: accent,
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'Sora', sans-serif",
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Connect {platform.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
