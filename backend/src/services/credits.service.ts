import { supabaseAdmin } from '../lib/supabase.js';
import { updateUserCredits } from './user.service.js';
import { config } from '../config/index.js';

export async function deductCredits(
  userId: string,
  actionType: string,
  actionCost: number
): Promise<{ success: boolean; credits_remaining: number }> {
  // Check if user has enough credits
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('credits_remaining')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new Error('User not found');
  }

  if (user.credits_remaining < actionCost) {
    throw new Error('INSUFFICIENT_CREDITS');
  }

  // Deduct credits atomically
  return await updateUserCredits(
    userId,
    -actionCost,
    'action_spend',
    {
      action_type: actionType,
      action_cost: actionCost,
    }
  );
}

/**
 * Legacy: Use calculateDynamicCredits from credit-scaling.service.ts instead
 */



