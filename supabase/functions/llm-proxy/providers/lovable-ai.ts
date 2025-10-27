export async function callLovableAI(config: any, messages: any[]) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.max_tokens || 4096,
      temperature: config.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) {
      throw new Error('Rate limit exceeded - please try again later');
    }
    if (response.status === 402) {
      throw new Error('Payment required - please add credits to Lovable AI');
    }
    throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}
