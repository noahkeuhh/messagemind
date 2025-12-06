import { Router } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.js';
import { getUserById } from '../services/user.service.js';
import { stripe } from '../lib/stripe.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { config } from '../config/index.js';
import { z } from 'zod';

const router = Router();

// POST /api/user/subscribe
const subscribeSchema = z.object({
  tier: z.enum(['pro', 'max', 'vip']),
  interval: z.enum(['month', 'year']).default('month'),
});

router.post('/subscribe', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const validation = subscribeSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { tier, interval } = validation.data;

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: userId },
      });
      customerId = customer.id;

      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create subscription (you'll need to create prices in Stripe dashboard)
    // For now, using a placeholder approach
    const priceId = process.env[`STRIPE_PRICE_${tier.toUpperCase()}_${interval.toUpperCase()}`];

    if (!priceId) {
      return res.status(400).json({
        error: 'Subscription price not configured',
        message: `Please configure STRIPE_PRICE_${tier.toUpperCase()}_${interval.toUpperCase()} in environment variables`,
      });
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        user_id: userId,
        tier: tier,
      },
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    res.json({
      subscription_id: subscription.id,
      client_secret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/user/cancel_subscription
router.post('/cancel_subscription', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const user = await getUserById(userId);
    if (!user || !user.stripe_subscription_id) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel subscription immediately or at period end
    const cancelImmediately = req.body.immediate === true;

    if (cancelImmediately) {
      await stripe.subscriptions.cancel(user.stripe_subscription_id);
      
      await supabaseAdmin
        .from('users')
        .update({
          subscription_tier: 'free',
          daily_credits_limit: config.subscriptionTiers.free.dailyCreditsLimit,
          stripe_subscription_id: null,
        })
        .eq('id', userId);
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(user.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    res.json({
      message: cancelImmediately ? 'Subscription cancelled immediately' : 'Subscription will cancel at period end',
      cancelled_at_period_end: !cancelImmediately,
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;



