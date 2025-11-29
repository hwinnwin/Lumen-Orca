async function fetchWithRetry(url: string, options: any, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Only retry on 5xx server errors or network issues
      if (response.ok || response.status < 500) {
        return response;
      }
      
      lastError = new Error(`Server error: ${response.status}`);
      console.log(`[Lovable AI] Attempt ${attempt}/${maxRetries} failed with ${response.status}, retrying...`);
      
    } catch (error) {
      lastError = error;
      console.log(`[Lovable AI] Attempt ${attempt}/${maxRetries} failed:`, error);
    }
    
    // Exponential backoff: 1s, 2s, 4s
    if (attempt < maxRetries) {
      const delayMs = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError;
}

export async function callLovableAI(config: any, messages: any[]) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  const response = await fetchWithRetry(
    'https://ai.gateway.lovable.dev/v1/chat/completions',
    {
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
    },
    3 // 3 retry attempts
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) {
      throw new Error('Rate limit exceeded - please try again later');
    }
    if (response.status === 402) {
      throw new Error('Payment required - please add credits to Lovable AI');
    }
    if (response.status === 503) {
      throw new Error('Lovable AI service temporarily unavailable - using fallback provider');
    }
    throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}
