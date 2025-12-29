import { z } from 'zod';

/**
 * JSON Output Validators for AI Analysis Responses
 * Ensures all responses match the exact specification
 */

// SNAPSHOT response schema
export const SnapshotResponseSchema = z.object({
  intent: z.string().describe('Emotie/bedoeling van het bericht'),
  tone: z.string().describe('Toon van het bericht'),
  category: z.string().describe('Type bericht'),
  emotional_risk: z.enum(['low', 'medium', 'high']).describe('Risico niveau'),
  recommended_timing: z.string().describe('Wanneer reageren'),
  suggested_replies: z.array(z.string()).min(2).describe('2+ reply opties'),
  interest_level: z.string().optional().describe('Percentage string 0-100%'),
});

export type SnapshotResponse = z.infer<typeof SnapshotResponseSchema>;

// EXPANDED response schema (with optional v2 details)
export const ExpandedResponseSchema = z.object({
  intent: z.string().describe('Emotie/bedoeling van het bericht'),
  tone: z.string().describe('Toon van het bericht'),
  category: z.string().describe('Type bericht'),
  emotional_risk: z.enum(['low', 'medium', 'high']).describe('Risico niveau'),
  recommended_timing: z.string().describe('Wanneer reageren'),
  explanation: z.string().describe('Gedetailleerde uitleg van de boodschap'),
  suggested_replies: z.array(z.string()).min(3).describe('3 reply opties'),
  interest_level: z.string().optional().describe('Percentage string 0-100%'),
  // Optional v2 details block
  details: z.object({
    summary_one_liner: z.string().optional(),
    confidence: z.object({
      overall: z.number().min(0).max(1).optional(),
      intent: z.number().min(0).max(1).optional(),
      tone: z.number().min(0).max(1).optional(),
      interest_level: z.number().min(0).max(1).optional(),
    }).optional(),
    signals: z.object({
      positive: z.array(z.string()).optional(),
      neutral: z.array(z.string()).optional(),
      negative: z.array(z.string()).optional(),
    }).optional(),
    timing_logic: z.object({
      why_this_timing: z.string().optional(),
      avoid_when: z.array(z.string()).optional(),
    }).optional(),
    reply_pack: z.array(z.object({
      style: z.string().optional(),
      text: z.string().optional(),
      why_it_works: z.string().optional(),
      risk: z.enum(['low', 'medium', 'high']).optional(),
    })).optional(),
    next_steps: z.array(z.string()).optional(),
  }).optional(),
}).strict();

export type ExpandedResponse = z.infer<typeof ExpandedResponseSchema>;

// DEEP response schema (with optional v2 details)
export const DeepResponseSchema = z.object({
  intent: z.string().describe('Emotie/bedoeling van het bericht'),
  tone: z.string().describe('Toon van het bericht'),
  category: z.string().describe('Type bericht'),
  emotional_risk: z.enum(['low', 'medium', 'high']).describe('Risico niveau'),
  recommended_timing: z.string().describe('Wanneer reageren'),
  explanation: z.object({
    meaning_breakdown: z.string().describe('Wat zegt ze echt'),
    emotional_context: z.string().describe('Emotionele achtergrond'),
    relationship_signals: z.string().describe('Signalen over de relatie'),
    hidden_patterns: z.string().describe('Verborgen patronen'),
  }).describe('Gedetailleerde analyse'),
  suggested_replies: z.object({
    playful: z.string().describe('Luchtige reply'),
    confident: z.string().describe('Zelfverzekerde reply'),
    safe: z.string().describe('Veilige reply'),
    bold: z.string().describe('Durfde reply'),
    escalation: z.string().describe('Escalation reply'),
  }).describe('5 reply types'),
  conversation_flow: z.array(
    z.object({
      you: z.string().optional().describe('Your message'),
      them_reaction: z.string().optional().describe('Their reaction'),
      you_next: z.string().optional().describe('Your follow-up'),
    }).refine(obj => Object.values(obj).some(v => v !== undefined), 
      { message: 'At least one field must be present' }
    )
  ).min(3).max(3).describe('Exactly 3 conversation flow steps'),
  escalation_advice: z.string().describe('Advies voor escalatie'),
  risk_mitigation: z.string().describe('Risicobeperkingsadvies'),
  interest_level: z.string().optional().describe('Percentage string 0-100%'),
  // Optional v2 details block (MAX tier)
  details: z.object({
    summary_one_liner: z.string().optional(),
    confidence: z.object({
      overall: z.number().min(0).max(1).optional(),
      intent: z.number().min(0).max(1).optional(),
      tone: z.number().min(0).max(1).optional(),
      interest_level: z.number().min(0).max(1).optional(),
    }).optional(),
    micro_signal_map: z.object({
      humor_score: z.number().min(0).max(1).optional(),
      warmth_score: z.number().min(0).max(1).optional(),
      challenge_score: z.number().min(0).max(1).optional(),
      directness_score: z.number().min(0).max(1).optional(),
    }).optional(),
    risk_flags: z.object({
      misread_risk: z.enum(['low', 'medium', 'high']).optional(),
      overpursuit_risk: z.enum(['low', 'medium', 'high']).optional(),
      boundary_risk: z.enum(['low', 'medium', 'high']).optional(),
    }).optional(),
    persona_replies: z.array(z.object({
      persona: z.string().optional(),
      reply: z.string().optional(),
    })).optional(),
    timing_matrix: z.object({
      best_windows: z.array(z.string()).optional(),
      avoid_windows: z.array(z.string()).optional(),
    }).optional(),
    what_not_to_send: z.array(z.string()).optional(),
  }).optional(),
}).strict();

export type DeepResponse = z.infer<typeof DeepResponseSchema>;

/**
 * Validate and sanitize snapshot response
 */
export function validateSnapshotResponse(data: any): SnapshotResponse {
  try {
    const validated = SnapshotResponseSchema.parse(data);
    return validated;
  } catch (error) {
    console.error('[Validator] Snapshot validation failed:', error);
    throw new Error(`Invalid snapshot response format: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validate and sanitize expanded response
 */
export function validateExpandedResponse(data: any): ExpandedResponse {
  try {
    const validated = ExpandedResponseSchema.parse(data);
    return validated;
  } catch (error) {
    console.error('[Validator] Expanded validation failed:', error);
    throw new Error(`Invalid expanded response format: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validate and sanitize deep response
 */
export function validateDeepResponse(data: any): DeepResponse {
  try {
    const validated = DeepResponseSchema.parse(data);
    return validated;
  } catch (error) {
    console.error('[Validator] Deep validation failed:', error);
    throw new Error(`Invalid deep response format: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Auto-validate based on mode
 */
export function validateResponseByMode(mode: 'snapshot' | 'expanded' | 'deep', data: any) {
  switch (mode) {
    case 'snapshot':
      return validateSnapshotResponse(data);
    case 'expanded':
      return validateExpandedResponse(data);
    case 'deep':
      return validateDeepResponse(data);
    default:
      throw new Error(`Unknown mode: ${mode}`);
  }
}
