import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { registerUser, loginUser } from '../services/api';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = mode === 'register'
        ? await registerUser({ email, password, name: name || undefined })
        : await loginUser({ email, password });

      login(result.token, result.user);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 800,
              color: '#fff',
              boxShadow: '0 0 30px rgba(139,92,246,0.3)',
              marginBottom: '16px',
            }}
          >
            H
          </div>
          <div
            style={{
              fontSize: '22px',
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
              marginTop: '4px',
            }}
          >
            HwinNwin Enterprises x Lumen Systems
          </div>
        </div>

        {/* Mode Toggle */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: 'var(--bg-tertiary)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '24px',
          }}
        >
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                background: mode === m ? 'var(--bg-active)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'capitalize',
                transition: 'all 0.2s ease',
                fontFamily: "'Sora', sans-serif",
              }}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Emperor"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontFamily: "'Sora', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="emperor@hwinwin.com"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: "'Sora', sans-serif",
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars, 1 upper + 1 lower"
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: "'Sora', sans-serif",
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(255,68,68,0.1)',
                border: '1px solid rgba(255,68,68,0.2)',
                color: '#ff6666',
                fontSize: '12px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading
                ? 'rgba(139,92,246,0.15)'
                : 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'wait' : 'pointer',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              fontFamily: "'Sora', sans-serif",
              boxShadow: loading ? 'none' : '0 4px 20px rgba(139,92,246,0.3)',
              transition: 'all 0.3s ease',
            }}
          >
            {loading
              ? 'Processing...'
              : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
