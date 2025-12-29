import { config } from '../config/index.js';
import crypto from 'crypto';

export type AnalysisMode = 'snapshot' | 'expanded' | 'deep';

export interface CreditCalculationInput {
  mode: AnalysisMode;
  tier: 'free' | 'pro' | 'plus' | 'max';
  inputText?: string;
  images?: string[];
  expandedToggle?: boolean; // PRO and PLUS: reused for deep toggle
  explanationToggle?: boolean; // Removed from PRO and PLUS
  batchInputs?: any[];
}

export interface CreditCalculationResult {
  totalCreditsRequired: number;
  baseTextCredits: number;
  baseImageCredits: number;
  inputExtraCredits: number;
  tierSurchargeCredits: number;
  breakdown: {
    textBase: number;
    imageBase: number;
    inputExtra: number;
    tierSurcharge: number;
  };
  tokensEstimated: number;
}

/**
 * MESSAGEMING CREDIT SYSTEM - Per Specification
 * 
 * BASE COSTS (all tiers):
 *   - Short text (≤ 200 chars): 5 credits
 *   - Long text (> 200 chars): 12 credits
 *   - Per image: 30 credits
 *   - Extra-long input penalty: floor(textLength / 500)
 * 
 * TIER-SPECIFIC RULES:
 * 
 * FREE:
 *   - 1 free analysis per month (snapshot only)
 *   - cost = baseTotal (internally tracked but not deducted)
 *   - Cannot use Expanded, Deep, or Explanation
 * 
 * PRO (100 credits/day):
 *   - Default: Snapshot only
 *   - No toggles available
 *   - cost = baseTotal
 * 
 * PLUS (180 credits/day):
 *   - Default: short text → Snapshot, else → Expanded
 *   - Optional Deep toggle: +12 credits
 *   - cost = baseTotal + deepToggle(12)
 * 
 * MAX (300 credits/day):
 *   - Default: images → Deep, short text → Expanded, else → Deep
 *   - Deep cost = ceil(baseTotal * 1.2)
 *   - No explanation toggle (Deep includes structured explanation)
 */
export function calculateDynamicCredits(input: CreditCalculationInput): CreditCalculationResult {
  const {
    mode,
    tier,
    inputText = '',
    images = [],
    expandedToggle = false,
    explanationToggle = false,
  } = input;

  // STEP 1: Calculate base text credits
  let baseTextCredits = 0;
  const textLength = (inputText || '').trim().length;
  
  if (textLength > 0) {
    if (textLength <= 200) {
      baseTextCredits = 5; // Short text
    } else {
      baseTextCredits = 12; // Long text
    }
  }

  // STEP 2: Calculate base image credits (30 per image)
  const baseImageCredits = (images?.length || 0) * 30;

  // STEP 3: Calculate input extra penalty: floor(textLength / 500)
  const inputExtraCredits = Math.floor(textLength / 500);

  // STEP 4: Calculate base total (no fallback defaults)
  const baseTotal = baseTextCredits + baseImageCredits + inputExtraCredits;

  // FREE: always treat snapshot as costing 1 credit (tracking/display only)
  if (tier === 'free') {
    const imageEffectiveChars = (images?.length || 0) * 250;
    const totalCharsForToken = textLength + imageEffectiveChars;
    const estimateFromInput = Math.ceil(totalCharsForToken / 4);
    const baselineTokens = 200; // Snapshot baseline
    const tokensEstimated = baselineTokens + estimateFromInput;

    return {
      totalCreditsRequired: 1,
      baseTextCredits: 1,
      baseImageCredits: 0,
      inputExtraCredits: 0,
      tierSurchargeCredits: 0,
      breakdown: {
        textBase: 1,
        imageBase: 0,
        inputExtra: 0,
        tierSurcharge: 0,
      },
      tokensEstimated,
    };
  }

  // STEP 5: Apply tier-specific surcharges
  let tierSurchargeCredits = 0;

  if (tier === 'plus') {
    // PLUS: Deep toggle = +12 (using expandedToggle for deep)
    if (expandedToggle) {
      tierSurchargeCredits += 12;
    }
    // PRO: no toggles
  } else if (tier === 'max') {
    // MAX: Deep uses 1.2x multiplier (applied below, not as surcharge)
    tierSurchargeCredits = 0;
  }

  // STEP 6: Apply mode multipliers
  let totalCreditsRequired = baseTotal + tierSurchargeCredits;

  // MAX tier Deep mode gets 1.2x multiplier
  if (tier === 'max' && mode === 'deep') {
    totalCreditsRequired = Math.ceil(baseTotal * 1.2) + tierSurchargeCredits;
  }

  // STEP 7: Estimate tokens
  const imageEffectiveChars = (images?.length || 0) * 250;
  const totalCharsForToken = textLength + imageEffectiveChars;
  const estimateFromInput = Math.ceil(totalCharsForToken / 4);
  const baselineTokens = mode === 'deep' ? 500 : (mode === 'expanded' ? 350 : 200);
  const tokensEstimated = baselineTokens + estimateFromInput;

  console.log(`[CreditCalc] Tier=${tier}, Mode=${mode}, BaseText=${baseTextCredits}, BaseImage=${baseImageCredits}, InputExtra=${inputExtraCredits}, Surcharge=${tierSurchargeCredits}, Total=${totalCreditsRequired}`);

  return {
    totalCreditsRequired,
    baseTextCredits,
    baseImageCredits,
    inputExtraCredits,
    tierSurchargeCredits,
    breakdown: {
      textBase: baseTextCredits,
      imageBase: baseImageCredits,
      inputExtra: inputExtraCredits,
      tierSurcharge: tierSurchargeCredits,
    },
    tokensEstimated,
  };
}

/**
 * Determine mode_used per spec given tier, input, and toggles
 */
export function determineMode(
  tier: 'free' | 'pro' | 'plus' | 'max',
  inputText: string | undefined,
  hasImages: boolean,
  expandedToggle?: boolean,
  requestedMode?: AnalysisMode
): AnalysisMode {
  const textLength = (inputText || '').trim().length;
  const isShort = textLength <= 200;

  if (tier === 'free') {
    return 'snapshot';
  }

  if (tier === 'pro') {
    return 'snapshot'; // Pro: no toggles, always snapshot
  }

  if (tier === 'plus') {
    if (expandedToggle) return 'deep'; // Plus: deep toggle
    if (isShort && !hasImages) return 'snapshot';
    return 'expanded'; // Plus default: expanded
  }

  // MAX: Allow user to choose their mode
  // requestedMode should be passed from the API call
  if (tier === 'max' && requestedMode) {
    return requestedMode;
  }

  // MAX fallback (if no requestedMode provided)
  if (hasImages) return 'deep';
  if (isShort && !hasImages) return 'expanded';
  return 'deep';
}

/**
 * Generate analysis hash for caching
 */
export function generateAnalysisHash(
  userId: string,
  normalizedInput: string,
  mode: AnalysisMode,
  modelVersion: string,
  expandedToggle: boolean = false,
  explanationToggle: boolean = false
): string {
  const hashInput = `${userId}|${normalizedInput}|${mode}|${modelVersion}|${expandedToggle}|${explanationToggle}`;
  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

/**
 * Normalize input text for hashing (remove extra whitespace, lowercase)
 */
export function normalizeInputForHash(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}
