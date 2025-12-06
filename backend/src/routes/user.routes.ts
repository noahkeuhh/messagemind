import { Router } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.js';
import { getUserById, checkAndResetDailyCredits } from '../services/user.service.js';
import { atomicCreditDeduction } from '../services/atomic-credits.service.js';
import { canUseFreeAnalysis, markFreeAnalysisUsed } from '../services/user.service.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { stripe } from '../lib/stripe.js';
import { config } from '../config/index.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { idempotencyCheck } from '../middleware/idempotency.js';
import { z } from 'zod';

const router = Router();

// GET /api/user/credits
router.get('/credits', authenticateUser, rateLimit, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    
    // Check and reset daily credits if needed
    await checkAndResetDailyCredits(userId);
    
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user_id: user.id,
      credits_remaining: user.credits_remaining,
      daily_limit: user.daily_credits_limit,
      last_reset_date: user.last_reset_date,
      subscription_tier: user.subscription_tier,
    });
  } catch (error: any) {
    console.error('Error fetching credits:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/user/action (MessageMind - new implementation)
import { 
  calculateDynamicCredits, 
  generateAnalysisHash, 
  normalizeInputForHash,
  type AnalysisMode 
} from '../services/credit-scaling.service.js';
import { processAnalysisJob } from '../services/analysis-processor.service.js';

const actionSchema = z.object({
  user_id: z.string().uuid().optional(),
  input_text: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  mode: z.enum(['snapshot', 'expanded', 'deep']),
  use_premium: z.boolean().optional().default(false),
  modules: z.array(z.string()).optional().default([]),
  batch_inputs: z.array(z.any()).optional().default([]),
  idempotency_key: z.string().uuid().optional(),
  recompute: z.boolean().optional().default(false),
});

router.post('/action', authenticateUser, rateLimit, idempotencyCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const validation = actionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request body', details: validation.error });
    }

    const { 
      input_text, 
      images = [], 
      mode, 
      use_premium = false, 
      modules = [], 
      batch_inputs = [],
      recompute = false,
    } = validation.data;

    // Validate input exists
    if (!input_text && (!images || images.length === 0)) {
      return res.status(400).json({ 
        error: 'Either input_text or images array is required' 
      });
    }

    // Validate input length (MAX_INPUT_CHARS check)
    const inputText = input_text || '';
    const totalInputChars = inputText.length + (images.length * config.creditScaling.imageInputEquivChars);
    
    if (totalInputChars > config.creditScaling.maxInputChars) {
      return res.status(413).json({
        error: 'input_too_large',
        message: `Input exceeds maximum of ${config.creditScaling.maxInputChars} characters. Please shorten your input or upgrade to Deep/Batch processing.`,
        max_chars: config.creditScaling.maxInputChars,
        actual_chars: totalInputChars,
        upgrade_options: {
          shorten: 'Shorten your input',
          batch: 'Use batch processing (pay per item)',
          upgrade: 'Upgrade to Plus/Max tier',
        },
      });
    }

    // Check and reset daily credits if needed
    await checkAndResetDailyCredits(userId);

    // Get user
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check subscription tier limits
    const tier = config.subscriptionTiers[user.subscription_tier as keyof typeof config.subscriptionTiers];
    if (!tier) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    // Check batch limit
    const batchCount = batch_inputs.length > 0 ? batch_inputs.length : 1;
    if (batchCount > tier.batchLimit) {
      return res.status(403).json({
        error: 'batch_limit_exceeded',
        message: `Your tier allows max ${tier.batchLimit} batch inputs. Upgrade to increase limit.`,
        current_limit: tier.batchLimit,
        requested: batchCount,
      });
    }

    // Check deep mode access
    if (mode === 'deep' && !tier.deepAllowed) {
      return res.status(403).json({
        error: 'deep_mode_not_allowed',
        message: 'Deep mode requires Plus or Max tier. Upgrade to access.',
      });
    }

    // Check Free tier monthly limit
    const isFreeTier = user.subscription_tier === 'free';
    let canUseFree = false;
    if (isFreeTier) {
      // Free tier only allows snapshot mode
      if (mode !== 'snapshot') {
        return res.status(403).json({
          error: 'mode_not_allowed',
          message: 'Free tier only supports snapshot mode. Upgrade for expanded/deep modes.',
        });
      }
      canUseFree = await canUseFreeAnalysis(userId);
      if (!canUseFree) {
        return res.status(402).json({
          error: 'monthly_limit_reached',
          message: 'Je hebt je maandelijkse gratis analyse al gebruikt. Upgrade naar Pro voor meer analyses.',
          credits_needed: 0,
          credits_remaining: 0,
        });
      }
    }

    // Determine provider and model
    let provider: 'openai' = 'openai';
    let model = tier.aiModel;
    
    // Override: snapshot always uses GPT-3.5 (cost control)
    if (mode === 'snapshot') {
      model = 'gpt-3.5-turbo';
    }
    
    // Override: use_premium forces GPT-4
    if (use_premium) {
      model = 'gpt-4';
    }

    // Calculate credits using dynamic scaling
    const creditCalc = calculateDynamicCredits({
      mode,
      inputText,
      images,
      usePremium: use_premium,
      batchInputs: batch_inputs,
      modules,
      deepModeRequested: mode === 'deep',
    });

    const totalCredits = creditCalc.totalCredits;
    const creditsToDeduct = isFreeTier && canUseFree ? 0 : totalCredits;

    // Check cache (if not recomputing)
    if (!recompute && config.cache.enabled) {
      const normalizedInput = normalizeInputForHash(inputText);
      const analysisHash = generateAnalysisHash(userId, normalizedInput, mode, model, use_premium);
      
      const { data: cachedAnalysis } = await supabaseAdmin
        .from('analyses')
        .select('id, analysis_json, status, credits_charged')
        .eq('analysis_hash', analysisHash)
        .eq('status', 'done')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - config.cache.retentionDays * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (cachedAnalysis) {
        // Return cached result (no charge)
        return res.json({
          analysis_id: cachedAnalysis.id,
          status: 'done',
          analysis_json: cachedAnalysis.analysis_json,
          credits_charged: 0,
          credits_remaining: user.credits_remaining,
          cached: true,
          message: 'Cached result (no credits charged)',
        });
      }
    }

    // Check if user has enough credits (skip for free tier monthly analysis)
    if (!isFreeTier || !canUseFree) {
      if (user.credits_remaining < creditsToDeduct) {
        return res.status(402).json({
          error: 'insufficient_credits',
          message: 'Niet genoeg credits om deze analyse uit te voeren',
          credits_needed: creditsToDeduct,
          credits_remaining: user.credits_remaining,
          breakdown: creditCalc.breakdown,
        });
      }
    }

    // Atomic credit deduction (skip for free tier monthly analysis)
    let creditsResult;
    if (creditsToDeduct > 0) {
      try {
        creditsResult = await atomicCreditDeduction(
          userId,
          -creditsToDeduct,
          'action_spend',
          {
            mode,
            modules,
            batch_count: batchCount,
            use_premium: use_premium,
            breakdown: creditCalc.breakdown,
          }
        );
      } catch (error: any) {
        if (error.message === 'INSUFFICIENT_CREDITS') {
          return res.status(402).json({
            error: 'insufficient_credits',
            message: 'Niet genoeg credits om deze analyse uit te voeren',
            credits_needed: creditsToDeduct,
            credits_remaining: user.credits_remaining,
            breakdown: creditCalc.breakdown,
          });
        }
        throw error;
      }
    } else {
      // Free tier - mark free analysis as used
      await markFreeAnalysisUsed(userId);
      creditsResult = { success: true, credits_remaining: user.credits_remaining };
    }

    // Generate analysis hash
    const normalizedInput = normalizeInputForHash(inputText);
    const analysisHash = generateAnalysisHash(userId, normalizedInput, mode, model, use_premium);

    // Create analysis record (with fallback for missing columns)
    const analysisData: any = {
      user_id: userId,
      input_text: inputText || null,
      image_url: images.length > 0 ? images[0] : null,
      action_type: mode === 'snapshot' ? 'short_chat' : mode === 'expanded' ? 'long_chat' : 'image_analysis', // Legacy field
      provider_used: provider,
      credits_used: creditsToDeduct,
      status: 'queued',
    };

    // Add new MessageMind fields if they exist (after migration)
    try {
      analysisData.mode = mode;
      analysisData.model_version = model;
      analysisData.tokens_estimated = creditCalc.tokensEstimated;
      analysisData.analysis_hash = analysisHash;
      analysisData.use_premium = use_premium;
      analysisData.batch_count = batchCount;
      analysisData.modules = modules;
    } catch (e) {
      // Fields don't exist yet - will use legacy fields
      console.warn('New MessageMind fields not available, using legacy format');
    }

    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from('analyses')
      .insert(analysisData)
      .select()
      .single();

    if (analysisError || !analysis) {
      console.error('Failed to create analysis:', analysisError);
      console.error('Analysis data attempted:', {
        user_id: userId,
        mode,
        has_new_fields: 'mode' in analysisData,
      });
      
      // Check if it's a column error - suggest migration
      if (analysisError?.message?.includes('column') || analysisError?.code === '42703') {
        return res.status(500).json({ 
          error: 'Database migration required',
          message: 'Please run the migration: backend/src/db/migration_message_mind.sql in Supabase SQL Editor',
          details: analysisError?.message,
        });
      }
      
      // Refund credits if analysis creation fails
      if (creditsToDeduct > 0 && creditsResult.transaction_id) {
        try {
          await atomicCreditDeduction(userId, creditsToDeduct, 'refund', {
            reason: 'analysis_creation_failed',
            original_transaction_id: creditsResult.transaction_id,
          });
        } catch (refundError) {
          console.error('Failed to refund credits:', refundError);
        }
      }
      
      return res.status(500).json({ 
        error: 'Failed to create analysis',
        details: analysisError?.message || 'Unknown error',
      });
    }

    // Store idempotency response if applicable
    if ((req as any).storeIdempotencyResponse) {
      (req as any).storeIdempotencyResponse({
        analysis_id: analysis.id,
        status: 'queued',
        credits_charged: creditsToDeduct,
        credits_remaining: creditsResult.credits_remaining,
      });
    }

    // Process analysis asynchronously
    processAnalysisJob(
      analysis.id,
      inputText,
      images,
      mode,
      provider,
      model,
      userId,
      user.subscription_tier,
      creditsToDeduct,
      creditsResult.transaction_id
    ).catch(error => {
      console.error('Error processing analysis:', error);
      // Handle failure in processor
    });

    // Return 202 Accepted
    res.status(202).json({
      analysis_id: analysis.id,
      credits_charged: creditsToDeduct,
      credits_remaining: creditsResult.credits_remaining,
      queued: true,
      status: 'queued',
      breakdown: creditCalc.breakdown,
    });
  } catch (error: any) {
    console.error('Error in action endpoint:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/user/upgrade_prompt
const upgradePromptSchema = z.object({
  user_id: z.string().uuid().optional(),
  analysis_id: z.string().uuid(),
  target_provider: z.enum(['GPT-4', 'gpt-4']).optional().default('GPT-4'),
  extra_credits: z.number().optional(),
});

router.post('/upgrade_prompt', authenticateUser, rateLimit, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const validation = upgradePromptSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid request body', 
        details: validation.error.errors 
      });
    }

    const { analysis_id, target_provider, extra_credits } = validation.data;

    // Get analysis
    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from('analyses')
      .select('*')
      .eq('id', analysis_id)
      .eq('user_id', userId)
      .single();

    if (analysisError || !analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    // Check if analysis is in a state that can be upgraded
    if (analysis.status !== 'done' && analysis.status !== 'failed') {
      return res.status(400).json({
        error: 'invalid_status',
        message: 'Analysis must be completed or failed to upgrade',
        current_status: analysis.status,
      });
    }

    // Get user
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate upgrade cost (default: premium fee + base cost difference)
    const upgradeCost = extra_credits || (config.creditScaling.premiumFeeCredits + 10); // Default: 30 + 10 = 40 credits

    // Check if user has enough credits
    if (user.credits_remaining < upgradeCost) {
      return res.status(402).json({
        error: 'insufficient_credits',
        message: 'Niet genoeg credits om te upgraden naar GPT-4',
        credits_needed: upgradeCost,
        credits_remaining: user.credits_remaining,
      });
    }

    // Deduct credits
    const creditsResult = await atomicCreditDeduction(
      userId,
      -upgradeCost,
      'action_spend',
      {
        reason: 'upgrade_prompt',
        analysis_id: analysis_id,
        target_provider: target_provider,
      }
    );

    // Re-run analysis with GPT-4
    const inputText = analysis.input_text || '';
    const images = analysis.image_url ? [analysis.image_url] : [];
    const mode = (analysis.mode as AnalysisMode) || 'expanded';

    // Process with GPT-4
    await processAnalysisJob(
      analysis_id,
      inputText,
      images,
      mode,
      'openai',
      'gpt-4',
      userId,
      user.subscription_tier,
      upgradeCost,
      creditsResult.transaction_id
    );

    // Update analysis record
    await supabaseAdmin
      .from('analyses')
      .update({
        status: 'queued',
        use_premium: true,
        model_version: 'gpt-4',
        credits_used: (analysis.credits_used || 0) + upgradeCost,
      })
      .eq('id', analysis_id);

    res.json({
      analysis_id: analysis_id,
      status: 'queued',
      credits_charged: upgradeCost,
      credits_remaining: creditsResult.credits_remaining,
      message: 'Analysis upgraded to GPT-4 and queued for processing',
    });
  } catch (error: any) {
    console.error('Error in upgrade_prompt endpoint:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/user/buy_pack
const buyPackSchema = z.object({
  pack_id: z.string(),
});

router.post('/buy_pack', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const validation = buyPackSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { pack_id } = validation.data;

    // Get pack details
    const { data: pack, error: packError } = await supabaseAdmin
      .from('credit_packs')
      .select('*')
      .eq('id', pack_id)
      .eq('is_active', true)
      .single();

    if (packError || !pack) {
      return res.status(404).json({ error: 'Credit pack not found' });
    }

    // Get user
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: config.app.currency.toLowerCase(),
            product_data: {
              name: `${pack.credits} Credits`,
              description: `Credit pack: ${pack.credits} credits`,
            },
            unit_amount: pack.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin || 'http://localhost:5173'}/dashboard?payment=success`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/dashboard?payment=cancelled`,
      client_reference_id: userId,
      metadata: {
        pack_id: pack_id,
        credits: pack.credits.toString(),
        user_id: userId,
      },
    });

    res.json({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/user/buy_quick_pack (immediate payment)
router.post('/buy_quick_pack', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const validation = buyPackSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { pack_id } = validation.data;

    // Get pack details
    const { data: pack, error: packError } = await supabaseAdmin
      .from('credit_packs')
      .select('*')
      .eq('id', pack_id)
      .eq('is_active', true)
      .single();

    if (packError || !pack) {
      return res.status(404).json({ error: 'Credit pack not found' });
    }

    // Create PaymentIntent for immediate payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pack.price_cents,
      currency: config.app.currency.toLowerCase(),
      metadata: {
        pack_id: pack_id,
        credits: pack.credits.toString(),
        user_id: userId,
      },
    });

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/user/history
router.get('/history', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const { data: analyses, error, count } = await supabaseAdmin
      .from('analyses')
      .select('id, input_text, image_url, status, credits_used, created_at, analysis_result, provider_used', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      analyses: analyses || [],
      total: count || 0,
    });
  } catch (error: any) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/user/subscription
router.get('/subscription', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get subscription info from Stripe if exists
    let subscriptionInfo: any = null;
    if (user.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
        subscriptionInfo = {
          id: subscription.id,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
        };
      } catch (error) {
        console.error('Error fetching subscription from Stripe:', error);
      }
    }

    // Get payment method if customer exists
    let paymentMethod: any = null;
    if (user.stripe_customer_id) {
      try {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: user.stripe_customer_id,
          type: 'card',
        });
        if (paymentMethods.data.length > 0) {
          const pm = paymentMethods.data[0];
          paymentMethod = {
            type: pm.type,
            card: {
              brand: pm.card?.brand,
              last4: pm.card?.last4,
              exp_month: pm.card?.exp_month,
              exp_year: pm.card?.exp_year,
            },
          };
        }
      } catch (error) {
        console.error('Error fetching payment method:', error);
      }
    }

    // Get usage stats
    const { count: analysesCount } = await supabaseAdmin
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', new Date(new Date().setDate(1)).toISOString()); // This month

    const { data: transactions } = await supabaseAdmin
      .from('credits_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'action_spend')
      .gte('created_at', new Date(new Date().setDate(1)).toISOString());

    const creditsUsed = transactions?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

    res.json({
      subscription_tier: user.subscription_tier,
      subscription_info: subscriptionInfo,
      payment_method: paymentMethod,
      usage: {
        analyses_this_month: analysesCount || 0,
        credits_used_this_month: creditsUsed,
      },
    });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/user/billing_portal
router.get('/billing_portal', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const user = await getUserById(userId);
    
    if (!user || !user.stripe_customer_id) {
      return res.status(404).json({ error: 'No Stripe customer found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${req.headers.origin || 'http://localhost:8080'}/dashboard/settings?tab=billing`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating billing portal session:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/user/data/export
router.get('/data/export', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // Get all user data
    const [user, analyses, transactions, savedReplies] = await Promise.all([
      supabaseAdmin.from('users').select('*').eq('id', userId).single(),
      supabaseAdmin.from('analyses').select('*').eq('user_id', userId),
      supabaseAdmin.from('credits_transactions').select('*').eq('user_id', userId),
      supabaseAdmin.from('saved_replies').select('*').eq('user_id', userId),
    ]);

    const exportData = {
      user: user.data,
      analyses: analyses.data || [],
      transactions: transactions.data || [],
      saved_replies: savedReplies.data || [],
      exported_at: new Date().toISOString(),
    };

    res.json(exportData);
  } catch (error: any) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// DELETE /api/user
router.delete('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // Cancel subscription if exists
    const user = await getUserById(userId);
    if (user?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(user.stripe_subscription_id);
      } catch (error) {
        console.error('Error cancelling subscription:', error);
      }
    }

    // Delete user data (cascade will handle related records)
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    res.json({ message: 'Account deletion initiated. Please contact support to complete.' });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/user/analysis/:id (MessageMind format)
router.get('/analysis/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const analysisId = req.params.id;

    const { data: analysis, error } = await supabaseAdmin
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (error || !analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    // Return in MessageMind format
    res.json({
      status: analysis.status,
      analysis_json: analysis.analysis_json || analysis.analysis_result,
      provider_used: analysis.provider_used,
      credits_charged: analysis.credits_used,
      tokens_actual: analysis.tokens_actual || analysis.tokens_used,
      mode: analysis.mode,
      created_at: analysis.created_at,
      updated_at: analysis.updated_at,
    });
  } catch (error: any) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/user/save_reply
const saveReplySchema = z.object({
  reply_text: z.string().min(1),
  reply_type: z.string().optional(),
  analysis_id: z.string().uuid().optional(),
});

router.post('/save_reply', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const validation = saveReplySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { reply_text, reply_type, analysis_id } = validation.data;

    const { data: savedReply, error } = await supabaseAdmin
      .from('saved_replies')
      .insert({
        user_id: userId,
        reply_text,
        reply_type: reply_type || null,
        analysis_id: analysis_id || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(savedReply);
  } catch (error: any) {
    console.error('Error saving reply:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/user/saved_replies
router.get('/saved_replies', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const { data: replies, error } = await supabaseAdmin
      .from('saved_replies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ replies: replies || [] });
  } catch (error: any) {
    console.error('Error fetching saved replies:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// DELETE /api/user/saved_reply/:id
router.delete('/saved_reply/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const replyId = req.params.id;

    // Verify reply belongs to user
    const { data: reply, error: fetchError } = await supabaseAdmin
      .from('saved_replies')
      .select('id')
      .eq('id', replyId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !reply) {
      return res.status(404).json({ error: 'Saved reply not found' });
    }

    // Delete reply
    const { error: deleteError } = await supabaseAdmin
      .from('saved_replies')
      .delete()
      .eq('id', replyId)
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    res.json({ success: true, message: 'Saved reply deleted' });
  } catch (error: any) {
    console.error('Error deleting saved reply:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;


