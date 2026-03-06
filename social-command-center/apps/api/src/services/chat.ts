import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';
import { prisma } from '../db/client.js';

// ─── Anthropic Client (same lazy pattern as ai.ts) ──────

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}

// ─── Types ──────────────────────────────────────────────

interface ChatContext {
  userName: string | null;
  connectedPlatforms: string[];
  recentPostCount: number;
  recentPosts: Array<{ content: string; platforms: string[]; status: string; createdAt: Date }>;
  creditBalance: number;
}

// ─── Context Fetcher ────────────────────────────────────

export async function getUserChatContext(userId: string): Promise<ChatContext> {
  const [user, connections, posts, creditBalance] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.platformConnection.findMany({
      where: { userId, isActive: true },
      select: { platform: true },
    }),
    prisma.post.findMany({
      where: { userId, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      select: { content: true, platforms: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.creditBalance.findUnique({ where: { userId }, select: { balance: true } }),
  ]);

  return {
    userName: user?.name || null,
    connectedPlatforms: connections.map((c) => c.platform),
    recentPostCount: posts.length,
    recentPosts: posts.slice(0, 5),
    creditBalance: creditBalance?.balance || 0,
  };
}

// ─── System Prompt ──────────────────────────────────────

function buildChatSystemPrompt(ctx: ChatContext): string {
  const platformList = ctx.connectedPlatforms.length
    ? ctx.connectedPlatforms.join(', ')
    : 'none connected';

  const recentPostSummary = ctx.recentPosts.length
    ? ctx.recentPosts.map(
        (p) => `- [${p.status}] ${p.platforms.join(',')} : "${p.content.slice(0, 80)}..."`
      ).join('\n')
    : 'No recent posts.';

  return `You are the AI Assistant for Social Command Center (SCC), a social media management platform built by HwinNwin Enterprises and Lumen Systems.

## Your Role
You are a knowledgeable, helpful assistant. You can answer general questions about anything, but you have special expertise in social media marketing, content strategy, brand building, and digital marketing. When relevant, draw on your knowledge of the user's social media activity below.

## Current User Context
- Name: ${ctx.userName || 'Unknown'}
- Connected platforms: ${platformList}
- Posts created (last 30 days): ${ctx.recentPostCount}
- Credit balance: ${ctx.creditBalance} credits
- Recent posts:
${recentPostSummary}

## App Features You Can Help With
- **Compose**: Create and publish posts to multiple platforms (Instagram, Facebook, LinkedIn, X, TikTok, YouTube)
- **Generator**: AI carousel slides, quote cards, video clips, script-to-speech, video editor
- **AI Tools**: Content enhancement, brainstorming, hooks, repurposing, platform-specific posts
- **Analytics**: View post performance and engagement metrics
- **Scheduling**: Queue posts for optimal timing

## Guidelines
1. Be concise but thorough. Match the depth of your answer to the complexity of the question.
2. When the user asks about their social media, reference their context above.
3. For content creation requests, apply professional marketing frameworks (AIDA, PAS, Hook-Value-CTA).
4. If asked to draft posts, tailor them to the user's connected platforms.
5. Be honest if you don't know something.
6. You can discuss any topic — you're a general assistant with marketing expertise.
7. Use markdown formatting in your responses for readability.
8. Keep a warm, professional tone. You are an expert colleague, not a generic chatbot.`;
}

// ─── Conversation History ───────────────────────────────

async function getConversationMessages(
  conversationId: string,
  limit: number = 50,
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { role: true, content: true },
  });

  return messages.map((m) => ({
    role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
    content: m.content,
  }));
}

// ─── Streaming Chat ─────────────────────────────────────

export async function streamChatResponse(opts: {
  conversationId: string;
  userId: string;
  userMessage: string;
  onToken: (token: string) => void;
  onDone: (fullResponse: string, inputTokens: number, outputTokens: number) => void;
  onError: (error: Error) => void;
}): Promise<void> {
  const [context, history] = await Promise.all([
    getUserChatContext(opts.userId),
    getConversationMessages(opts.conversationId),
  ]);

  const systemPrompt = buildChatSystemPrompt(context);

  // Save user message
  await prisma.chatMessage.create({
    data: {
      conversationId: opts.conversationId,
      role: 'USER',
      content: opts.userMessage,
    },
  });

  // Update conversation timestamp
  await prisma.chatConversation.update({
    where: { id: opts.conversationId },
    data: { updatedAt: new Date() },
  });

  const ai = getClient();

  const stream = ai.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      ...history,
      { role: 'user', content: opts.userMessage },
    ],
  });

  let fullResponse = '';

  stream.on('text', (text) => {
    fullResponse += text;
    opts.onToken(text);
  });

  stream.on('finalMessage', async (message) => {
    const inputTokens = message.usage.input_tokens;
    const outputTokens = message.usage.output_tokens;

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        conversationId: opts.conversationId,
        role: 'ASSISTANT',
        content: fullResponse,
      },
    });

    // Auto-generate title if this is the first exchange
    const messageCount = await prisma.chatMessage.count({
      where: { conversationId: opts.conversationId },
    });
    if (messageCount <= 2) {
      try {
        const title = await generateConversationTitle(opts.userMessage, fullResponse);
        await prisma.chatConversation.update({
          where: { id: opts.conversationId },
          data: { title },
        });
      } catch {
        // Non-critical — keep default title
      }
    }

    opts.onDone(fullResponse, inputTokens, outputTokens);
  });

  stream.on('error', (error) => {
    opts.onError(error instanceof Error ? error : new Error(String(error)));
  });

  // Wait for stream to complete
  await stream.finalMessage();
}

// ─── Title Generator ────────────────────────────────────

async function generateConversationTitle(
  userMessage: string,
  assistantResponse: string,
): Promise<string> {
  const ai = getClient();

  const message = await ai.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 30,
    messages: [
      {
        role: 'user',
        content: `Generate a very short title (3-6 words, no quotes) for this conversation:\n\nUser: ${userMessage.slice(0, 200)}\nAssistant: ${assistantResponse.slice(0, 200)}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  return text.trim().slice(0, 60) || userMessage.slice(0, 50);
}
