import { config } from '../config/index.js';
import Groq from 'groq-sdk';

export type AIProvider = 'groq'; // Only Groq supported now

export interface AIAnalysisResult {
  intent: string;
  tone: string;
  category: string;
  emotional_risk: 'low' | 'medium' | 'high';
  suggested_replies: string[] | Record<string, string>;
  recommended_timing: 'direct' | 'later' | 'wait';
  tokens_used: number;
  interest_level: string; // Always present - percentage string like "65%"
  explanation?: string | {
    meaning_breakdown?: string;
    emotional_context?: string;
    relationship_signals?: string;
    hidden_patterns?: string;
  };
  conversation_flow?: Array<Record<string, string>>;
  escalation_advice?: string;
  risk_mitigation?: string;
  [key: string]: any;
}

export interface AICallOptions {
  provider: AIProvider;
  model: string;
  inputText: string;
  imageUrl?: string;
  actionType: 'short_chat' | 'long_chat' | 'image_analysis';
  subscriptionTier: string;
  mode?: 'snapshot' | 'expanded' | 'deep';
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

function getSystemPrompt(subscriptionTier: string, mode?: string): string {
  const isDeepMode = mode === 'deep';
  const isPremium = subscriptionTier === 'plus' || subscriptionTier === 'max';
  
  if (isDeepMode) {
    return `Je bent een expert dating coach en psycholoog. Voer een DIEPE analyse uit van dit bericht.

ANTWOORD ALTIJD IN DEZE JSON-INDELING (minimaal alle velden):
{
  "intent": "wat wil deze persoon bereiken",
  "tone": "formeel/playful/suggestief/etc",
  "category": "conversatieonderwerp",
  "emotional_risk": "low/medium/high",
  "recommended_timing": "direct/later/wait",
  "explanation": {
    "meaning_breakdown": "wat zegt het bericht letterlijk en impliciet",
    "emotional_context": "welke emoties zitten eronder",
    "relationship_signals": "wat zegt het over interesse en boundary",
    "hidden_patterns": "subtiele hints of psychologische triggers"
  },
  "suggested_replies": {
    "playful": "luchtig en speels antwoord",
    "confident": "zelfverzekerd en dominant",
    "safe": "voorzichtig en neutraal",
    "bold": "dapper en direkt",
    "escalation": "intensiveer de conversatie"
  },
  "conversation_flow": [
    {"you": "wat je zou kunnen zeggen"},
    {"them_reaction": "hun waarschijnlijke reactie"},
    {"you_next": "jouw vervolgstap"}
  ],
  "escalation_advice": "hoe je dit naar het volgende niveau brengt",
  "risk_mitigation": "wat je moet voorzien",
  "interest_level": "geschat interesse percentage bijv 75%"
}`;
  }
  
  return `Je bent een slimme dating coach. Analyseer dit bericht of deze foto. Geef een JSON-output met intent, tone, category, emotional_risk, suggested_replies (2–3 opties) en recommended_timing. Beperk output tot JSON, compact en gestructureerd.${isPremium ? ' Geef langere, meer gedetailleerde analyses met meer context.' : ''}`;
}

export async function callAI(options: AICallOptions): Promise<AIAnalysisResult> {
  const { provider, model, inputText, imageUrl, actionType, subscriptionTier, mode, maxTokens, temperature, systemPrompt } = options;

  if (!isProviderConfigured(provider)) {
    console.error(`[AI] Provider ${provider} not configured.`);
    throw new Error(`AI provider ${provider} is not configured. Please set the required API key in environment variables.`);
  }

  try {
    console.log(`[AI] LIVE AI CALL - Calling ${provider} with model ${model} for ${actionType} (mode: ${mode || 'snapshot'})`);
    
    // Only Groq is supported
    if (provider !== 'groq') {
      throw new Error(`Provider ${provider} is no longer supported. Only Groq (llama-3.3-70b-versatile) is available.`);
    }
    
    const result = await callGroq(inputText, imageUrl, actionType, model, subscriptionTier, mode, maxTokens, temperature, systemPrompt);
    console.log(`[AI] Successfully received response from ${provider}, tokens used: ${result.tokens_used}`);
    return result;
  } catch (error) {
    console.error(`[AI] Call failed for ${provider}:`, error);
    throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function isProviderConfigured(provider: AIProvider): boolean {
  if (provider === 'groq') {
    return !!config.ai.groq.apiKey;
  }
  return false;
}

/**
 * Call Groq API with llama-3.3-70b-versatile (for all modes)
 */
async function callGroq(
  inputText: string,
  imageUrl: string | undefined,
  actionType: string,
  model: string,
  subscriptionTier: string,
  mode?: string,
  maxTokens?: number,
  temperature?: number,
  systemPromptOverride?: string
): Promise<AIAnalysisResult> {
  if (!config.ai.groq.apiKey) {
    const errorMsg = 'Groq API key is not configured. Please set GROQ_API_KEY environment variable.';
    console.error(`[AI] ${errorMsg}`);
    throw new Error(errorMsg);
  }
  
  const systemPrompt = systemPromptOverride || getSystemPrompt(subscriptionTier, mode);
  
  // For Groq (text-only model), truncate base64 images to prevent token overflow
  // Instead of sending the full base64, send a placeholder and basic description
  let userPrompt: string;
  if (imageUrl) {
    // Groq cannot handle images - only analyze the text context
    const imageType = imageUrl.match(/^data:image\/(\w+)/)?.[1] || 'unknown';
    userPrompt = `${inputText || 'Analyseer deze flirt-foto of screenshot'}\n\n[Image type: ${imageType}. This is a dating/flirting photo or chat screenshot. Provide a typical dating coach analysis based on common patterns in flirting contexts.]`;
    console.log(`[AI] Image detected but Groq cannot process images directly - analyzing context only`);
  } else {
    userPrompt = inputText || 'Analyseer dit bericht';
  }

  const groqModel = model || 'llama-3.3-70b-versatile';
  
  console.log(`[AI] Calling Groq ${groqModel}, input length: ${inputText?.length || 0}`);
  
  const startTime = Date.now();
  
  try {
    const client = new Groq({ apiKey: config.ai.groq.apiKey });
    
    const jsonSystemPrompt = `${systemPrompt}\n\nIMPORTANT: You MUST respond with valid JSON only. Do not include any text before or after the JSON.`;
    
    const response = await client.chat.completions.create({
      model: groqModel,
      messages: [
        { role: 'system', content: jsonSystemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens || 2048,
      temperature: temperature ?? 0.2,
    });
    
    const duration = Date.now() - startTime;
    console.log(`[AI] Groq API response received in ${duration}ms`);
    
    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      console.error(`[AI] Empty response content from Groq`);
      throw new Error('Empty response from Groq API');
    }
    
    let cleanedContent = responseContent.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Fix common JSON parsing issues
    cleanedContent = cleanedContent
      .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
      .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
      .replace(/([{,]\s*["\w]+:\s*)"([^"]*(?:\\.[^"]*)*)(?<!\\)"/g, '$1"$2"') // Fix unterminated strings
      .trim();
    
    // Try to fix unterminated JSON by finding the last valid closing brace
    if (!cleanedContent.endsWith('}') && !cleanedContent.endsWith(']')) {
      const lastBrace = cleanedContent.lastIndexOf('}');
      const lastBracket = cleanedContent.lastIndexOf(']');
      const lastValidIndex = Math.max(lastBrace, lastBracket);
      if (lastValidIndex > 0) {
        cleanedContent = cleanedContent.substring(0, lastValidIndex + 1);
      }
    }
    
    let content: any;
    try {
      content = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error(`[AI] Failed to parse Groq JSON response:`, {
        rawContent: responseContent.substring(0, 500),
        cleanedContent: cleanedContent.substring(0, 500),
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      
      // Fallback: return minimal valid response instead of throwing
      console.warn(`[AI] Using fallback response due to JSON parsing error`);
      content = {
        intent: 'Unknown',
        tone: 'neutral',
        category: 'general',
        emotional_risk: 'medium',
        suggested_replies: [],
        recommended_timing: 'later',
        interest_level: '50%',
      };
    }

    const parsedResult: AIAnalysisResult = {
      intent: content.intent || content.intentLabel || 'Unknown',
      tone: content.tone || 'neutral',
      category: content.category || 'general',
      emotional_risk: (content.emotional_risk || content.risk || 'medium') as 'low' | 'medium' | 'high',
      suggested_replies: parseSuggestedReplies(content.suggested_replies),
      recommended_timing: content.recommended_timing || 'later',
      tokens_used: response.usage?.total_tokens || estimateTokens(inputText),
      interest_level: content.interest_level || '50%', // Always include interest_level, default to 50% if missing
      ...(content.explanation && { explanation: content.explanation }),
      ...(content.conversation_flow && { conversation_flow: content.conversation_flow }),
      ...(content.escalation_advice && { escalation_advice: content.escalation_advice }),
      ...(content.risk_mitigation && { risk_mitigation: content.risk_mitigation }),
    };
    
    console.log(`[AI] Parsed AI response:`, {
      hasIntent: !!parsedResult.intent,
      hasTone: !!parsedResult.tone,
      repliesCount: Array.isArray(parsedResult.suggested_replies) ? parsedResult.suggested_replies.length : Object.keys(parsedResult.suggested_replies || {}).length,
      tokens: parsedResult.tokens_used,
    });
    
    return parsedResult;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[AI] Groq API error after ${duration}ms:`, {
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Groq API error: ${error.message || 'Unknown error'}`);
  }
}

/* ========== COMMENTED OUT: Previous OpenAI and other providers removed ==========
   - OpenAI (gpt-4o, gpt-4o-mini) support removed
   - Cohere support removed
   - Claude support removed
   - Only Groq llama-3.3-70b-versatile is now used for ALL tiers and modes
   - See git history for previous implementations
========================================================== */

function parseSuggestedReplies(replies: any): string[] | Record<string, string> {
  if (!replies) return [];
  
  // If already an object (for deep mode), return as-is
  if (typeof replies === 'object' && !Array.isArray(replies)) {
    return replies;
  }
  
  if (Array.isArray(replies)) {
    if (replies.every(r => typeof r === 'string')) {
      return replies;
    }
    return replies.map((r: any) => {
      if (typeof r === 'string') return r;
      if (r.text) return r.text;
      if (r.message) return r.message;
      return String(r);
    }).filter(Boolean);
  }
  
  if (typeof replies === 'string') {
    return [replies];
  }
  
  return [];
}

function estimateTokens(text: string): number {
  return Math.ceil((text?.length || 0) / 4);
}
