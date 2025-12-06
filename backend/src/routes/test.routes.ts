import { Router } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.js';
import { callAI } from '../services/ai-providers.service.js';
import { config } from '../config/index.js';

const router = Router();

// GET /api/test/mock-analysis
// Test endpoint to simulate AI analysis without using credits
router.get('/mock-analysis', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const inputText = req.query.text as string || 'Hey, how are you?';
    const provider = (req.query.provider as 'cohere' | 'openai' | 'claude') || 'cohere';
    const actionType = (req.query.action_type as 'short_chat' | 'long_chat' | 'image_analysis') || 'short_chat';

    // Call AI (will use mock if not configured)
    const result = await callAI({
      provider,
      inputText,
      actionType,
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

    const providers: Array<'cohere' | 'openai' | 'claude'> = ['cohere', 'openai', 'claude'];
    const results: any = {};

    for (const provider of providers) {
      try {
        const result = await callAI({
          provider,
          inputText,
          actionType,
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

export default router;


