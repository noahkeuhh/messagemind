import { config } from '../config/index.js';
import { determineMode, type AnalysisMode } from './credit-scaling.service.js';

export type ModelName = 'llama-3.3-70b-versatile';
export type SubscriptionTier = 'free' | 'pro' | 'plus' | 'max';
export type AIProviderType = 'groq';

export interface ModelRoutingResult {
  model: ModelName;
  mode: AnalysisMode;
  provider: AIProviderType;
}

/**
 * Route AI model based on tier and mode - MessageMind "Mode-Included Premium" logic
 * 
 * This implements the tier-specific mode defaults and routing per the spec:
 * 
 * FREE:
 *   mode = "snapshot" (only available mode)
 * 
 * PRO:
 *   mode = user_selected (snapshot or expanded)
 * 
 * PLUS:
 *   mode = (isShort && !hasImages) ? "snapshot" : "expanded" (user can't override)
 * 
 * MAX:
 *   mode = user_selected (snapshot, expanded, or deep - all available)
 * 
 * ALL MODES USE GROQ: llama-3.3-70b-versatile
 */
export function routeModel(
  tier: SubscriptionTier,
  requestedMode: AnalysisMode,
  inputText: string,
  hasImages: boolean,
  opts?: { expandedToggle?: boolean }
): ModelRoutingResult {
  const textLength = (inputText || '').trim().length;
  const isShort = textLength <= 200;

  // Compute actual mode per spec, for MAX allow user choice
  const actualMode = determineMode(tier, inputText, hasImages, opts?.expandedToggle, tier === 'max' ? requestedMode : undefined);

  console.log(`[ModelRouting] Tier: ${tier}, Requested: ${requestedMode}, Computed: ${actualMode}, Text length: ${textLength}, Has images: ${hasImages}`);
  console.log(`[ModelRouting] ${tier} tier → Groq llama-3.3-70b-versatile (mode: ${actualMode})`);

  return {
    model: 'llama-3.3-70b-versatile',
    mode: actualMode,
    provider: 'groq',
  };
}
