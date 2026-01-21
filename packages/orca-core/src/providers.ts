/**
 * Anthropic Claude LLM Provider
 *
 * Connects the autonomous executor to Claude for real reasoning.
 */

import { LLMProvider } from './executor.js';

export interface AnthropicConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

export class AnthropicProvider implements LLMProvider {
  private apiKey: string;
  private model: string;
  private maxTokens: number;

  constructor(config: AnthropicConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'claude-sonnet-4-20250514';
    this.maxTokens = config.maxTokens || 4096;
  }

  async complete(prompt: string, context?: string): Promise<string> {
    const systemPrompt = context ||
      'You are an expert software engineer. Be precise, concise, and production-ready.';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text?: string }>;
    };

    // Extract text from content blocks
    const textContent = data.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text || '')
      .join('');

    return textContent;
  }
}

/**
 * OpenAI Provider (alternative)
 */
export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private model: string;
  private maxTokens: number;

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4o';
    this.maxTokens = config.maxTokens || 4096;
  }

  async complete(prompt: string, context?: string): Promise<string> {
    const systemPrompt = context ||
      'You are an expert software engineer. Be precise, concise, and production-ready.';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0].message.content;
  }
}

/**
 * Mock provider for testing without API calls
 */
export class MockProvider implements LLMProvider {
  private responses: Map<string, string> = new Map();

  setResponse(promptContains: string, response: string): void {
    this.responses.set(promptContains, response);
  }

  async complete(prompt: string): Promise<string> {
    // Find matching response
    for (const [key, value] of this.responses) {
      if (prompt.includes(key)) {
        return value;
      }
    }

    // Default mock responses based on prompt content
    // Order matters! More specific checks first

    // Check for test generation FIRST (prompt contains spec which has FEATURES)
    if (prompt.includes('Generate comprehensive tests') || prompt.includes('Use Vitest syntax')) {
      return [
        "import { describe, it, expect } from 'vitest';",
        "import { validateEmail } from './email-validator';",
        "",
        "describe('validateEmail', () => {",
        "  it('validates correct email format', () => {",
        "    expect(validateEmail('test@example.com').valid).toBe(true);",
        "  });",
        "",
        "  it('rejects empty string', () => {",
        "    const result = validateEmail('');",
        "    expect(result.valid).toBe(false);",
        "    expect(result.error).toBe('Email cannot be empty');",
        "  });",
        "",
        "  it('rejects missing @', () => {",
        "    expect(validateEmail('testexample.com').valid).toBe(false);",
        "  });",
        "",
        "  it('rejects missing domain', () => {",
        "    expect(validateEmail('test@').valid).toBe(false);",
        "  });",
        "",
        "  it('accepts valid emails with subdomains', () => {",
        "    expect(validateEmail('test@mail.example.com').valid).toBe(true);",
        "  });",
        "",
        "  it('handles whitespace', () => {",
        "    expect(validateEmail('  test@example.com  ').valid).toBe(true);",
        "  });",
        "});",
      ].join('\n');
    }

    // Check for architect prompt (it contains spec content which has FEATURES)
    if (prompt.includes('software architect') || prompt.includes('Design the system architecture')) {
      return [
        'COMPONENTS:',
        '- name: email-validator',
        '  description: Core email validation logic',
        '  dependencies: none',
        '',
        'BUILD_ORDER:',
        '1. email-validator',
        '',
        'DATA_MODELS:',
        '```typescript',
        'interface ValidationResult {',
        '  valid: boolean;',
        '  error?: string;',
        '}',
        '```',
        '',
        'INTERFACES:',
        '```typescript',
        'interface EmailValidator {',
        '  validate(email: string): ValidationResult;',
        '}',
        '```',
      ].join('\n');
    }

    if (prompt.includes('FEATURES:') || prompt.includes('Extract')) {
      return [
        'FEATURES:',
        '- validateEmail function that checks email format',
        '- Return valid boolean and optional error message',
        '- Handle empty and invalid inputs',
        '',
        'CONSTRAINTS:',
        '- TypeScript with proper types',
        '- Export ValidationResult interface',
        '',
        'SCALE: small',
        '',
        'UNKNOWNS:',
        '- None identified',
      ].join('\n');
    }

    if (prompt.includes('Generate the complete') || prompt.includes('generating code') || prompt.includes('Component:')) {
      return `/**
 * Email Validator
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;

export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  if (typeof email !== 'string') {
    return { valid: false, error: 'Email must be a string' };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Email cannot be empty' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}`;
    }

    if (prompt.includes('Fix ALL the issues')) {
      return prompt.split('The following code has verification issues:')[1]?.split('Issues found:')[0] || '';
    }

    return 'Mock response - prompt not recognized';
  }
}
