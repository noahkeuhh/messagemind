import { config } from '../config/index.js';

export type AIProvider = 'cohere' | 'openai' | 'claude';

export interface AIAnalysisResult {
  intent: string; // Emotie/bedoeling van het bericht
  tone: string; // Toon van het bericht
  category: string; // Type bericht
  emotional_risk: 'low' | 'medium' | 'high'; // Risico niveau
  suggested_replies: string[]; // 2-3 concrete reply-opties
  recommended_timing: 'direct' | 'later' | 'wait'; // Wanneer reageren
  tokens_used: number;
}

export interface AICallOptions {
  provider: AIProvider;
  model: string; // GPT model to use (gpt-3.5-turbo or gpt-4)
  inputText: string;
  imageUrl?: string;
  actionType: 'short_chat' | 'long_chat' | 'image_analysis';
  subscriptionTier: string; // For determining output length
  maxTokens?: number; // Optional max tokens override
  temperature?: number; // Optional temperature override
}

// Unified prompt template for all providers (using new JSON format)
function getSystemPrompt(subscriptionTier: string): string {
  const isPremium = subscriptionTier === 'plus' || subscriptionTier === 'max';
  
  return `Je bent een slimme dating coach. Analyseer dit bericht of deze foto. Geef een JSON-output met intent, tone, category, emotional_risk, suggested_replies (2–3 opties) en recommended_timing. Beperk output tot JSON, compact en gestructureerd.${isPremium ? ' Geef langere, meer gedetailleerde analyses met meer context.' : ''}`;
}

export async function callAI(options: AICallOptions): Promise<AIAnalysisResult> {
  const { provider, model, inputText, imageUrl, actionType, subscriptionTier, maxTokens, temperature } = options;

  // Check if provider is configured
  if (!isProviderConfigured(provider)) {
    console.warn(`Provider ${provider} not configured, using mock`);
    return getMockResult(inputText, subscriptionTier, actionType);
  }

  try {
    switch (provider) {
      case 'openai':
        return await callOpenAI(inputText, imageUrl, actionType, model, subscriptionTier, maxTokens, temperature);
      case 'cohere':
        return await callCohere(inputText, imageUrl, actionType, subscriptionTier, maxTokens, temperature);
      case 'claude':
        return await callClaude(inputText, imageUrl, actionType, subscriptionTier, maxTokens, temperature);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error(`AI call failed for ${provider}:`, error);
    // Fallback to mock on error
    console.warn('Falling back to mock result due to error');
    return getMockResult(inputText, subscriptionTier, actionType);
  }
}

function isProviderConfigured(provider: AIProvider): boolean {
  switch (provider) {
    case 'cohere':
      return !!config.ai.cohere.apiKey;
    case 'openai':
      return !!config.ai.openai.apiKey;
    case 'claude':
      return !!config.ai.claude.apiKey;
    default:
      return false;
  }
}

async function callCohere(
  inputText: string,
  imageUrl: string | undefined,
  actionType: string,
  subscriptionTier: string,
  maxTokens?: number,
  temperature?: number
): Promise<AIAnalysisResult> {
  const fetchFn = typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default;
  const systemPrompt = getSystemPrompt(subscriptionTier);

  // Cohere Command R API
  const response = await fetchFn(`${config.ai.cohere.baseUrl}/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.ai.cohere.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'command-r-plus',
      message: inputText || (imageUrl ? 'Analyseer deze foto' : ''),
      system_prompt: systemPrompt,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cohere API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const content = JSON.parse(data.text || '{}');

  return {
    intent: content.intent || 'Onbekend',
    tone: content.tone || 'neutraal',
    category: content.category || 'algemeen',
    emotional_risk: content.emotional_risk || 'medium',
    suggested_replies: Array.isArray(content.suggested_replies) 
      ? content.suggested_replies 
      : (content.suggested_replies ? [content.suggested_replies] : []),
    recommended_timing: content.recommended_timing || 'later',
    tokens_used: data.meta?.tokens?.total_tokens || estimateTokens(inputText),
  };
}

async function callOpenAI(
  inputText: string,
  imageUrl: string | undefined,
  actionType: string,
  model: string,
  subscriptionTier: string,
  maxTokens?: number,
  temperature?: number
): Promise<AIAnalysisResult> {
  const fetchFn = typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default;
  const systemPrompt = getSystemPrompt(subscriptionTier);

  const messages: any[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: imageUrl
        ? [
            { type: 'text', text: inputText || 'Analyseer deze foto' },
            { type: 'image_url', image_url: { url: imageUrl } },
          ]
        : inputText || 'Analyseer dit bericht',
    },
  ];

  const requestBody: any = {
    model: model, // Use provided model (gpt-3.5-turbo or gpt-4)
    messages,
    response_format: { type: 'json_object' },
    temperature: temperature ?? 0.7,
  };

  if (maxTokens) {
    requestBody.max_tokens = maxTokens;
  }

  const response = await fetchFn(`${config.ai.openai.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.ai.openai.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const content = JSON.parse(data.choices[0].message.content);

  return {
    intent: content.intent || 'Onbekend',
    tone: content.tone || 'neutraal',
    category: content.category || 'algemeen',
    emotional_risk: content.emotional_risk || 'medium',
    suggested_replies: Array.isArray(content.suggested_replies) 
      ? content.suggested_replies 
      : (content.suggested_replies ? [content.suggested_replies] : []),
    recommended_timing: content.recommended_timing || 'later',
    tokens_used: data.usage?.total_tokens || 0,
  };
}

async function callClaude(
  inputText: string,
  imageUrl: string | undefined,
  actionType: string,
  subscriptionTier: string,
  maxTokens?: number,
  temperature?: number
): Promise<AIAnalysisResult> {
  const fetchFn = typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default;
  const systemPrompt = getSystemPrompt(subscriptionTier);

  const messages: any[] = [
    {
      role: 'user',
      content: imageUrl
        ? [
            { type: 'text', text: inputText || 'Analyseer deze foto' },
            { type: 'image', source: { type: 'url', url: imageUrl } },
          ]
        : inputText || 'Analyseer dit bericht',
    },
  ];

  const response = await fetchFn(`${config.ai.claude.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': config.ai.claude.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.ai.claude.model,
      max_tokens: 4096,
      messages,
      system: systemPrompt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const contentText = data.content[0].text;
  
  // Try to parse JSON from response
  let content: any;
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = contentText.match(/```json\s*([\s\S]*?)\s*```/) || contentText.match(/```\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : contentText;
    content = JSON.parse(jsonText);
  } catch {
    // If not JSON, try to extract structured data
    content = {
      intent: extractField(contentText, 'intent'),
      tone: extractField(contentText, 'tone'),
      category: extractField(contentText, 'category'),
      emotional_risk: extractField(contentText, 'emotional_risk') || 'medium',
      suggested_replies: [],
      recommended_timing: extractField(contentText, 'recommended_timing') || 'later',
    };
  }

  return {
    intent: content.intent || 'Onbekend',
    tone: content.tone || 'neutraal',
    category: content.category || 'algemeen',
    emotional_risk: content.emotional_risk || 'medium',
    suggested_replies: Array.isArray(content.suggested_replies) 
      ? content.suggested_replies 
      : (content.suggested_replies ? [content.suggested_replies] : []),
    recommended_timing: content.recommended_timing || 'later',
    tokens_used: data.usage?.input_tokens + data.usage?.output_tokens || estimateTokens(contentText),
  };
}

function extractField(text: string, field: string): string {
  const regex = new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`, 'i');
  const match = text.match(regex);
  return match ? match[1] : '';
}

function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

function getMockResult(inputText: string, subscriptionTier: string = 'free', actionType: string = 'short_chat'): AIAnalysisResult {
  const hash = inputText.length % 4;
  const isPremium = subscriptionTier === 'plus' || subscriptionTier === 'max';
  
  // Base mock results - variëren op basis van input
  const mockResults: AIAnalysisResult[] = [
    {
      intent: 'Geïnteresseerd maar wil minder enthousiast lijken',
      tone: 'flirterig',
      category: 'afspraak voorstel',
      emotional_risk: 'low',
      suggested_replies: isPremium ? [
        'Geen misschien — laten we vrijdag om 20:00 afspreken bij [locatie]. Ik trakteer op de eerste ronde 🍷',
        'Haha, "we zien wel" is niet hoe dates worden gepland 😏 Vrijdag, jij en ik, beste cocktails in de stad?',
        'Ik heb dit weekend plannen, maar vrijdag zou kunnen. Ben je rond 20:00 vrij?',
      ] : [
        'Laten we vrijdag afspreken!',
        'Vrijdag om 20:00?',
      ],
      recommended_timing: 'later',
      tokens_used: isPremium ? 250 : 150,
    },
    {
      intent: 'Positief en enthousiast over het voorstel',
      tone: 'enthousiast',
      category: 'bevestiging',
      emotional_risk: 'low',
      suggested_replies: isPremium ? [
        'Perfect! Ik zie er naar uit 😊 Waar wil je afspreken?',
        'Ja, dat klinkt goed! Ik ben vrijdag beschikbaar.',
        'Leuk! Laten we het concreet maken. Wat vind je van [locatie]?',
      ] : [
        'Ja, dat klinkt goed!',
        'Perfect!',
      ],
      recommended_timing: 'direct',
      tokens_used: isPremium ? 220 : 120,
    },
    {
      intent: 'Neutraal, wacht op meer informatie',
      tone: 'neutraal',
      category: 'vraag',
      emotional_risk: 'medium',
      suggested_replies: isPremium ? [
        'Oké, wat wil je doen?',
        'Hmm, dat is niet veel info 😄 Vertel me meer!',
        'Laten we iets specifieks plannen. Wat spreekt je aan?',
      ] : [
        'Wat wil je doen?',
        'Vertel me meer!',
      ],
      recommended_timing: 'direct',
      tokens_used: isPremium ? 200 : 120,
    },
    {
      intent: 'Mogelijk niet geïnteresseerd of afstandelijk',
      tone: 'afstandelijk',
      category: 'kort antwoord',
      emotional_risk: 'high',
      suggested_replies: isPremium ? [
        'Ik heb het gevoel dat je niet echt geïnteresseerd bent? Geen probleem als dat zo is.',
        'Oké, ik zie dat je niet super enthousiast bent. Moeten we het gewoon laten?',
        'Het lijkt erop dat de vibe niet helemaal klopt. Geen zorgen, veel succes met alles!',
      ] : [
        'Lijkt alsof je niet geïnteresseerd bent?',
        'Geen probleem als dat zo is.',
      ],
      recommended_timing: 'wait',
      tokens_used: isPremium ? 230 : 130,
    },
  ];
  
  const result = mockResults[hash];
  
  // Adjust tokens based on action type
  if (actionType === 'long_chat') {
    result.tokens_used = Math.floor(result.tokens_used * 1.5);
  } else if (actionType === 'image_analysis') {
    result.tokens_used = Math.floor(result.tokens_used * 2);
  }
  
  return result;
}


