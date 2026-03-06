import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';
import { prisma } from '../db/client.js';
import { CHAT_TOOLS, TOOL_ACTION_LABELS, executeTool } from './chat-tools.js';

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

## Tool Use Capabilities
You have tools to take actions within the app. You can:
- **Create and publish posts** to connected platforms
- **Check which platforms** are connected
- **View recent posts** the user has created

### Guidelines for tool use:
1. Before creating a post, verify the user's requested platform is connected (you can see this in the context above, or use list_connected_platforms).
2. By default, create posts as DRAFT and show the user the content first, asking if they'd like to publish. Only use IMMEDIATE if the user explicitly says "publish now", "post it", "just do it", "go ahead and publish", etc.
3. When creating a post, always show the user what content will be posted and to which platforms.
4. If the user says "turn this into a post" or similar, use the conversation context to craft appropriate, engaging post content.
5. If a requested platform is not connected, inform the user and suggest they connect it in Settings.

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

// ─── Streaming Chat (with tool-use loop) ────────────────

const MAX_TOOL_ROUNDS = 5;

export async function streamChatResponse(opts: {
  conversationId: string;
  userId: string;
  userMessage: string;
  onToken: (token: string) => void;
  onToolAction: (toolName: string, status: string) => void;
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

  // Build the messages array — will grow as we add tool results
  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: 'user', content: opts.userMessage },
  ];

  let fullResponse = '';
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    // Tool-use loop: Claude may call tools, we execute and feed results back
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const stream = ai.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages,
        tools: CHAT_TOOLS,
      });

      // Collect text tokens for streaming to the client
      let roundText = '';
      stream.on('text', (text) => {
        roundText += text;
        fullResponse += text;
        opts.onToken(text);
      });

      const finalMessage = await stream.finalMessage();
      totalInputTokens += finalMessage.usage.input_tokens;
      totalOutputTokens += finalMessage.usage.output_tokens;

      // Check if Claude wants to use tools
      if (finalMessage.stop_reason === 'tool_use') {
        // Extract tool_use blocks from the response
        const toolUseBlocks = finalMessage.content.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
        );

        if (toolUseBlocks.length === 0) break; // Safety: shouldn't happen

        // Add Claude's response (with tool_use blocks) to messages
        messages.push({ role: 'assistant', content: finalMessage.content });

        // Execute each tool and build tool_result messages
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          const label = TOOL_ACTION_LABELS[toolUse.name] || `Running ${toolUse.name}...`;
          opts.onToolAction(toolUse.name, label);

          try {
            const result = await executeTool(
              toolUse.name,
              toolUse.input as Record<string, unknown>,
              opts.userId,
            );
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: result,
            });
          } catch (err) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify({
                error: err instanceof Error ? err.message : 'Tool execution failed',
              }),
              is_error: true,
            });
          }
        }

        // Add tool results as a user message (Anthropic convention)
        messages.push({ role: 'user', content: toolResults });

        // Clear tool action indicator — Claude will respond next
        opts.onToolAction('', '');

        // Continue the loop — Claude will generate a text response based on tool results
        continue;
      }

      // Normal end_turn — we're done
      break;
    }

    // Save the final assistant text response to DB
    if (fullResponse.trim()) {
      await prisma.chatMessage.create({
        data: {
          conversationId: opts.conversationId,
          role: 'ASSISTANT',
          content: fullResponse,
        },
      });
    }

    // Auto-generate title if this is the first exchange
    const messageCount = await prisma.chatMessage.count({
      where: { conversationId: opts.conversationId },
    });
    if (messageCount <= 2 && fullResponse.trim()) {
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

    opts.onDone(fullResponse, totalInputTokens, totalOutputTokens);
  } catch (error) {
    opts.onError(error instanceof Error ? error : new Error(String(error)));
  }
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
