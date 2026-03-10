import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, LogOut, Menu, X as XIcon, Sparkles } from 'lucide-react';
import { useUIStore } from '../../store/ui-store';
import { useAuthStore } from '../../store/auth-store';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const NAV_ITEMS = [
  { key: 'compose', path: '/' },
  { key: 'generator', path: '/generator' },
  { key: 'campaigns', path: '/campaigns' },
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
  const { isMobile, isTablet } = useBreakpoint();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeTab =
    location.pathname === '/'
      ? 'compose'
      : location.pathname.slice(1);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div ref={menuRef} style={{ position: 'relative', zIndex: 10 }}>
      <div
        style={{
          padding: isMobile ? '12px 16px' : isTablet ? '16px 20px' : '24px 32px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <div
            style={{
              width: isMobile ? '34px' : '42px',
              height: isMobile ? '34px' : '42px',
              borderRadius: isMobile ? '10px' : '12px',
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '14px' : '18px',
              fontWeight: 800,
              color: '#fff',
              boxShadow: '0 0 24px rgba(139,92,246,0.25)',
              flexShrink: 0,
            }}
          >
            H
          </div>
          {!isMobile && (
            <div>
              <div
                style={{
                  fontSize: isTablet ? '15px' : '18px',
                  fontWeight: 800,
                  background: 'var(--gradient-text)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em',
                }}
              >
                Social Command Center
              </div>
              {!isTablet && (
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
              )}
            </div>
          )}
          {isMobile && (
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                background: 'var(--gradient-text)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              SCC
            </div>
          )}
        </div>

        {/* Desktop / Tablet: inline nav */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {NAV_ITEMS.map(({ key, path }) => (
              <button
                key={key}
                onClick={() => navigate(path)}
                style={{
                  padding: isTablet ? '6px 10px' : '8px 16px',
                  borderRadius: '10px',
                  background: activeTab === key ? 'var(--bg-active)' : 'transparent',
                  border: `1px solid ${activeTab === key ? 'var(--border-color)' : 'transparent'}`,
                  color: activeTab === key ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: isTablet ? '11px' : '12px',
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

            {user && (!user.tier || user.tier === 'FREE') && (
              <button
                onClick={() => navigate('/pricing')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease',
                }}
              >
                <Sparkles size={12} />
                Upgrade
              </button>
            )}

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
        )}

        {/* Mobile: theme toggle + hamburger */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={toggleTheme}
              style={{
                padding: '10px',
                borderRadius: '10px',
                background: 'transparent',
                border: '1px solid transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                padding: '10px',
                borderRadius: '10px',
                background: menuOpen ? 'var(--bg-active)' : 'transparent',
                border: menuOpen ? '1px solid var(--border-color)' : '1px solid transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {menuOpen ? <XIcon size={20} /> : <Menu size={20} />}
            </button>
          </div>
        )}
      </div>

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            padding: '8px 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            animation: 'slideDown 0.15s ease-out',
          }}
        >
          {NAV_ITEMS.map(({ key, path }) => (
            <button
              key={key}
              onClick={() => {
                navigate(path);
                setMenuOpen(false);
              }}
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                background: activeTab === key ? 'var(--bg-active)' : 'transparent',
                border: activeTab === key ? '1px solid var(--border-color)' : '1px solid transparent',
                color: activeTab === key ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
                textAlign: 'left' as const,
                fontFamily: "'Sora', sans-serif",
                transition: 'all 0.15s ease',
              }}
            >
              {key}
            </button>
          ))}

          {user && (!user.tier || user.tier === 'FREE') && (
            <button
              onClick={() => {
                navigate('/pricing');
                setMenuOpen(false);
              }}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.12))',
                border: '1px solid rgba(139,92,246,0.25)',
                color: '#8b5cf6',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left' as const,
                fontFamily: "'Sora', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '4px',
              }}
            >
              <Sparkles size={14} />
              Upgrade Plan
            </button>
          )}

          {user && (
            <>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  {user.name || user.email}
                </span>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,68,68,0.1)',
                    border: '1px solid rgba(255,68,68,0.2)',
                    color: '#ff4444',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <LogOut size={12} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
