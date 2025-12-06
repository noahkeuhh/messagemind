import { config } from '../config/index.js';
import crypto from 'crypto';

export type AnalysisMode = 'snapshot' | 'expanded' | 'deep';

export interface CreditCalculationInput {
  mode: AnalysisMode;
  inputText?: string;
  images?: string[];
  usePremium?: boolean;
  batchInputs?: any[];
  modules?: string[];
  deepModeRequested?: boolean;
}

export interface CreditCalculationResult {
  totalCredits: number;
  baseCredits: number;
  extraInputCredits: number;
  extraOutputCredits: number;
  premiumFee: number;
  moduleCosts: number;
  breakdown: {
    base: number;
    inputExtra: number;
    outputExtra: number;
    modules: number;
    premium: number;
    deepMultiplier?: number;
  };
  tokensEstimated: number;
}

/**
 * Dynamic Credit Scaling Algorithm (MessageMind specification)
 * 
 * Stap A = BASE: base_credits per mode
 * Stap B = INPUT-BASED EXTRA: based on input length
 * Stap C = OUTPUT-ESTIMATE: based on estimated output tokens
 * Stap D = MODE/FEATURE PENALTIES: deep mode, batch, modules
 * Stap E = TOTAL: sum with multipliers
 */
export function calculateDynamicCredits(input: CreditCalculationInput): CreditCalculationResult {
  const {
    mode,
    inputText = '',
    images = [],
    usePremium = false,
    batchInputs = [],
    modules = [],
    deepModeRequested = false,
  } = input;

  // Stap A: BASE CREDITS
  const baseCredits = config.baseCredits[mode] || 5;

  // Stap B: INPUT-BASED EXTRA
  const inputChars = (inputText || '').length;
  const imageEffectiveChars = images.length * config.creditScaling.imageInputEquivChars;
  const totalInputChars = inputChars + imageEffectiveChars;

  let extraInputCredits = 0;
  if (totalInputChars > config.creditScaling.inputBaseThresholdChars) {
    const excessChars = totalInputChars - config.creditScaling.inputBaseThresholdChars;
    extraInputCredits = Math.ceil(excessChars / config.creditScaling.inputChunkChars);
  }

  // Stap C: OUTPUT-ESTIMATE
  const baselineTokens = config.creditScaling.outputBaselineTokens[mode];
  
  // Estimate output tokens from input
  const estimateFromInput = Math.ceil(totalInputChars / 4); // ~1 token per 4 chars
  let initialEstimatedOutputTokens = baselineTokens + estimateFromInput;

  // Add image analysis overhead
  if (images.length > 0) {
    initialEstimatedOutputTokens += Math.floor(
      config.creditScaling.imageAnalysisBaseTokens / 3
    );
  }

  // Premium upgrade increases output estimate
  if (usePremium) {
    initialEstimatedOutputTokens = Math.ceil(initialEstimatedOutputTokens * 1.5);
  }

  // Calculate extra output credits
  const extraOutputTokens = Math.max(0, initialEstimatedOutputTokens - baselineTokens);
  const extraOutputCredits = Math.ceil(extraOutputTokens / config.creditScaling.outputChunkTokens);

  // Stap D: MODE/FEATURE PENALTIES
  let moduleCosts = 0;
  if (modules && modules.length > 0) {
    // Each additional module costs 1 credit
    moduleCosts = modules.length;
  }

  // Batch processing: multiply per input (no base doubling)
  const batchCount = batchInputs.length > 0 ? batchInputs.length : 1;
  const perInputCredits = baseCredits + extraInputCredits + extraOutputCredits + moduleCosts;

  // Stap E: TOTAL
  let totalCreditsRaw = perInputCredits * batchCount;

  // Apply deep mode multiplier if requested
  let deepMultiplier = 1.0;
  if (deepModeRequested || mode === 'deep') {
    deepMultiplier = config.creditScaling.deepMultiplier;
    totalCreditsRaw = Math.ceil(totalCreditsRaw * deepMultiplier);
  }

  // Add premium fee
  const premiumFee = usePremium ? config.creditScaling.premiumFeeCredits : 0;
  totalCreditsRaw += premiumFee;

  // Enforce minimum (at least base credits)
  const totalCredits = Math.max(baseCredits, totalCreditsRaw);

  return {
    totalCredits,
    baseCredits,
    extraInputCredits,
    extraOutputCredits,
    premiumFee,
    moduleCosts,
    breakdown: {
      base: baseCredits,
      inputExtra: extraInputCredits,
      outputExtra: extraOutputCredits,
      modules: moduleCosts,
      premium: premiumFee,
      ...(deepMultiplier > 1.0 ? { deepMultiplier } : {}),
    },
    tokensEstimated: initialEstimatedOutputTokens,
  };
}

/**
 * Generate analysis hash for caching
 */
export function generateAnalysisHash(
  userId: string,
  normalizedInput: string,
  mode: AnalysisMode,
  modelVersion: string,
  usePremium: boolean
): string {
  const hashInput = `${userId}|${normalizedInput}|${mode}|${modelVersion}|${usePremium}`;
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

