import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatStore, getCachedMessages, cacheMessages } from '../store/chat-store';
import {
  fetchConversations,
  createConversation,
  fetchConversationMessages,
  deleteConversation,
  streamChatMessage,
} from '../services/api';
import type { ChatMessage } from '../types/chat';

export function useChat() {
  const store = useChatStore();
  const queryClient = useQueryClient();

  const loadConversations = useCallback(async () => {
    store.setLoadingConversations(true);
    try {
      const convos = await fetchConversations();
      store.setConversations(convos ?? []);
    } catch (err) {
      console.error('[Chat] Failed to load conversations:', err);
    } finally {
      store.setLoadingConversations(false);
    }
  }, []);

  const openConversation = useCallback(async (id: string) => {
    store.setActiveConversation(id);

    // Show cached messages instantly
    const cached = getCachedMessages(id);
    if (cached) {
      store.setMessages(cached);
    }

    // Fetch fresh from DB
    store.setLoadingMessages(!cached);
    try {
      const messages = await fetchConversationMessages(id);
      store.setMessages(messages ?? []);
      if (messages) {
        cacheMessages(id, messages);
      }
    } catch (err) {
      console.error('[Chat] Failed to load messages:', err);
    } finally {
      store.setLoadingMessages(false);
    }
  }, []);

  const startNewConversation = useCallback(async () => {
    try {
      const conv = await createConversation();
      store.setConversations([
        { id: conv.id, title: conv.title, updatedAt: conv.updatedAt, _count: { messages: 0 } },
        ...useChatStore.getState().conversations,
      ]);
      store.setMessages([]);
      store.setActiveConversation(conv.id);
      return conv.id;
    } catch (err) {
      console.error('[Chat] Failed to create conversation:', err);
      return null;
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const state = useChatStore.getState();
    let conversationId = state.activeConversationId;

    // Auto-create conversation if none active
    if (!conversationId) {
      const newId = await startNewConversation();
      if (!newId) return;
      conversationId = newId;
    }

    // Add optimistic user message
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId,
      role: 'USER',
      content,
      createdAt: new Date().toISOString(),
    };
    store.addMessage(userMessage);
    store.setIsStreaming(true);

    const controller = streamChatMessage(conversationId, content, {
      onToken: (token) => {
        useChatStore.getState().appendStreamToken(token);
      },
      onDone: (meta) => {
        const currentState = useChatStore.getState();
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          conversationId: conversationId!,
          role: 'ASSISTANT',
          content: currentState.streamingContent,
          createdAt: new Date().toISOString(),
        };
        currentState.finalizeStream(assistantMessage);

        // Update conversation title if returned
        if (meta.title && conversationId) {
          useChatStore.getState().updateConversationTitle(conversationId, meta.title);
        }

        // Invalidate credits query
        queryClient.invalidateQueries({ queryKey: ['creditBalance'] });
      },
      onError: (error) => {
        console.error('[Chat] Stream error:', error);
        useChatStore.getState().setIsStreaming(false);
        // Add error message as assistant response
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          conversationId: conversationId!,
          role: 'ASSISTANT',
          content: `Sorry, something went wrong: ${error}`,
          createdAt: new Date().toISOString(),
        };
        useChatStore.getState().addMessage(errMsg);
      },
    });

    store.setAbortController(controller);
  }, [startNewConversation, queryClient]);

  const removeConversation = useCallback(async (id: string) => {
    try {
      await deleteConversation(id);
      store.removeConversation(id);
    } catch (err) {
      console.error('[Chat] Failed to delete conversation:', err);
    }
  }, []);

  return {
    loadConversations,
    openConversation,
    startNewConversation,
    sendMessage,
    removeConversation,
  };
}
