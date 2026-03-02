import { useState } from 'react';
import { useUIStore } from '../../store/ui-store';

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { notifications, markNotificationRead, clearNotifications } = useUIStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const typeColors: Record<string, string> = {
    success: '#22c55e',
    error: '#ff4444',
    info: '#06b6d4',
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'relative',
          padding: '8px 12px',
          background: open ? 'var(--bg-hover)' : 'transparent',
          border: `1px solid ${open ? 'var(--border-color)' : 'transparent'}`,
          borderRadius: '10px',
          cursor: 'pointer',
          color: 'var(--text-tertiary)',
          fontSize: '14px',
          transition: 'all 0.2s ease',
        }}
      >
        {'\u{1F514}'}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#ff4444',
              color: '#fff',
              fontSize: '9px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '320px',
            maxHeight: '400px',
            overflowY: 'auto',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            zIndex: 100,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Notifications
            </span>
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {notifications.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              No notifications
            </div>
          )}

          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationRead(notif.id)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                background: notif.read ? 'transparent' : 'var(--bg-tertiary)',
                transition: 'background 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: typeColors[notif.type] || 'var(--text-tertiary)',
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {notif.title}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '9px',
                    color: 'var(--text-muted)',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  {formatTimeAgo(notif.timestamp)}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', paddingLeft: '14px' }}>
                {notif.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return 'now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return `${Math.floor(diff / 86400_000)}d ago`;
}
