import { config } from '../config/index.js';
import type { AnalysisMode } from './credit-scaling.service.js';

export interface PromptTemplate {
  system: string;
  maxTokens: number;
  temperature: number;
}

/**
 * Get prompt template for analysis mode
 */
export function getPromptTemplate(mode: AnalysisMode): PromptTemplate {
  switch (mode) {
    case 'snapshot':
      return {
        system: `Je bent een beknopte dating coach. Analyseer het bericht en geef exact de volgende JSON:
{
  "intent": "korte beschrijving van wat ze écht bedoelt",
  "tone": "flirterig|neutraal|afstandelijk|enthousiast",
  "category": "afspraak voorstel|bevestiging|vraag|kort antwoord|andere",
  "emotional_risk": "low|medium|high",
  "suggested_replies": ["reply 1", "reply 2"],
  "recommended_timing": "direct|later|wait"
}
Geen extra tekst. Output max tokens = ${config.creditScaling.shortFormMaxTokens}.`,
        maxTokens: config.creditScaling.shortFormMaxTokens,
        temperature: 0.7,
      };

    case 'expanded':
      return {
        system: `Je bent een dating coach. Geef JSON:
{
  "intent": "beschrijving van wat ze écht bedoelt",
  "tone": "flirterig|neutraal|afstandelijk|enthousiast",
  "category": "afspraak voorstel|bevestiging|vraag|kort antwoord|andere",
  "emotional_risk": "low|medium|high",
  "explanation": ["bullet 1 (max 50 woorden)", "bullet 2 (max 50 woorden)", "bullet 3 (max 50 woorden)"],
  "suggested_replies": ["reply 1", "reply 2", "reply 3"],
  "recommended_timing": "direct|later|wait"
}`,
        maxTokens: config.creditScaling.longFormBaseTokens,
        temperature: 0.7,
      };

    case 'deep':
      return {
        system: `Je bent een senior relationship strategist. Geef uitgebreide JSON:
{
  "intent": "gedetailleerde analyse van wat ze écht bedoelt",
  "tone": "flirterig|neutraal|afstandelijk|enthousiast",
  "category": "afspraak voorstel|bevestiging|vraag|kort antwoord|andere",
  "emotional_risk": "low|medium|high",
  "explanation": "3 alinea's met diepgaande analyse (elk ~100 woorden)",
  "suggested_replies": ["reply 1", "reply 2", "reply 3", "reply 4", "reply 5"],
  "conversation_flow": [
    {"message": "jouw eerste bericht", "timing": "direct|later|wait"},
    {"message": "jouw tweede bericht", "timing": "direct|later|wait"},
    {"message": "jouw derde bericht", "timing": "direct|later|wait"}
  ],
  "escalation_advice": "advies over hoe verder te gaan",
  "recommended_timing": "direct|later|wait"
}`,
        maxTokens: config.creditScaling.outputBaselineTokens.deep,
        temperature: 0.8,
      };

    default:
      return getPromptTemplate('snapshot');
  }
}

/**
 * Build user message with images if present
 */
export function buildUserMessage(inputText: string, images?: string[]): any {
  if (images && images.length > 0) {
    const content: any[] = [];
    
    if (inputText) {
      content.push({ type: 'text', text: inputText });
    }
    
    for (const imageUrl of images) {
      content.push({
        type: 'image_url',
        image_url: { url: imageUrl },
      });
    }
    
    return content;
  }
  
  return inputText || 'Analyseer dit bericht';
}

