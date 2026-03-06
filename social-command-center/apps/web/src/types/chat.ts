export interface ChatConversation {
  id: string;
  title: string;
  updatedAt: string;
  _count: { messages: number };
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

export interface CachedConversation {
  id: string;
  messages: ChatMessage[];
  lastSyncedAt: number;
}
