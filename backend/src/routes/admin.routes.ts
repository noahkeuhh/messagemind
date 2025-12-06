import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

// GET /api/admin/metrics
router.get('/metrics', requireAdmin, async (req, res) => {
  try {
    const dateFrom = req.query.date_from as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = req.query.date_to as string || new Date().toISOString().split('T')[0];

    // Get metrics from admin_metrics table
    const { data: metrics, error: metricsError } = await supabaseAdmin
      .from('admin_metrics')
      .select('*')
      .gte('date', dateFrom)
      .lte('date', dateTo)
      .order('date', { ascending: false });

    if (metricsError) {
      throw metricsError;
    }

    // Get user stats
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gt('credits_remaining', 0);

    // Aggregate metrics (MessageMind format)
    const aggregated = {
      total_users: totalUsers || 0,
      active_users: activeUsers || 0,
      total_credits_sold: metrics?.reduce((sum, m) => sum + (m.total_credits_sold || 0), 0) || 0,
      revenue_cents: metrics?.reduce((sum, m) => sum + (m.revenue_cents || 0), 0) || 0,
      ai_tokens_used_by_provider: {
        openai: metrics?.reduce((sum, m) => sum + (m.openai_tokens_used || 0), 0) || 0,
        cohere: metrics?.reduce((sum, m) => sum + (m.cohere_tokens_used || 0), 0) || 0,
        claude: metrics?.reduce((sum, m) => sum + (m.claude_tokens_used || 0), 0) || 0,
        total: metrics?.reduce((sum, m) => sum + (m.total_ai_tokens_used || 0), 0) || 0,
      },
      total_analyses: metrics?.reduce((sum, m) => sum + (m.total_analyses || 0), 0) || 0,
      failed_analyses: metrics?.reduce((sum, m) => sum + (m.failed_analyses || 0), 0) || 0,
      daily_breakdown: metrics || [],
    };

    // Calculate averages
    const days = Math.max(1, Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (24 * 60 * 60 * 1000)));
    aggregated.average_credits_per_user_per_day = aggregated.total_credits_sold / Math.max(1, activeUsers || 1) / days;
    aggregated.average_revenue_per_day = aggregated.total_revenue_cents / days;

    res.json(aggregated);
  } catch (error: any) {
    console.error('Error fetching admin metrics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/admin/users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, subscription_tier, credits_remaining, daily_credits_limit, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({ users: users || [] });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/admin/adjust_credits
router.post('/adjust_credits', requireAdmin, async (req, res) => {
  try {
    const { user_id, amount, reason } = req.body;

    if (!user_id || typeof amount !== 'number') {
      return res.status(400).json({ error: 'user_id and amount are required' });
    }

    const { updateUserCredits } = await import('../services/user.service.js');

    await updateUserCredits(
      user_id,
      amount,
      'admin_adjust',
      { reason: reason || 'Admin adjustment' }
    );

    res.json({ success: true, message: 'Credits adjusted' });
  } catch (error: any) {
    console.error('Error adjusting credits:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;

