import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useChatStore } from '../../store/chat-store';

interface MessageListProps {
  onEditMessage?: (messageId: string, content: string) => void;
}

export default function MessageList({ onEditMessage }: MessageListProps) {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const activeToolAction = useChatStore((s) => s.activeToolAction);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, activeToolAction]);

  if (isLoadingMessages && messages.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    );
  }

  if (messages.length === 0 && !isStreaming) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        gap: '8px',
        padding: '24px',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: '28px' }}>&#x2728;</span>
        <span style={{ fontSize: '13px' }}>Ask me anything about marketing, content creation, or your account.</span>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          id={msg.id}
          role={msg.role}
          content={msg.content}
          onEdit={onEditMessage}
          canEdit={!isStreaming}
        />
      ))}
      {isStreaming && streamingContent && (
        <MessageBubble role="ASSISTANT" content={streamingContent} streaming />
      )}
      {isStreaming && activeToolAction && (
        <div style={{
          alignSelf: 'flex-start',
          padding: '8px 12px',
          borderRadius: '10px',
          background: 'var(--bg-hover)',
          color: 'var(--accent-purple)',
          fontSize: '12px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span className="chat-dots" style={{ color: 'var(--accent-purple)' }}>{activeToolAction}</span>
        </div>
      )}
      {isStreaming && !streamingContent && !activeToolAction && (
        <div style={{
          alignSelf: 'flex-start',
          padding: '10px 14px',
          borderRadius: '12px',
          background: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          fontSize: '13px',
        }}>
          <span className="chat-dots">Thinking</span>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

function MessageBubble({
  id,
  role,
  content,
  streaming,
  onEdit,
  canEdit,
}: {
  id?: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  streaming?: boolean;
  onEdit?: (messageId: string, content: string) => void;
  canEdit?: boolean;
}) {
  const isUser = role === 'USER';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleEdit = () => {
    if (id && onEdit) {
      onEdit(id, content);
    }
  };

  const actionBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 4px',
    fontSize: '12px',
    color: 'var(--text-muted)',
    borderRadius: '4px',
    opacity: 0.6,
    transition: 'opacity 0.15s',
    lineHeight: 1,
  };

  return (
    <div style={{
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      maxWidth: '85%',
    }}>
      <div style={{
        padding: '10px 14px',
        borderRadius: '12px',
        background: isUser ? 'var(--accent-purple)' : 'var(--bg-tertiary)',
        color: isUser ? '#fff' : 'var(--text-primary)',
        fontSize: '13px',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {content}
        {streaming && <span className="chat-cursor">|</span>}
      </div>
      {/* Action buttons — shown below the bubble */}
      {!streaming && (
        <div style={{
          display: 'flex',
          gap: '2px',
          marginTop: '2px',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
        }}>
          {/* Copy — available on all messages */}
          <button
            onClick={handleCopy}
            title="Copy message"
            aria-label="Copy message"
            style={actionBtnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
          >
            {copied ? '\u2713' : '\u2398'}
          </button>
          {/* Edit — only on user messages when not streaming */}
          {isUser && canEdit && onEdit && (
            <button
              onClick={handleEdit}
              title="Edit and resend"
              aria-label="Edit message"
              style={actionBtnStyle}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
            >
              &#9998;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
