import { supabaseAdmin } from '../lib/supabase.js';
import { config } from '../config/index.js';

export interface User {
  id: string;
  email: string;
  subscription_tier: string;
  daily_credits_limit: number;
  credits_remaining: number;
  last_reset_date: string;
  free_trial_used_at?: string; // When the free trial was used (for Free tier)
  last_free_analysis_date?: string;
  monthly_free_analyses_used?: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
  metadata: Record<string, any>;
}

export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as User;
}

export async function createUser(userId: string, email: string, metadata?: Record<string, any>): Promise<User> {
  // Default every new user to the Free tier unless onboarding_tier explicitly overrides it
  const tier = metadata?.onboarding_tier || 'free';
  const tierConfig = config.subscriptionTiers[tier as keyof typeof config.subscriptionTiers] || config.subscriptionTiers.free;
  
  const welcomeCredits = tierConfig.dailyCreditsLimit;

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      id: userId,
      email,
      subscription_tier: tier,
      daily_credits_limit: tierConfig.dailyCreditsLimit,
      credits_remaining: welcomeCredits,
      last_reset_date: new Date().toISOString(),
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  // Create signup bonus transaction
  await supabaseAdmin
    .from('credits_transactions')
    .insert({
      user_id: userId,
      type: 'signup_bonus',
      amount: welcomeCredits,
      details: { tier, welcome_bonus: true },
    });

  return data as User;
}

export async function updateUserCredits(
  userId: string,
  amount: number,
  transactionType: string,
  details?: Record<string, any>
): Promise<{ success: boolean; credits_remaining: number }> {
  // Use a transaction-like approach with row locking
  const { data: user, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('credits_remaining')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    throw new Error('User not found');
  }

  const newCredits = user.credits_remaining + amount;

  if (newCredits < 0) {
    throw new Error('Insufficient credits');
  }

  // Update credits atomically
  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from('users')
    .update({ credits_remaining: newCredits })
    .eq('id', userId)
    .select('credits_remaining')
    .single();

  if (updateError || !updatedUser) {
    throw new Error('Failed to update credits');
  }

  // Create transaction record
  await supabaseAdmin
    .from('credits_transactions')
    .insert({
      user_id: userId,
      type: transactionType,
      amount,
      details: details || {},
    });

  return {
    success: true,
    credits_remaining: updatedUser.credits_remaining,
  };
}

export async function resetDailyCredits(userId: string): Promise<void> {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const resetAmount = user.daily_credits_limit;

  await supabaseAdmin
    .from('users')
    .update({
      credits_remaining: resetAmount,
      last_reset_date: new Date().toISOString(),
    })
    .eq('id', userId);

  await supabaseAdmin
    .from('credits_transactions')
    .insert({
      user_id: userId,
      type: 'daily_reset',
      amount: resetAmount,
      details: { reset_date: new Date().toISOString() },
    });
}

export async function checkAndResetDailyCredits(userId: string): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) {
    return false;
  }

  const lastReset = new Date(user.last_reset_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastReset.setHours(0, 0, 0, 0);

  if (lastReset < today) {
    await resetDailyCredits(userId);
    
    // Reset monthly free analyses for Free tier
    if (user.subscription_tier === 'free') {
      const lastFreeAnalysis = user.last_free_analysis_date ? new Date(user.last_free_analysis_date) : null;
      const isNewMonth = !lastFreeAnalysis || 
        (lastFreeAnalysis.getMonth() !== today.getMonth() || lastFreeAnalysis.getFullYear() !== today.getFullYear());
      
      if (isNewMonth) {
        await supabaseAdmin
          .from('users')
          .update({
            monthly_free_analyses_used: 0,
            last_free_analysis_date: null,
          })
          .eq('id', userId);
      }
    }
    
    return true;
  }

  return false;
}

/**
 * Check if Free tier user can use monthly free analysis
 */
export async function canUseFreeAnalysis(userId: string): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user || user.subscription_tier !== 'free') {
    return false;
  }

  const tierConfig = config.subscriptionTiers.free;
  const used = user.monthly_free_analyses_used || 0;
  
  if (used >= tierConfig.monthlyFreeAnalyses) {
    return false;
  }

  // Check if it's a new month
  const lastFreeAnalysis = user.last_free_analysis_date ? new Date(user.last_free_analysis_date) : null;
  const today = new Date();
  
  if (lastFreeAnalysis) {
    const isNewMonth = lastFreeAnalysis.getMonth() !== today.getMonth() || 
                       lastFreeAnalysis.getFullYear() !== today.getFullYear();
    if (isNewMonth) {
      // Reset for new month
      await supabaseAdmin
        .from('users')
        .update({
          monthly_free_analyses_used: 0,
          last_free_analysis_date: null,
        })
        .eq('id', userId);
      return true;
    }
  }

  return used < tierConfig.monthlyFreeAnalyses;
}

/**
 * Mark free analysis as used and track free_trial_used_at
 */
export async function markFreeAnalysisUsed(userId: string): Promise<void> {
  const user = await getUserById(userId);
  if (!user || user.subscription_tier !== 'free') {
    return;
  }

  const used = (user.monthly_free_analyses_used || 0) + 1;
  const now = new Date().toISOString();
  
  await supabaseAdmin
    .from('users')
    .update({
      monthly_free_analyses_used: used,
      last_free_analysis_date: now,
      free_trial_used_at: user.free_trial_used_at || now, // Track first use of free trial
    })
    .eq('id', userId);
}



