import { create } from 'zustand';
import type { ChatConversation, ChatMessage, CachedConversation } from '../types/chat';

const CACHE_KEY = 'scc-chat-cache';
const MAX_CACHED_CONVOS = 5;
const MAX_CACHED_MESSAGES = 100;

type ActiveView = 'list' | 'chat';

interface ChatState {
  isOpen: boolean;
  activeView: ActiveView;
  conversations: ChatConversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  abortController: AbortController | null;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;

  toggle: () => void;
  setOpen: (open: boolean) => void;
  setActiveView: (view: ActiveView) => void;
  setConversations: (convos: ChatConversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  setIsStreaming: (streaming: boolean) => void;
  appendStreamToken: (token: string) => void;
  finalizeStream: (assistantMessage: ChatMessage) => void;
  cancelStream: () => void;
  setAbortController: (ctrl: AbortController | null) => void;
  setLoadingConversations: (loading: boolean) => void;
  setLoadingMessages: (loading: boolean) => void;
  updateConversationTitle: (id: string, title: string) => void;
  removeConversation: (id: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  isOpen: false,
  activeView: 'list',
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  abortController: null,
  isLoadingConversations: false,
  isLoadingMessages: false,

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (isOpen) => set({ isOpen }),
  setActiveView: (activeView) => set({ activeView }),
  setConversations: (conversations) => set({ conversations }),

  setActiveConversation: (id) =>
    set({ activeConversationId: id, activeView: id ? 'chat' : 'list' }),

  setMessages: (messages) => set({ messages }),

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  setIsStreaming: (isStreaming) => set({ isStreaming }),

  appendStreamToken: (token) =>
    set((s) => ({ streamingContent: s.streamingContent + token })),

  finalizeStream: (assistantMessage) =>
    set((s) => {
      const messages = [...s.messages, assistantMessage];
      // Cache messages for this conversation
      if (s.activeConversationId) {
        cacheMessages(s.activeConversationId, messages);
      }
      return {
        messages,
        isStreaming: false,
        streamingContent: '',
        abortController: null,
      };
    }),

  cancelStream: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ isStreaming: false, streamingContent: '', abortController: null });
  },

  setAbortController: (abortController) => set({ abortController }),
  setLoadingConversations: (isLoadingConversations) => set({ isLoadingConversations }),
  setLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),

  updateConversationTitle: (id, title) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, title } : c,
      ),
    })),

  removeConversation: (id) =>
    set((s) => {
      clearCachedMessages(id);
      return {
        conversations: s.conversations.filter((c) => c.id !== id),
        ...(s.activeConversationId === id
          ? { activeConversationId: null, messages: [], activeView: 'list' as ActiveView }
          : {}),
      };
    }),
}));

// ─── localStorage cache helpers ─────────────────────────

function getCache(): CachedConversation[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCache(cache: CachedConversation[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* storage full — ignore */ }
}

export function cacheMessages(conversationId: string, messages: ChatMessage[]) {
  const cache = getCache().filter((c) => c.id !== conversationId);
  cache.unshift({
    id: conversationId,
    messages: messages.slice(-MAX_CACHED_MESSAGES),
    lastSyncedAt: Date.now(),
  });
  saveCache(cache.slice(0, MAX_CACHED_CONVOS));
}

export function getCachedMessages(conversationId: string): ChatMessage[] | null {
  const cached = getCache().find((c) => c.id === conversationId);
  return cached ? cached.messages : null;
}

function clearCachedMessages(conversationId: string) {
  const cache = getCache().filter((c) => c.id !== conversationId);
  saveCache(cache);
}
