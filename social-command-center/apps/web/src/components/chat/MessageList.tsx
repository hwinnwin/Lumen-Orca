import { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/chat-store';

export default function MessageList() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

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
        <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
      ))}
      {isStreaming && streamingContent && (
        <MessageBubble role="ASSISTANT" content={streamingContent} streaming />
      )}
      {isStreaming && !streamingContent && (
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

function MessageBubble({ role, content, streaming }: { role: 'USER' | 'ASSISTANT'; content: string; streaming?: boolean }) {
  const isUser = role === 'USER';

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
    </div>
  );
}
