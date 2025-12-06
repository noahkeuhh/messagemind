import { Router, Request, Response } from 'express';
import { stripe, verifyWebhookSignature } from '../lib/stripe.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { updateUserCredits } from '../services/user.service.js';
import { config } from '../config/index.js';

const router = Router();

// POST /api/webhook/stripe
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    return res.status(400).send('Missing stripe-signature header');
  }

  // req.body is already a Buffer from express.raw()
  const payload = req.body;

  let event;
  try {
    event = verifyWebhookSignature(payload, sig);
    if (!event) {
      return res.status(400).send('Invalid signature');
    }
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Check for idempotency
  const { data: existingEvent } = await supabaseAdmin
    .from('stripe_webhook_events')
    .select('id, processed')
    .eq('id', event.id)
    .single();

  if (existingEvent) {
    if (existingEvent.processed) {
      console.log(`Event ${event.id} already processed`);
      return res.json({ received: true, already_processed: true });
    }
  } else {
    // Store event
    await supabaseAdmin
      .from('stripe_webhook_events')
      .insert({
        id: event.id,
        event_type: event.type,
        payload: event.data.object as any,
      });
  }

  try {
    // Handle event
    await handleStripeEvent(event);
    
    // Mark as processed
    await supabaseAdmin
      .from('stripe_webhook_events')
      .update({ processed: true })
      .eq('id', event.id);

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook event:', error);
    res.status(500).json({ error: error.message });
  }
});

async function handleStripeEvent(event: any) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;

    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object);
      break;

    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function handleCheckoutCompleted(session: any) {
  const userId = session.client_reference_id || session.metadata?.user_id;
  const packId = session.metadata?.pack_id;

  if (!userId || !packId) {
    console.error('Missing userId or packId in checkout session');
    return;
  }

  // Get pack details
  const { data: pack } = await supabaseAdmin
    .from('credit_packs')
    .select('credits, bonus_credits')
    .eq('id', packId)
    .single();

  if (!pack) {
    console.error('Pack not found:', packId);
    return;
  }

  const totalCredits = pack.credits + (pack.bonus_credits || 0);

  // Add credits to user
  await updateUserCredits(
    userId,
    totalCredits,
    'purchase',
    {
      pack_id: packId,
      stripe_payment_id: session.payment_intent || session.id,
      amount_cents: session.amount_total,
    }
  );

  // Update admin metrics
  await updateAdminMetrics({
    total_credits_sold: totalCredits,
    revenue_cents: session.amount_total,
  });
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  const userId = paymentIntent.metadata?.user_id;
  const packId = paymentIntent.metadata?.pack_id;

  if (!userId || !packId) {
    return;
  }

  // Get pack details
  const { data: pack } = await supabaseAdmin
    .from('credit_packs')
    .select('credits, bonus_credits')
    .eq('id', packId)
    .single();

  if (!pack) {
    return;
  }

  const totalCredits = pack.credits + (pack.bonus_credits || 0);

  // Add credits to user
  await updateUserCredits(
    userId,
    totalCredits,
    'purchase',
    {
      pack_id: packId,
      stripe_payment_id: paymentIntent.id,
      amount_cents: paymentIntent.amount,
    }
  );

  // Update admin metrics
  await updateAdminMetrics({
    total_credits_sold: totalCredits,
    revenue_cents: paymentIntent.amount,
  });
}

async function handleInvoicePaid(invoice: any) {
  // Handle subscription invoice payment
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.user_id;

  if (userId) {
    // Update user's subscription status
    await supabaseAdmin
      .from('users')
      .update({
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
      })
      .eq('id', userId);
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  // Handle failed subscription payment
  console.log('Invoice payment failed:', invoice.id);
  // Could send notification or downgrade user
}

async function handleSubscriptionUpdated(subscription: any) {
  const userId = subscription.metadata?.user_id;
  const priceId = subscription.items.data[0]?.price.id;

  if (!userId) {
    return;
  }

  // Determine tier from price or metadata
  const tier = subscription.metadata?.tier || 'pro';

  // Update user subscription
  const tierConfig = config.subscriptionTiers[tier as keyof typeof config.subscriptionTiers] || config.subscriptionTiers.pro;

  await supabaseAdmin
    .from('users')
    .update({
      subscription_tier: tier,
      daily_credits_limit: tierConfig.dailyCreditsLimit,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
    })
    .eq('id', userId);
}

async function handleSubscriptionDeleted(subscription: any) {
  const userId = subscription.metadata?.user_id;

  if (userId) {
    // Downgrade to free tier
    await supabaseAdmin
      .from('users')
      .update({
        subscription_tier: 'free',
        daily_credits_limit: config.subscriptionTiers.free.dailyCreditsLimit,
        stripe_subscription_id: null,
      })
      .eq('id', userId);
  }
}

async function updateAdminMetrics(updates: {
  total_credits_sold?: number;
  revenue_cents?: number;
}) {
  const today = new Date().toISOString().split('T')[0];

  // Get or create today's metrics
  const { data: existing } = await supabaseAdmin
    .from('admin_metrics')
    .select('*')
    .eq('date', today)
    .single();

  if (existing) {
    await supabaseAdmin
      .from('admin_metrics')
      .update({
        total_credits_sold: (existing.total_credits_sold || 0) + (updates.total_credits_sold || 0),
        revenue_cents: (existing.revenue_cents || 0) + (updates.revenue_cents || 0),
        updated_at: new Date().toISOString(),
      })
      .eq('date', today);
  } else {
    await supabaseAdmin
      .from('admin_metrics')
      .insert({
        date: today,
        total_credits_sold: updates.total_credits_sold || 0,
        revenue_cents: updates.revenue_cents || 0,
      });
  }
}

export default router;

