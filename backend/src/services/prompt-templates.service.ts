import { config } from '../config/index.js';
import type { AnalysisMode } from './credit-scaling.service.js';

export interface PromptTemplate {
  system: string;
  maxTokens: number;
  temperature: number;
}

/**
 * Get prompt template for analysis mode (TIER-BASED DETAIL DENSITY v2)
 * @param mode - Analysis mode (snapshot, expanded, deep)
 * @param tier - Subscription tier (controls optional detail depth)
 */
export function getPromptTemplate(
  mode: AnalysisMode,
  tier?: 'free' | 'pro' | 'plus' | 'max',
  opts?: { explanationToggle?: boolean }
): PromptTemplate {
  switch (mode) {
    case 'snapshot':
      if (opts?.explanationToggle && tier === 'pro') {
        return {
          system: `Analyze this dating message. Return ONLY valid JSON with no markdown, no comments, no text before or after.

IMPORTANT: Respond in the SAME LANGUAGE as the input message. If input is Dutch, respond in Dutch. If English, respond in English.

Required fields:
- intent: what they really mean
- tone: tone of message
- category: type of message
- emotional_risk: must be "low" or "medium" or "high"
- recommended_timing: when to respond
- explanation: one short paragraph
- suggested_replies: exactly 2 reply strings
- interest_level: percentage string like "65%"

Return valid JSON object only.`,
          maxTokens: 300,
          temperature: 0.7,
        };
      }
      return {
        system: `Analyze this dating message. Return ONLY valid JSON with no markdown, no comments, no text before or after.

IMPORTANT: Respond in the SAME LANGUAGE as the input message. If input is Dutch, respond in Dutch. If English, respond in English.

Required fields:
- intent: what they really mean
- tone: tone of message
- category: type of message
- emotional_risk: must be "low" or "medium" or "high"
- recommended_timing: when to respond
- suggested_replies: exactly 2 reply strings
- interest_level: percentage string like "65%"

Return valid JSON object only.`,
        maxTokens: 250,
        temperature: 0.7,
      };

    case 'expanded':
      const isProTier = tier === 'pro';
      if (isProTier) {
        return {
          system: `Analyze this dating message. Return ONLY valid JSON with no markdown, no comments, no text before or after.

IMPORTANT: Respond in the SAME LANGUAGE as the input message. If input is Dutch, respond in Dutch. If English, respond in English.

Required core fields:
- intent: what they really mean
- tone: tone of message
- category: type of message
- emotional_risk: "low", "medium", or "high"
- recommended_timing: when to respond
- explanation: one sentence explanation
- suggested_replies: array of exactly 3 reply strings
- interest_level: percentage string like "70%"

Required details field (PRO tier):
- details object with:
  - summary_one_liner: brief one line summary string
  - confidence object with overall field (number 0 to 1)
  - signals object with positive field (array of max 2 strings)

Return valid JSON object. All fields required.`,
          maxTokens: 380,
          temperature: 0.7,
        };
      } else {
        return {
          system: `Analyze this dating message. Return ONLY valid JSON with no markdown, no comments, no text before or after.

IMPORTANT: Respond in the SAME LANGUAGE as the input message. If input is Dutch, respond in Dutch. If English, respond in English.

Required core fields:
- intent: what they really mean
- tone: tone of message
- category: type of message
- emotional_risk: "low", "medium", or "high"
- recommended_timing: when to respond
- explanation: one to two sentence explanation
- suggested_replies: array of exactly 3 reply strings
- interest_level: percentage string like "75%"

Required details field (PLUS tier):
- details object with:
  - summary_one_liner: brief summary string
  - confidence object with overall, intent, tone, interest_level fields (all numbers 0 to 1)
  - signals object with positive array (2-3 strings), neutral array (1-2 strings), negative array (can be empty)
  - timing_logic object with why_this_timing string and avoid_when array of strings
  - reply_pack array with 1-3 objects, each having style, text, why_it_works strings and risk field (low/medium/high)
  - next_steps array with 2-3 strings

Return valid JSON object. All fields required.`,
          maxTokens: 520,
          temperature: 0.7,
        };
      }

    case 'deep':
      return {
        system: `Analyze this dating message deeply. Return ONLY valid JSON with no markdown, no comments, no text before or after.

IMPORTANT: Respond in the SAME LANGUAGE as the input message. If input is Dutch, respond in Dutch. If English, respond in English.

Required core fields:
- intent: what they really mean
- tone: tone of message
- category: type of message
- emotional_risk: "low", "medium", or "high"
- recommended_timing: when to respond
- explanation: object with four string fields: meaning_breakdown, emotional_context, relationship_signals, hidden_patterns
- suggested_replies: object with five string fields: playful, confident, safe, bold, escalation
- conversation_flow: array of exactly 3 objects, each with one field: you OR them_reaction OR you_next (all strings)
- escalation_advice: string with escalation advice
- risk_mitigation: string with risk mitigation advice
- interest_level: percentage string like "80%"

Required details field (MAX tier):
- details object with:
  - summary_one_liner: string
  - confidence object with overall, intent, tone, interest_level (all 0 to 1)
  - micro_signal_map object with humor_score, warmth_score, challenge_score, directness_score (all 0 to 1)
  - risk_flags object with misread_risk, overpursuit_risk, boundary_risk (each "low", "medium", or "high")
  - persona_replies array with 1-2 objects, each with persona and reply strings
  - timing_matrix object with best_windows array and avoid_windows array (both string arrays)
  - what_not_to_send array with 2-3 strings

Return valid JSON object. All fields required. Use realistic values.`,
        maxTokens: 750,
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
