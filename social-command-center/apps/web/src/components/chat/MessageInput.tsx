import { useState, useRef, useCallback } from 'react';
import { useChatStore } from '../../store/chat-store';

interface MessageInputProps {
  onSend: (content: string) => void;
}

export default function MessageInput({ onSend }: MessageInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const cancelStream = useChatStore((s) => s.cancelStream);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isStreaming, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  return (
    <div style={{
      padding: '12px',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-end',
    }}>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        aria-label="Chat message"
        rows={1}
        style={{
          flex: 1,
          resize: 'none',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '13px',
          fontFamily: "'Sora', sans-serif",
          background: 'var(--bg-input)',
          color: 'var(--text-primary)',
          outline: 'none',
          lineHeight: '1.4',
          maxHeight: '120px',
        }}
      />
      {isStreaming ? (
        <button
          onClick={cancelStream}
          aria-label="Stop generating"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--accent-red)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '14px',
          }}
        >
          &#9632;
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          aria-label="Send message"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: 'none',
            background: input.trim() ? 'var(--accent-purple)' : 'var(--bg-hover)',
            color: input.trim() ? '#fff' : 'var(--text-muted)',
            cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '16px',
          }}
        >
          &#8593;
        </button>
      )}
    </div>
  );
}
