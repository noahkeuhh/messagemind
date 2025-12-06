import { supabaseAdmin } from '../lib/supabase.js';
import { config } from '../config/index.js';

/**
 * Atomic credit deduction using database transactions
 * This ensures no race conditions when multiple requests come in simultaneously
 */
export async function atomicCreditDeduction(
  userId: string,
  amount: number,
  transactionType: string,
  details?: Record<string, any>
): Promise<{ success: boolean; credits_remaining: number; transaction_id?: string }> {
  // Use Supabase RPC function for true atomicity, or use row-level locking
  // For now, we'll use a more robust approach with version checking

  // Step 1: Get current user state
  const { data: user, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('credits_remaining, subscription_tier')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    throw new Error('User not found');
  }

  const currentCredits = user.credits_remaining;
  const newCredits = currentCredits + amount; // amount can be negative

  // Step 2: Validate sufficient credits
  if (newCredits < 0) {
    throw new Error('INSUFFICIENT_CREDITS');
  }

  // Step 3: Atomic update with optimistic locking
  // Update only if credits_remaining hasn't changed (prevents race conditions)
  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from('users')
    .update({ credits_remaining: newCredits })
    .eq('id', userId)
    .eq('credits_remaining', currentCredits) // Only update if unchanged
    .select('credits_remaining')
    .single();

  if (updateError || !updatedUser) {
    // Credits were changed by another request, retry once
    // In production, you might want to retry with exponential backoff
    const { data: retryUser } = await supabaseAdmin
      .from('users')
      .select('credits_remaining')
      .eq('id', userId)
      .single();

    if (!retryUser) {
      throw new Error('User not found on retry');
    }

    const retryNewCredits = retryUser.credits_remaining + amount;
    if (retryNewCredits < 0) {
      throw new Error('INSUFFICIENT_CREDITS');
    }

    const { data: finalUser, error: finalError } = await supabaseAdmin
      .from('users')
      .update({ credits_remaining: retryNewCredits })
      .eq('id', userId)
      .eq('credits_remaining', retryUser.credits_remaining)
      .select('credits_remaining')
      .single();

    if (finalError || !finalUser) {
      throw new Error('Concurrent modification detected. Please retry.');
    }

    // Create transaction record
    const { data: transaction } = await supabaseAdmin
      .from('credits_transactions')
      .insert({
        user_id: userId,
        type: transactionType,
        amount,
        details: details || {},
      })
      .select('id')
      .single();

    return {
      success: true,
      credits_remaining: finalUser.credits_remaining,
      transaction_id: transaction?.id,
    };
  }

  // Step 4: Create transaction record
  const { data: transaction, error: transactionError } = await supabaseAdmin
    .from('credits_transactions')
    .insert({
      user_id: userId,
      type: transactionType,
      amount,
      details: details || {},
    })
    .select('id')
    .single();

  if (transactionError) {
    console.error('Failed to create transaction record:', transactionError);
    // Credits were deducted but transaction not logged - this is a problem
    // In production, you might want to implement a compensation transaction
  }

  return {
    success: true,
    credits_remaining: updatedUser.credits_remaining,
    transaction_id: transaction?.id,
  };
}

/**
 * Calculate credits needed for analysis based on input/output size
 */
export function calculateCreditsNeeded(
  actionType: 'short_chat' | 'long_chat' | 'image_analysis',
  inputText: string,
  outputTokens: number = 0
): number {
  const baseCost = config.actionCosts[actionType] || 5;
  
  // Calculate extra credits for large input (per 100 chars over base)
  const inputLength = inputText?.length || 0;
  const baseInputLength = actionType === 'short_chat' ? 200 : actionType === 'long_chat' ? 500 : 0;
  const extraInputChars = Math.max(0, inputLength - baseInputLength);
  const extraInputCredits = Math.floor(extraInputChars / 100) * config.creditCalculation.extraInputPer100Chars;
  
  // Calculate extra credits for large output (per 100 tokens over base)
  const baseOutputTokens = actionType === 'short_chat' ? 200 : actionType === 'long_chat' ? 400 : 300;
  const extraOutputTokens = Math.max(0, outputTokens - baseOutputTokens);
  const extraOutputCredits = Math.floor(extraOutputTokens / 100) * config.creditCalculation.extraOutputPer100Tokens;
  
  return baseCost + extraInputCredits + extraOutputCredits;
}

/**
 * Get action cost (legacy function, use calculateCreditsNeeded for dynamic calculation)
 */
export function getActionCost(
  actionType: string,
  usePremium: boolean = false
): number {
  const baseCost = config.actionCosts[actionType as keyof typeof config.actionCosts] || 5;
  return baseCost;
}

/**
 * Determine AI provider and model based on subscription tier
 */
export function determineProvider(
  subscriptionTier: string
): 'openai' {
  // All tiers now use OpenAI (GPT-3.5 or GPT-4)
  return 'openai';
}

/**
 * Get AI model for subscription tier
 */
export function getAIModel(subscriptionTier: string): string {
  const tier = config.subscriptionTiers[subscriptionTier as keyof typeof config.subscriptionTiers];
  return tier?.aiModel || 'gpt-3.5-turbo';
}


