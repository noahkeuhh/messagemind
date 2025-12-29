import { supabaseAdmin } from '../lib/supabase.js';

export interface Badge {
  id: string;
  name: string;
  category: 'usage' | 'streak' | 'mode' | 'skill' | 'plan';
  description: string;
  icon: string;
  required_tier?: 'free' | 'pro' | 'plus' | 'max';
  is_active: boolean;
  reward_credits: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  unlocked_at: string;
  first_event_payload?: any;
  badge?: Badge;
}

export interface BadgeEventPayload {
  analysis_id?: string;
  mode_used?: 'snapshot' | 'expanded' | 'deep';
  text_length?: number;
  hasImages?: boolean;
  interest_level?: number;
  emotional_risk?: 'low' | 'medium' | 'high';
  timestamp?: string;
  new_plan?: 'free' | 'pro' | 'plus' | 'max';
}

interface UserStats {
  total_completed_analyses: number;
  total_long_text_analyses: number;
  total_image_analyses: number;
  consecutive_day_streak: number;
  high_interest_count: number;
  high_risk_count: number;
  modes_used: Set<string>;
}

/**
 * Badge evaluation service
 * Evaluates badge unlock conditions based on user events
 */
export class BadgeService {
  /**
   * Main entry point: evaluate badges for a given event
   */
  async evaluateBadgesForEvent(
    userId: string,
    eventType: 'analysis_completed' | 'plan_upgraded',
    payload: BadgeEventPayload
  ): Promise<{ newUnlocks: UserBadge[]; totalUnlocked: number }> {
    const newlyUnlocked: UserBadge[] = [];

    try {
      if (eventType === 'analysis_completed') {
        const stats = await this.computeUserStats(userId);
        const unlocked = await this.evaluateAnalysisBadges(userId, stats, payload);
        newlyUnlocked.push(...unlocked);
      } else if (eventType === 'plan_upgraded' && payload.new_plan) {
        const unlocked = await this.evaluatePlanBadges(userId, payload.new_plan);
        newlyUnlocked.push(...unlocked);
      }

      // Get total unlocked count
      const { count } = await supabaseAdmin
        .from('user_badges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      return {
        newUnlocks: newlyUnlocked,
        totalUnlocked: count || 0,
      };
    } catch (error) {
      console.error('[BadgeService] Error evaluating badges:', error);
      return { newUnlocks: [], totalUnlocked: 0 };
    }
  }

  /**
   * Compute user stats from analyses table
   */
  private async computeUserStats(userId: string): Promise<UserStats> {
    const { data: analyses, error } = await supabaseAdmin
      .from('analyses')
      .select('created_at, input_text, image_url, mode, analysis_result')
      .eq('user_id', userId)
      .eq('status', 'done')
      .order('created_at', { ascending: true });

    if (error || !analyses) {
      console.error('[BadgeService] Error fetching analyses:', error);
      return this.getDefaultStats();
    }

    const stats: UserStats = {
      total_completed_analyses: analyses.length,
      total_long_text_analyses: 0,
      total_image_analyses: 0,
      consecutive_day_streak: 0,
      high_interest_count: 0,
      high_risk_count: 0,
      modes_used: new Set(),
    };

    // Compute stats
    const modesSet = new Set<string>();
    let longTextCount = 0;
    let imageCount = 0;
    let highInterestCount = 0;
    let highRiskCount = 0;

    for (const analysis of analyses) {
      // Mode tracking
      if (analysis.mode) modesSet.add(analysis.mode);

      // Long text (>200 chars)
      if (analysis.input_text && analysis.input_text.trim().length > 200) {
        longTextCount++;
      }

      // Image analysis
      if (analysis.image_url) {
        imageCount++;
      }

      // Interest level
      const result = analysis.analysis_result;
      if (result && typeof result === 'object') {
        const interestLevel = result.interest_level;
        if (typeof interestLevel === 'number' && interestLevel >= 70) {
          highInterestCount++;
        }
      }

      // Emotional risk
      if (result && typeof result === 'object') {
        const risk = result.emotional_risk;
        if (risk === 'medium' || risk === 'high') {
          highRiskCount++;
        }
      }
    }

    stats.modes_used = modesSet;
    stats.total_long_text_analyses = longTextCount;
    stats.total_image_analyses = imageCount;
    stats.high_interest_count = highInterestCount;
    stats.high_risk_count = highRiskCount;

    // Compute consecutive day streak
    stats.consecutive_day_streak = this.computeStreak(analyses.map(a => a.created_at));

    return stats;
  }

  /**
   * Compute consecutive day streak from analysis timestamps
   */
  private computeStreak(timestamps: string[]): number {
    if (timestamps.length === 0) return 0;

    // Get unique days
    const days = new Set<string>();
    for (const ts of timestamps) {
      const date = new Date(ts);
      const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      days.add(dayKey);
    }

    // Sort days
    const sortedDays = Array.from(days).sort();

    // Count consecutive days ending today
    let streak = 0;
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    for (let i = sortedDays.length - 1; i >= 0; i--) {
      const dayKey = sortedDays[i];
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - streak);
      const expectedKey = `${expectedDate.getFullYear()}-${expectedDate.getMonth() + 1}-${expectedDate.getDate()}`;

      if (dayKey === expectedKey) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Evaluate analysis-related badges
   */
  private async evaluateAnalysisBadges(
    userId: string,
    stats: UserStats,
    payload: BadgeEventPayload
  ): Promise<UserBadge[]> {
    const badgesToCheck: Array<{ id: string; condition: boolean }> = [
      // First steps
      { id: 'first_analysis', condition: stats.total_completed_analyses >= 1 },
      { id: 'first_image', condition: stats.total_image_analyses >= 1 },
      { id: 'first_deep', condition: stats.modes_used.has('deep') },

      // Usage volume
      { id: 'analysis_10', condition: stats.total_completed_analyses >= 10 },
      { id: 'analysis_50', condition: stats.total_completed_analyses >= 50 },
      { id: 'analysis_100', condition: stats.total_completed_analyses >= 100 },

      // Streaks
      { id: 'streak_3', condition: stats.consecutive_day_streak >= 3 },
      { id: 'streak_7', condition: stats.consecutive_day_streak >= 7 },
      { id: 'streak_30', condition: stats.consecutive_day_streak >= 30 },

      // Mode exploration
      { id: 'multi_mode', condition: stats.modes_used.has('snapshot') && stats.modes_used.has('expanded') && stats.modes_used.has('deep') },
      { id: 'long_reader', condition: stats.total_long_text_analyses >= 20 },
      { id: 'image_pro', condition: stats.total_image_analyses >= 20 },

      // Skill badges
      { id: 'green_flag_hunter', condition: stats.high_interest_count >= 10 },
      { id: 'red_flag_aware', condition: stats.high_risk_count >= 10 },
    ];

    const newlyUnlocked: UserBadge[] = [];

    for (const { id, condition } of badgesToCheck) {
      if (condition) {
        const unlocked = await this.unlockBadge(userId, id, payload);
        if (unlocked) {
          newlyUnlocked.push(unlocked);
        }
      }
    }

    return newlyUnlocked;
  }

  /**
   * Evaluate plan-related badges
   */
  private async evaluatePlanBadges(
    userId: string,
    newPlan: 'free' | 'pro' | 'plus' | 'max'
  ): Promise<UserBadge[]> {
    const planBadges: Record<string, string> = {
      pro: 'pro_member',
      plus: 'plus_member',
      max: 'max_member',
    };

    const badgeId = planBadges[newPlan];
    if (!badgeId) return [];

    const unlocked = await this.unlockBadge(userId, badgeId, { new_plan: newPlan });
    return unlocked ? [unlocked] : [];
  }

  /**
   * Unlock a badge for a user (idempotent)
   */
  private async unlockBadge(
    userId: string,
    badgeId: string,
    payload?: BadgeEventPayload
  ): Promise<UserBadge | null> {
    try {
      // Check if already unlocked
      const { data: existing } = await supabaseAdmin
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_id', badgeId)
        .single();

      if (existing) {
        return null; // Already unlocked
      }

      // Insert new badge
      const { data, error } = await supabaseAdmin
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badgeId,
          first_event_payload: payload || {},
        })
        .select()
        .single();

      if (error) {
        console.error(`[BadgeService] Error unlocking badge ${badgeId}:`, error);
        return null;
      }

      console.log(`[BadgeService] Badge unlocked: ${badgeId} for user ${userId}`);
      return data;
    } catch (error) {
      console.error(`[BadgeService] Exception unlocking badge ${badgeId}:`, error);
      return null;
    }
  }

  /**
   * Get all badges for a user
   */
  async getUserBadges(userId: string): Promise<{
    unlocked: Array<Badge & { unlocked_at: string }>;
    locked: Badge[];
  }> {
    // Get all badges
    const { data: allBadges, error: badgesError } = await supabaseAdmin
      .from('badges')
      .select('*')
      .eq('is_active', true)
      .order('category');

    if (badgesError || !allBadges) {
      console.error('[BadgeService] Error fetching badges:', badgesError);
      return { unlocked: [], locked: [] };
    }

    // Get user's unlocked badges
    const { data: userBadges, error: userBadgesError } = await supabaseAdmin
      .from('user_badges')
      .select('badge_id, unlocked_at')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (userBadgesError) {
      console.error('[BadgeService] Error fetching user badges:', userBadgesError);
      return { unlocked: [], locked: allBadges };
    }

    const unlockedMap = new Map(userBadges?.map(ub => [ub.badge_id, ub.unlocked_at]) || []);

    const unlocked: Array<Badge & { unlocked_at: string }> = [];
    const locked: Badge[] = [];

    for (const badge of allBadges) {
      if (unlockedMap.has(badge.id)) {
        unlocked.push({ ...badge, unlocked_at: unlockedMap.get(badge.id)! });
      } else {
        locked.push(badge);
      }
    }

    return { unlocked, locked };
  }

  private getDefaultStats(): UserStats {
    return {
      total_completed_analyses: 0,
      total_long_text_analyses: 0,
      total_image_analyses: 0,
      consecutive_day_streak: 0,
      high_interest_count: 0,
      high_risk_count: 0,
      modes_used: new Set(),
    };
  }
}

export const badgeService = new BadgeService();
