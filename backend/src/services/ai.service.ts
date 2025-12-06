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
  // Check if AI is configured
  if (!config.ai.serviceKey || config.app.nodeEnv === 'development') {
    return getMockAnalysisResult(inputText);
  }

  try {
    // OpenAI API call
    if (config.ai.serviceUrl.includes('openai.com')) {
      return await analyzeWithOpenAI(inputText, imageUrl);
    }

    // Add other AI providers here (Claude, etc.)
    return getMockAnalysisResult(inputText);
  } catch (error) {
    console.error('AI analysis error:', error);
    // Fallback to mock on error
    return getMockAnalysisResult(inputText);
  }
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

function getMockAnalysisResult(inputText: string): AIAnalysisResult {
  // Generate deterministic mock based on input
  const hash = inputText.length % 3;
  
  const mockResults: AIAnalysisResult[] = [
    {
      intent: 'Geïnteresseerd, maar wil niet te eager overkomen',
      intentLabel: 'positive',
      toneScore: 78,
      interestLevel: 72,
      flags: ['Test vraag', 'Wil initiatief van jou'],
      suggested_replies: [
        {
          type: 'Direct',
          text: 'Geen misschien — laten we vrijdag om 8 uur afspreken bij [locatie]. Ik trakteer op de eerste ronde 🍷',
        },
        {
          type: 'Speels',
          text: 'Haha, "we zien wel" is niet hoe dates gepland worden 😏 Vrijdag, jij en ik, beste cocktails van de stad?',
        },
        {
          type: 'Confident',
          text: 'Ik heb dit weekend al wat gepland, maar vrijdag zou kunnen werken. Ben je rond 8 uur vrij?',
        },
      ],
      recommended_timing: 'Wacht 2-4 uur voor je reageert. Laat zien dat je niet direct beschikbaar bent.',
      tokens_used: 150,
    },
    {
      intent: 'Neutraal, wachtend op meer informatie',
      intentLabel: 'neutral',
      toneScore: 55,
      interestLevel: 45,
      flags: ['Kort antwoord', 'Geen emotie'],
      suggested_replies: [
        {
          type: 'Direct',
          text: 'Oké, wat wil je dan doen?',
        },
        {
          type: 'Speels',
          text: 'Hmm, dat is niet veel info 😄 Vertel me meer!',
        },
        {
          type: 'Confident',
          text: 'Laten we iets specifieks plannen. Wat spreekt je aan?',
        },
      ],
      recommended_timing: 'Reageer binnen 1-2 uur om momentum te behouden.',
      tokens_used: 120,
    },
    {
      intent: 'Mogelijk niet geïnteresseerd of afstandelijk',
      intentLabel: 'negative',
      toneScore: 35,
      interestLevel: 30,
      flags: ['Kort antwoord', 'Geen engagement', 'Mogelijk ghosting'],
      suggested_replies: [
        {
          type: 'Direct',
          text: 'Voel ik dat je niet echt geïnteresseerd bent? Geen probleem als dat zo is.',
        },
        {
          type: 'Speels',
          text: 'Oké, ik zie dat je niet super enthousiast bent. Zullen we het gewoon laten?',
        },
        {
          type: 'Confident',
          text: 'Lijkt alsof de vibe niet helemaal klopt. Geen zorgen, succes met alles!',
        },
      ],
      recommended_timing: 'Wacht 4-6 uur. Als ze niet reageert, laat het gaan.',
      tokens_used: 130,
    },
  ];

  return mockResults[hash];
}

