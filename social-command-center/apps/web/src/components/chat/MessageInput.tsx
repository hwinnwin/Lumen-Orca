import { useState, useRef, useCallback, useEffect } from 'react';
import { useChatStore } from '../../store/chat-store';

interface MessageInputProps {
  onSend: (content: string) => void;
  editContent?: string | null;
  onEditClear?: () => void;
}

export default function MessageInput({ onSend, editContent, onEditClear }: MessageInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const cancelStream = useChatStore((s) => s.cancelStream);

  // When editContent changes, pre-fill the input
  useEffect(() => {
    if (editContent != null) {
      setInput(editContent);
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
      }
    }
  }, [editContent]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput('');
    if (onEditClear) onEditClear();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isStreaming, onSend, onEditClear]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape' && editContent != null) {
      setInput('');
      if (onEditClear) onEditClear();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  return (
    <div style={{
      padding: '12px',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      {editContent != null && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          borderRadius: '6px',
          background: 'var(--bg-hover)',
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}>
          <span>Editing message</span>
          <button
            onClick={() => {
              setInput('');
              if (onEditClear) onEditClear();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '12px',
              padding: '0 2px',
            }}
            aria-label="Cancel edit"
          >
            &#x2715;
          </button>
        </div>
      )}
      <div style={{
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
            border: `1px solid ${editContent != null ? 'var(--accent-purple)' : 'var(--border-color)'}`,
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
            aria-label={editContent != null ? 'Resend edited message' : 'Send message'}
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
    </div>
  );
}
