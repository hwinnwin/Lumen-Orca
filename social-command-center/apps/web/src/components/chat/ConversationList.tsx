import { useChatStore } from '../../store/chat-store';
import type { ChatConversation } from '../../types/chat';

interface ConversationListProps {
  onOpen: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function ConversationList({ onOpen, onNew, onDelete }: ConversationListProps) {
  const conversations = useChatStore((s) => s.conversations);
  const isLoading = useChatStore((s) => s.isLoadingConversations);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ padding: '12px' }}>
        <button
          onClick={onNew}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px dashed var(--border-color)',
            background: 'transparent',
            color: 'var(--accent-purple)',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: "'Sora', sans-serif",
            fontWeight: 500,
          }}
        >
          + New Chat
        </button>
      </div>

      {isLoading && conversations.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Loading...
        </div>
      ) : conversations.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          No conversations yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 8px' }}>
          {conversations.map((conv) => (
            <ConversationItem key={conv.id} conv={conv} onOpen={onOpen} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationItem({
  conv,
  onOpen,
  onDelete,
}: {
  conv: ChatConversation;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const timeAgo = getRelativeTime(conv.updatedAt);

  return (
    <div
      onClick={() => onOpen(conv.id)}
      style={{
        padding: '10px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {conv.title}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {conv._count.messages} messages · {timeAgo}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(conv.id);
        }}
        title="Delete conversation"
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '4px',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          opacity: 0.5,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.color = 'var(--accent-red)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.5';
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
      >
        &#x2715;
      </button>
    </div>
  );
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
