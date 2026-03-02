import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Lightweight page loaded in the OAuth popup after the callback redirect.
 * Since this runs on the same origin as the opener, postMessage and window.close() work reliably.
 */
export default function OAuthCallback() {
  const [params] = useSearchParams();

  useEffect(() => {
    const result = {
      success: params.get('success'),
      error: params.get('error'),
    };

    // Notify the parent window
    if (window.opener) {
      window.opener.postMessage(JSON.stringify(result), window.location.origin);
    }

    // Close the popup
    window.close();
  }, [params]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Sora', sans-serif",
        fontSize: '13px',
      }}
    >
      Connecting... this window should close automatically.
    </div>
  );
}
