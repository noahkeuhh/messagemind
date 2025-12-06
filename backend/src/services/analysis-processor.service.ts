import { supabaseAdmin } from '../lib/supabase.js';
import { config } from '../config/index.js';
import { callAI, type AIProvider } from './ai-providers.service.js';
import { getPromptTemplate, buildUserMessage } from './prompt-templates.service.js';
import { atomicCreditDeduction } from './atomic-credits.service.js';
import type { AnalysisMode } from './credit-scaling.service.js';

/**
 * Process analysis job asynchronously
 */
export async function processAnalysisJob(
  analysisId: string,
  inputText: string,
  images: string[],
  mode: AnalysisMode,
  provider: AIProvider,
  model: string,
  userId: string,
  subscriptionTier: string,
  initialCredits: number,
  transactionId?: string
): Promise<void> {
  try {
    // Update status to processing
    await supabaseAdmin
      .from('analyses')
      .update({ status: 'processing' })
      .eq('id', analysisId);

    // Get prompt template for mode
    const promptTemplate = getPromptTemplate(mode);
    
    // Build messages
    const messages: any[] = [
      {
        role: 'system',
        content: promptTemplate.system,
      },
      {
        role: 'user',
        content: buildUserMessage(inputText, images),
      },
    ];

    // Call AI provider
    const result = await callAI({
      provider,
      model,
      inputText,
      imageUrl: images.length > 0 ? images[0] : undefined,
      actionType: mode === 'snapshot' ? 'short_chat' : mode === 'expanded' ? 'long_chat' : 'image_analysis',
      subscriptionTier,
      maxTokens: promptTemplate.maxTokens,
      temperature: promptTemplate.temperature,
    });

    // Update analysis with result (with fallback for missing columns)
    const updateData: any = {
      status: 'done',
      analysis_result: result, // Legacy field (always exists)
      tokens_used: result.tokens_used,
    };

    // Add new MessageMind fields if they exist
    try {
      updateData.analysis_json = result;
      updateData.tokens_actual = result.tokens_used;
    } catch (e) {
      // Fields don't exist yet - will use legacy fields only
    }

    await supabaseAdmin
      .from('analyses')
      .update(updateData)
      .eq('id', analysisId);

    // Update admin metrics
    await updateAdminMetricsForAI(provider, result.tokens_used);

    console.log(`Analysis ${analysisId} completed successfully`);
  } catch (error) {
    console.error(`Error processing analysis ${analysisId}:`, error);
    
    // Update status to failed
    await supabaseAdmin
      .from('analyses')
      .update({ status: 'failed' })
      .eq('id', analysisId);

    // Auto-refund if enabled
    if (config.autoRefundOnFail && initialCredits > 0) {
      try {
        await atomicCreditDeduction(userId, initialCredits, 'refund', {
          reason: 'ai_processing_failed',
          analysis_id: analysisId,
          original_transaction_id: transactionId,
        });
        console.log(`Refunded ${initialCredits} credits to user ${userId} for failed analysis ${analysisId}`);
      } catch (refundError) {
        console.error('Failed to refund credits on analysis failure:', refundError);
      }
    }
    
    throw error;
  }
}

/**
 * Update admin metrics for AI usage
 */
async function updateAdminMetricsForAI(provider: AIProvider, tokensUsed: number) {
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabaseAdmin
    .from('admin_metrics')
    .select('*')
    .eq('date', today)
    .single();

  const updates: any = {
    total_ai_tokens_used: (existing?.total_ai_tokens_used || 0) + tokensUsed,
    total_analyses: (existing?.total_analyses || 0) + 1,
  };

  // Track per-provider tokens
  if (provider === 'cohere') {
    updates.cohere_tokens_used = (existing?.cohere_tokens_used || 0) + tokensUsed;
  } else if (provider === 'openai') {
    updates.openai_tokens_used = (existing?.openai_tokens_used || 0) + tokensUsed;
  } else if (provider === 'claude') {
    updates.claude_tokens_used = (existing?.claude_tokens_used || 0) + tokensUsed;
  }

  if (existing) {
    await supabaseAdmin
      .from('admin_metrics')
      .update(updates)
      .eq('date', today);
  } else {
    await supabaseAdmin
      .from('admin_metrics')
      .insert({
        date: today,
        ...updates,
      });
  }
}

