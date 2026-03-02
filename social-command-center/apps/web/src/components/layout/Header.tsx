import { useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, LogOut } from 'lucide-react';
import { useUIStore } from '../../store/ui-store';
import { useAuthStore } from '../../store/auth-store';

const NAV_ITEMS = [
  { key: 'compose', path: '/' },
  { key: 'generator', path: '/generator' },
  { key: 'queue', path: '/queue' },
  { key: 'analytics', path: '/analytics' },
  { key: 'connections', path: '/connections' },
  { key: 'settings', path: '/settings' },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useUIStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeTab =
    location.pathname === '/'
      ? 'compose'
      : location.pathname.slice(1);

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '24px 32px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
        onClick={() => navigate('/')}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 800,
            color: '#fff',
            boxShadow: '0 0 24px rgba(139,92,246,0.25)',
          }}
        >
          H
        </div>
        <div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 800,
              background: 'var(--gradient-text)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            Social Command Center
          </div>
          <div
            style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            HwinNwin Enterprises {'\u00D7'} Lumen Systems
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {NAV_ITEMS.map(({ key, path }) => (
          <button
            key={key}
            onClick={() => navigate(path)}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background:
                activeTab === key
                  ? 'var(--bg-active)'
                  : 'transparent',
              border: `1px solid ${activeTab === key ? 'var(--border-color)' : 'transparent'}`,
              color: activeTab === key ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.2s ease',
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {key}
          </button>
        ))}

        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 8px' }} />

        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          style={{
            padding: '8px',
            borderRadius: '10px',
            background: 'transparent',
            border: '1px solid transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {user && (
          <>
            <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }} />
            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontFamily: "'IBM Plex Mono', monospace",
                padding: '0 4px',
              }}
            >
              {user.name || user.email}
            </span>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: 'transparent',
                border: '1px solid transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <LogOut size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
