import { useEffect, useState, useCallback } from 'react';
import { useChatStore } from '../../store/chat-store';
import { useChat } from '../../hooks/useChat';
import ConversationList from './ConversationList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function ChatPanel() {
  const activeView = useChatStore((s) => s.activeView);
  const { loadConversations, openConversation, startNewConversation, sendMessage, removeConversation } = useChat();
  const [editContent, setEditContent] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleBack = () => {
    useChatStore.getState().setActiveConversation(null);
    setEditContent(null);
    loadConversations();
  };

  const handleEditMessage = useCallback((messageId: string, content: string) => {
    // Truncate messages: keep only messages before the edited one
    const state = useChatStore.getState();
    const idx = state.messages.findIndex((m) => m.id === messageId);
    if (idx >= 0) {
      useChatStore.getState().setMessages(state.messages.slice(0, idx));
    }
    setEditContent(content);
  }, []);

  const handleSend = useCallback((content: string) => {
    setEditContent(null);
    sendMessage(content);
  }, [sendMessage]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeView === 'chat' && (
            <button
              onClick={handleBack}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: '16px',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Back to conversations"
            >
              &#8592;
            </button>
          )}
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            AI Assistant
          </span>
        </div>

        {activeView === 'chat' && (
          <button
            onClick={startNewConversation}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '16px',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="New conversation"
          >
            &#x270E;
          </button>
        )}
      </div>

      {/* Body */}
      {activeView === 'list' ? (
        <ConversationList
          onOpen={openConversation}
          onNew={startNewConversation}
          onDelete={removeConversation}
        />
      ) : (
        <>
          <MessageList onEditMessage={handleEditMessage} />
          <MessageInput
            onSend={handleSend}
            editContent={editContent}
            onEditClear={() => setEditContent(null)}
          />
        </>
      )}
    </div>
  );
}
