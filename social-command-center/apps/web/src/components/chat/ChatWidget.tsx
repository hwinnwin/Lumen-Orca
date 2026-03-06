import { useChatStore } from '../../store/chat-store';
import ChatPanel from './ChatPanel';

export default function ChatWidget() {
  const isOpen = useChatStore((s) => s.isOpen);
  const toggle = useChatStore((s) => s.toggle);

  return (
    <>
      {/* Floating panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          width: '400px',
          height: '560px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "'Sora', sans-serif",
        }}>
          <ChatPanel />
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={toggle}
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
        title={isOpen ? 'Close chat' : 'Open AI Assistant'}
      >
        {isOpen ? '\u2715' : '\u2728'}
      </button>
    </>
  );
}
