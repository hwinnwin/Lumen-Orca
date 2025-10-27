export async function callAnthropic(config: any, messages: any[]) {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');

  const systemMessage = messages.find((m: any) => m.role === 'system');
  const userMessages = messages.filter((m: any) => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.max_tokens || 4096,
      temperature: config.temperature || 0.7,
      system: systemMessage?.content || '',
      messages: userMessages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Normalize response to match OpenAI format
  return {
    choices: [{ 
      message: { 
        content: data.content[0].text 
      } 
    }],
    usage: { 
      prompt_tokens: data.usage.input_tokens, 
      completion_tokens: data.usage.output_tokens 
    }
  };
}
