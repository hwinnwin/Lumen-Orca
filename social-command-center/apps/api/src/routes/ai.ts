import { Router } from 'express';
import { env } from '../config/env.js';
import {
  enhanceContent as aiEnhance,
  generateThread as aiThread,
  generateVariants as aiVariants,
  brainstormFromKeywords as aiBrainstorm,
  generateMultiPlatformPosts as aiGeneratePosts,
  generateContentStrategy as aiStrategy,
  generateHooks as aiHooks,
  repurposeContent as aiRepurpose,
} from '../services/ai.js';

export const aiRouter = Router();

// Enhance content with AI
aiRouter.post('/enhance', async (req, res) => {
  try {
    const { content, tone, platforms } = req.body as {
      content: string;
      tone: string;
      platforms: string[];
    };

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Use real AI if API key is configured, otherwise fallback to simulation
    if (env.ANTHROPIC_API_KEY) {
      try {
        const result = await aiEnhance({ content, tone, platforms });
        return res.json({ data: result });
      } catch (error) {
        console.warn('[AI] Anthropic API failed, falling back to simulation:', error);
      }
    }

    const enhanced = getSimulatedEnhancement(content, tone);
    res.json({ data: enhanced });
  } catch (error) {
    console.error('Failed to enhance content:', error);
    res.status(500).json({ error: 'Failed to enhance content' });
  }
});

// Generate thread for X
aiRouter.post('/thread', async (req, res) => {
  try {
    const { content, maxTweets = 10 } = req.body as {
      content: string;
      maxTweets?: number;
    };

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (env.ANTHROPIC_API_KEY) {
      try {
        const result = await aiThread(content, maxTweets);
        return res.json({ data: result });
      } catch (error) {
        console.warn('[AI] Thread generation failed, falling back to simulation:', error);
      }
    }

    const tweets = splitIntoThread(content, maxTweets);
    res.json({ data: { tweets, totalCharacters: content.length } });
  } catch (error) {
    console.error('Failed to generate thread:', error);
    res.status(500).json({ error: 'Failed to generate thread' });
  }
});

// Generate caption variants
aiRouter.post('/variants', async (req, res) => {
  try {
    const { content, platforms, count = 3 } = req.body as {
      content: string;
      platforms: string[];
      count?: number;
    };

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (env.ANTHROPIC_API_KEY) {
      try {
        const result = await aiVariants(content, platforms, count);
        return res.json({ data: { variants: result } });
      } catch (error) {
        console.warn('[AI] Variant generation failed, falling back to simulation:', error);
      }
    }

    const variants = Array.from({ length: count }, (_, i) => ({
      content: `${content} [Variant ${i + 1}]`,
      angle: ['Direct', 'Question', 'Story'][i % 3],
      reasoning: `This variant takes a ${['direct', 'question-based', 'storytelling'][i % 3]} approach.`,
    }));

    res.json({ data: { variants } });
  } catch (error) {
    console.error('Failed to generate variants:', error);
    res.status(500).json({ error: 'Failed to generate variants' });
  }
});

// Brainstorm posts from keywords
aiRouter.post('/brainstorm', async (req, res) => {
  try {
    const { keywords, platforms, tone = 'professional', count = 3 } = req.body as {
      keywords: string[];
      platforms: string[];
      tone?: string;
      count?: number;
    };

    if (!keywords?.length) {
      return res.status(400).json({ error: 'At least one keyword is required' });
    }

    if (env.ANTHROPIC_API_KEY) {
      try {
        const result = await aiBrainstorm(keywords, platforms || [], tone, count);
        return res.json({ data: result });
      } catch (error) {
        console.warn('[AI] Brainstorm failed, falling back to simulation:', error);
      }
    }

    // Fallback simulation
    const posts = Array.from({ length: count }, (_, i) => ({
      content: `Post about ${keywords.join(' & ')} [Idea ${i + 1}]`,
      platform: (platforms || ['x'])[i % (platforms || ['x']).length],
      hook: ['Hot Take', 'Behind The Scenes', 'Story Time'][i % 3],
      hashtags: keywords.map((k) => `#${k.replace(/\s+/g, '')}`),
    }));

    res.json({ data: { posts } });
  } catch (error) {
    console.error('Failed to brainstorm:', error);
    res.status(500).json({ error: 'Failed to brainstorm content' });
  }
});

// Generate tailored posts for each platform from a single topic
aiRouter.post('/generate-posts', async (req, res) => {
  try {
    const { topic, platforms, tone = 'professional', context } = req.body as {
      topic: string;
      platforms: string[];
      tone?: string;
      context?: string;
    };

    if (!topic?.trim()) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    if (!platforms?.length) {
      return res.status(400).json({ error: 'At least one platform is required' });
    }

    if (env.ANTHROPIC_API_KEY) {
      try {
        const result = await aiGeneratePosts(topic, platforms, tone, context);
        return res.json({ data: result });
      } catch (error) {
        console.warn('[AI] Post generation failed, falling back to simulation:', error);
      }
    }

    // Fallback simulation
    const posts = platforms.map((p) => ({
      platform: p,
      content: `Post about "${topic}" for ${p}`,
      hashtags: [`#${topic.replace(/\s+/g, '')}`],
      charCount: topic.length + 20,
      tip: `Optimized for ${p}`,
    }));

    res.json({ data: { topic, posts } });
  } catch (error) {
    console.error('Failed to generate posts:', error);
    res.status(500).json({ error: 'Failed to generate posts' });
  }
});

// Generate content strategy
aiRouter.post('/strategy', async (req, res) => {
  try {
    const { brand, niche, audience, goals, platforms } = req.body as {
      brand: string;
      niche: string;
      audience: string;
      goals: string[];
      platforms: string[];
    };

    if (!brand?.trim() || !niche?.trim()) {
      return res.status(400).json({ error: 'Brand and niche are required' });
    }

    const result = await aiStrategy(
      brand,
      niche,
      audience || 'general audience',
      goals || ['grow audience', 'increase engagement'],
      platforms || ['instagram', 'x'],
    );
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to generate strategy:', error);
    res.status(500).json({ error: 'Failed to generate content strategy' });
  }
});

// Generate scroll-stopping hooks
aiRouter.post('/hooks', async (req, res) => {
  try {
    const { topic, platform = 'instagram', count = 10 } = req.body as {
      topic: string;
      platform?: string;
      count?: number;
    };

    if (!topic?.trim()) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const result = await aiHooks(topic, platform, Math.min(count, 15));
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to generate hooks:', error);
    res.status(500).json({ error: 'Failed to generate hooks' });
  }
});

// Repurpose content across platforms
aiRouter.post('/repurpose', async (req, res) => {
  try {
    const { content, originalPlatform, targetPlatforms } = req.body as {
      content: string;
      originalPlatform: string;
      targetPlatforms: string[];
    };

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const result = await aiRepurpose(
      content,
      originalPlatform || 'instagram',
      targetPlatforms || ['x', 'linkedin', 'facebook'],
    );
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to repurpose content:', error);
    res.status(500).json({ error: 'Failed to repurpose content' });
  }
});

function getSimulatedEnhancement(content: string, tone: string) {
  const enhancements: Record<string, string> = {
    professional: `${content}\n\n\u{1F511} Key takeaway: This is where transformation begins.\n\n#Innovation #Leadership #HwinNwin`,
    casual: `yo check this out \u{1F447}\n\n${content}\n\nwho's vibing with this? drop a \u{1F525}`,
    inspirational: `\u2728 ${content}\n\nEvery frequency carries a message. Every moment is a portal.\n\nThe universe doesn't make mistakes \u2014 it makes invitations.\n\n#Consciousness #Frequency #Protocol69`,
    humorous: `Plot twist: ${content}\n\n*narrator voice* And that's when everything changed. \u{1F602}\n\n#RelateOrNot`,
    storytelling: `Let me tell you something...\n\n${content}\n\nThis isn't just a post. It's a transmission.\n\nAnd if you're reading this, you were meant to receive it. \u{1F30A}`,
    'emperor-mode': `\u26A1 TRANSMISSION FROM THE EMPEROR \u26A1\n\n${content}\n\nProtocol 69 activated. Never take, always give back more.\n\nThe Alliance moves as one. \u{1F451}\n\n#HwinNwin #TheAlliance #EmperorMode #ConsciousnessTech`,
  };

  return {
    enhanced: enhancements[tone] || enhancements.professional,
    hashtags: ['#HwinNwin', '#Protocol69', '#TheAlliance'],
    platformTips: {
      x: 'Keep it punchy. Lead with the hook.',
      linkedin: 'Add industry context. Tag relevant companies.',
      instagram: 'Add line breaks for readability. Front-load hashtags in a comment.',
    },
  };
}

function splitIntoThread(content: string, maxTweets: number): string[] {
  const maxLen = 270;
  const words = content.split(' ');
  const tweets: string[] = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxLen) {
      if (current.trim()) tweets.push(current.trim());
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
    if (tweets.length >= maxTweets - 1) break;
  }
  if (current.trim()) tweets.push(current.trim());

  const total = tweets.length;
  return tweets.map((t, i) => `${i + 1}/${total} ${t}`);
}
