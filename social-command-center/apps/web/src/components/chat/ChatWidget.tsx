import { useChatStore } from '../../store/chat-store';
import ChatPanel from './ChatPanel';

export default function ChatWidget() {
  const isOpen = useChatStore((s) => s.isOpen);
  const toggle = useChatStore((s) => s.toggle);

  return (
    <>
      {/* Floating panel — responsive: full-screen on mobile, floating on desktop */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="AI Assistant"
          style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            width: '100%',
            height: '100%',
            maxWidth: '420px',
            maxHeight: '600px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: "'Sora', sans-serif",
          }}
          className="chat-panel"
        >
          <ChatPanel />
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={toggle}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          border: 'none',
          background: 'var(--gradient-brand)',
          color: '#fff',
          cursor: 'pointer',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          boxShadow: 'var(--shadow-md)',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {isOpen ? '\u2715' : '\u2728'}
      </button>
    </>
  );
}
