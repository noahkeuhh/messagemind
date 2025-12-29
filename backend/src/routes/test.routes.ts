import { Router } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.js';
import { callAI } from '../services/ai-providers.service.js';
import { config } from '../config/index.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

// GET /api/test/mock-analysis
// Test endpoint - uses real AI providers (no mock data)
router.get('/mock-analysis', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const inputText = req.query.text as string || 'Hey, how are you?';
    const provider = (req.query.provider as 'cohere' | 'openai' | 'claude' | 'groq') || 'groq';
    const actionType = (req.query.action_type as 'short_chat' | 'long_chat' | 'image_analysis') || 'short_chat';

    // Call AI with real providers (mock mode removed)
    const result = await callAI({
      provider: provider as any,
      model: provider === 'groq' ? 'llama3-8b-8192' : 'gpt-3.5-turbo',
      inputText,
      actionType,
      subscriptionTier: 'pro',
    });

    res.json({
      provider,
      action_type: actionType,
      input_text: inputText,
      result,
      note: 'This is a test endpoint. No credits were used.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/test/concurrent-actions
// Test endpoint to simulate concurrent action calls and validate atomicity
router.post('/concurrent-actions', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { count = 5 } = req.body;

    // This endpoint is for testing atomic credit operations
    // In production, this should be admin-only or removed
    if (config.app.nodeEnv === 'production') {
      return res.status(403).json({ error: 'Test endpoints disabled in production' });
    }

    const results = [];
    const promises = [];

    for (let i = 0; i < count; i++) {
      promises.push(
        fetch(`http://localhost:${config.app.port}/api/user/action`, {
          method: 'POST',
          headers: {
            'Authorization': req.headers.authorization || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action_type: 'short_chat',
            input_text: `Test message ${i}`,
          }),
        }).then(r => r.json())
      );
    }

    const responses = await Promise.all(promises);
    
    res.json({
      message: `Sent ${count} concurrent requests`,
      responses,
      note: 'Check database to verify atomic credit operations',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/test/providers
// Test all AI providers
router.get('/providers', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const inputText = req.query.text as string || 'Hey, how are you?';
    const actionType = (req.query.action_type as 'short_chat' | 'long_chat' | 'image_analysis') || 'short_chat';

    const providers: Array<'cohere' | 'openai' | 'claude' | 'groq'> = ['groq', 'openai'];
    const results: any = {};

    for (const provider of providers) {
      try {
        const result = await callAI({
          provider: provider as any,
          model: provider === 'groq' ? 'llama-3.3-70b-versatile'
          : 'llama-3.3-70b-versatile',
          inputText,
          actionType,
          subscriptionTier: 'pro',
        });
        results[provider] = {
          success: true,
          tokens_used: result.tokens_used,
          intent: result.intent,
        };
      } catch (error: any) {
        results[provider] = {
          success: false,
          error: error.message,
        };
      }
    }

    res.json({
      input_text: inputText,
      action_type: actionType,
      providers: results,
      note: 'This endpoint tests all providers. No credits used.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/test/set-user-tier (Development/Testing only)
// Set the current user's subscription tier for testing deep mode
router.post('/set-user-tier', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    // Only allow in development mode
    if (config.app.nodeEnv === 'production') {
      return res.status(403).json({ error: 'Test endpoints disabled in production' });
    }

    const userId = req.user!.id;
    const { tier } = req.body;

    if (!['free', 'pro', 'plus', 'max'].includes(tier)) {
      return res.status(400).json({ 
        error: 'Invalid tier',
        message: 'Tier must be one of: free, pro, plus, max',
        received: tier
      });
    }

    // Update user tier
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ subscription_tier: tier })
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      console.error('[Test] Error updating user tier:', error);
      return res.status(500).json({ 
        error: 'Failed to update user tier',
        details: error?.message 
      });
    }

    console.log(`[Test] User ${userId} tier changed to ${tier}`);

    res.json({
      message: 'User tier updated successfully',
      user_id: userId,
      new_tier: data.subscription_tier,
      daily_credits_limit: data.daily_credits_limit,
      credits_remaining: data.credits_remaining,
    });
  } catch (error: any) {
    console.error('[Test] Error in set-user-tier:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/test/trigger-badge-eval
// Test endpoint - manually trigger badge evaluation
router.post('/trigger-badge-eval', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Dynamically import badge service to avoid circular dependencies
    const { badgeService } = await import('../services/badge.service.js');

    const eventType = req.body.event_type || 'analysis_completed';
    const payload = req.body.payload || {};

    console.log(`[Test] Manually triggering badge evaluation for user ${userId}, event: ${eventType}`);
    
    const result = await badgeService.evaluateBadgesForEvent(userId, eventType, payload);

    res.json({
      message: 'Badge evaluation completed',
      user_id: userId,
      event_type: eventType,
      new_unlocks: result.newUnlocks || [],
      total_unlocked: result.totalUnlocked || 0,
    });
  } catch (error: any) {
    console.error('[Test] Error in trigger-badge-eval:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;


