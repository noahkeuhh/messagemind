import { Router } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.js';
import { getUserById, checkAndResetDailyCredits, canUseFreeAnalysis, markFreeAnalysisUsed } from '../services/user.service.js';
import { atomicCreditDeduction } from '../services/atomic-credits.service.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { config } from '../config/index.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { idempotencyCheck } from '../middleware/idempotency.js';
import { z } from 'zod';
import { 
  calculateDynamicCredits, 
  generateAnalysisHash, 
  normalizeInputForHash,
  type AnalysisMode 
} from '../services/credit-scaling.service.js';
import { processAnalysisJob } from '../services/analysis-processor.service.js';

const router = Router();

// POST /api/user/action (MessageMind specification)
const actionSchema = z.object({
  user_id: z.string().uuid().optional(), // Optional, will use authenticated user
  input_text: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  mode: z.enum(['snapshot', 'expanded', 'deep']),
  use_premium: z.boolean().optional().default(false),
  modules: z.array(z.string()).optional().default([]),
  batch_inputs: z.array(z.any()).optional().default([]),
  idempotency_key: z.string().uuid().optional(),
  recompute: z.boolean().optional().default(false), // Force recompute even if cached
});

router.post('/action', authenticateUser, rateLimit, idempotencyCheck, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const validation = actionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid request body', 
        details: validation.error.errors 
      });
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

    // Create analysis record
    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from('analyses')
      .insert({
        user_id: userId,
        input_text: inputText || null,
        image_url: images.length > 0 ? images[0] : null, // Store first image URL
        mode,
        provider_used: provider,
        model_version: model,
        credits_used: creditsToDeduct,
        tokens_estimated: creditCalc.tokensEstimated,
        analysis_hash: analysisHash,
        use_premium: use_premium,
        batch_count: batchCount,
        modules: modules,
        status: 'queued',
      })
      .select()
      .single();

    if (analysisError || !analysis) {
      console.error('Failed to create analysis:', analysisError);
      
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

export default router;

