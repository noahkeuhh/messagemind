import { config } from '../config/index.js';

export interface AIAnalysisResult {
  intent: string;
  intentLabel: 'positive' | 'neutral' | 'negative';
  toneScore: number;
  interestLevel: number;
  flags: string[];
  suggested_replies: Array<{
    type: string;
    text: string;
  }>;
  recommended_timing: string;
  tokens_used: number;
}

export async function analyzeText(
  inputText: string,
  imageUrl?: string,
  userId?: string,
  subscriptionTier?: string
): Promise<AIAnalysisResult> {
  // Mock mode removed - all requests must use real AI providers
  // This function is deprecated and should not be used
  throw new Error('analyzeText is deprecated. Use callAI from ai-providers.service instead.');
}

async function analyzeWithOpenAI(
  inputText: string,
  imageUrl?: string
): Promise<AIAnalysisResult> {
  // Use native fetch (Node 18+) or node-fetch for older versions
  const fetchFn = typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default;
  
  const messages: any[] = [
    {
      role: 'system',
      content: `Je bent een expert in dating en relatie-advies. Analyseer het bericht en geef:
1. Intent (wat bedoelt ze echt?)
2. Tone score (0-100)
3. Interest level (0-100)
4. Flags (rode vlaggen of belangrijke signalen)
5. 3 suggested replies (Direct, Speels, Confident)
6. Recommended timing
7. Escalation advice

Antwoord in JSON formaat.`,
    },
    {
      role: 'user',
      content: inputText,
    },
  ];

  if (imageUrl) {
    messages[1].content = [
      { type: 'text', text: inputText },
      { type: 'image_url', image_url: { url: imageUrl } },
    ];
  }

  const response = await fetchFn(`${config.ai.serviceUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.ai.serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.ai.model,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = JSON.parse(data.choices[0].message.content);

  return {
    intent: content.intent || 'Onbekend',
    intentLabel: content.intentLabel || 'neutral',
    toneScore: content.toneScore || 50,
    interestLevel: content.interestLevel || 50,
    flags: content.flags || [],
    suggested_replies: content.suggested_replies || [],
    recommended_timing: content.recommended_timing || 'Wacht 2-4 uur',
    tokens_used: data.usage?.total_tokens || 0,
  };
}

// Mock function removed - no longer used. All requests must use real AI providers.
// REMOVED: Mock data is not allowed in production

