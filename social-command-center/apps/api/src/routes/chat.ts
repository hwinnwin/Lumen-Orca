import { Router } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../db/client.js';
import { streamChatResponse } from '../services/chat.js';
import { checkCredits, deductCredits, CREDIT_COSTS } from '../services/credits.js';

export const chatRouter = Router();

// List conversations
chatRouter.get('/conversations', async (req, res) => {
  try {
    const conversations = await prisma.chatConversation.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
    res.json({ data: conversations });
  } catch (error) {
    console.error('[Chat] Failed to list conversations:', error);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

// Create conversation
chatRouter.post('/conversations', async (req, res) => {
  try {
    const conversation = await prisma.chatConversation.create({
      data: { userId: req.userId },
    });
    res.json({ data: conversation });
  } catch (error) {
    console.error('[Chat] Failed to create conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get messages for a conversation
chatRouter.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.chatConversation.findFirst({
      where: { id, userId: req.userId },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    res.json({ data: messages });
  } catch (error) {
    console.error('[Chat] Failed to load messages:', error);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// Delete conversation
chatRouter.delete('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.chatConversation.findFirst({
      where: { id, userId: req.userId },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    await prisma.chatConversation.delete({ where: { id } });
    res.json({ data: { deleted: true } });
  } catch (error) {
    console.error('[Chat] Failed to delete conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Send message + stream SSE response
chatRouter.post('/conversations/:id/messages', async (req, res) => {
  if (!env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'AI is not configured.' });
  }

  const { id } = req.params;
  const { content } = req.body as { content: string };

  if (!content?.trim()) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  // Verify ownership
  const conversation = await prisma.chatConversation.findFirst({
    where: { id, userId: req.userId },
  });
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

  // Credit check
  const cost = CREDIT_COSTS.AI_CHAT;
  const cc = await checkCredits(req.userId, cost);
  if (!cc.allowed) {
    return res.status(402).json({
      error: `Insufficient credits. Need ${cost}, have ${cc.balance}.`,
      code: 'INSUFFICIENT_CREDITS',
      required: cost,
      balance: cc.balance,
    });
  }

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  let aborted = false;
  req.on('close', () => { aborted = true; });

  try {
    await streamChatResponse({
      conversationId: id,
      userId: req.userId,
      userMessage: content.trim(),
      onToken: (token) => {
        if (!aborted) {
          res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
        }
      },
      onDone: async (fullResponse, inputTokens, outputTokens) => {
        await deductCredits(req.userId, cost, 'ai-chat', 'AI chat message');

        if (!aborted) {
          // Send the conversation title back so frontend can update
          const conv = await prisma.chatConversation.findUnique({
            where: { id },
            select: { title: true },
          });
          res.write(`data: ${JSON.stringify({ type: 'done', inputTokens, outputTokens, title: conv?.title })}\n\n`);
          res.end();
        }
      },
      onError: (error) => {
        console.error('[Chat] Stream error:', error);
        if (!aborted) {
          res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
          res.end();
        }
      },
    });
  } catch (error) {
    console.error('[Chat] Stream failed:', error);
    if (!aborted) {
      const errMsg = error instanceof Error ? error.message : 'Stream failed';
      res.write(`data: ${JSON.stringify({ type: 'error', error: errMsg })}\n\n`);
      res.end();
    }
  }
});
