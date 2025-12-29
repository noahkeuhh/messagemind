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
  provider: AIProvider | 'groq', // Allow 'groq' as provider
  model: string,
  userId: string,
  subscriptionTier: string,
  initialCredits: number,
  transactionId?: string,
  options?: { expandedToggle?: boolean; explanationToggle?: boolean }
): Promise<void> {
  console.log(`[AnalysisProcessor] Starting analysis ${analysisId}`, {
    mode,
    provider,
    model,
    hasText: !!inputText,
    textLength: inputText?.length || 0,
    imageCount: images.length,
  });
  console.log(`[AnalysisProcessor] MODEL USED: ${model}`);
  console.log(`[AnalysisProcessor] LIVE AI CALL - Starting processing`);

  try {
    // Update status to processing
    const { error: updateError } = await supabaseAdmin
      .from('analyses')
      .update({ status: 'processing' })
      .eq('id', analysisId);
    
    if (updateError) {
      console.error(`[AnalysisProcessor] Failed to update status to processing:`, updateError);
      throw new Error(`Failed to update analysis status: ${updateError.message}`);
    }
    
    console.log(`[AnalysisProcessor] Status updated to processing for ${analysisId}`);

    // Get prompt template for mode with tier-based detail density
    const promptTemplate = getPromptTemplate(
      mode,
      subscriptionTier as 'free' | 'pro' | 'plus' | 'max',
      { explanationToggle: options?.explanationToggle === true }
    );
    
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

    // Call AI provider with the correct prompt template
    console.log(`[AnalysisProcessor] Calling AI provider ${provider} with model ${model}`);
    console.log(`[AnalysisProcessor] LIVE AI CALL - Model: ${model}, Mode: ${mode}`);
    
    // Add timeout wrapper (60 seconds max)
    const aiCallPromise = callAI({
      provider,
      model,
      inputText,
      imageUrl: images.length > 0 ? images[0] : undefined,
      actionType: mode === 'snapshot' ? 'short_chat' : mode === 'expanded' ? 'long_chat' : 'image_analysis',
      subscriptionTier,
      mode, // Pass the actual mode (snapshot/expanded/deep)
      maxTokens: promptTemplate.maxTokens,
      temperature: promptTemplate.temperature,
      systemPrompt: promptTemplate.system, // Pass the correct prompt template
    });
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI call timeout after 60 seconds')), 60000);
    });
    
    const result = await Promise.race([aiCallPromise, timeoutPromise]);
    console.log(`[AnalysisProcessor] AI call completed, tokens used: ${result.tokens_used}`);

    // Get the full JSON response from AI (always includes interest_level)
    // The result from callAI is already parsed and includes interest_level (default 50% if not provided by AI)
    const updateData: any = {
      status: 'done',
      analysis_result: result, // Legacy field (always exists)
      tokens_used: result.tokens_used,
    };

    // Add new MessageMind fields - store full JSON response (always includes interest_level)
    updateData.analysis_json = result;
    updateData.tokens_actual = result.tokens_used;
    
    // Always store interest_level (it's guaranteed to be present in result)
    updateData.interest_level = result.interest_level;

    const { error: finalUpdateError } = await supabaseAdmin
      .from('analyses')
      .update(updateData)
      .eq('id', analysisId);
    
    if (finalUpdateError) {
      console.error(`[AnalysisProcessor] Failed to update analysis with result:`, finalUpdateError);
      throw new Error(`Failed to save analysis result: ${finalUpdateError.message}`);
    }

    // Update admin metrics (don't fail if this errors)
    try {
      await updateAdminMetricsForAI(provider, result.tokens_used);
    } catch (metricsError) {
      console.error(`[AnalysisProcessor] Failed to update admin metrics (non-critical):`, metricsError);
    }

    console.log(`[AnalysisProcessor] Analysis ${analysisId} completed successfully`);
    console.log(`[AnalysisProcessor] CREDITS DEDUCTED: ${initialCredits} credits were deducted before AI call`);

    // Evaluate badges after successful analysis (async, don't block)
    try {
      const { badgeService } = await import('./badge.service.js');
      badgeService.evaluateBadgesForEvent(userId, 'analysis_completed', {
        analysis_id: analysisId,
        mode_used: mode,
        text_length: inputText?.length || 0,
        hasImages: images.length > 0,
        interest_level: parseInt(result.interest_level as string) || 0,
        emotional_risk: result.emotional_risk,
        timestamp: new Date().toISOString(),
      }).catch(badgeError => {
        console.error(`[AnalysisProcessor] Badge evaluation error (non-critical):`, badgeError);
      });
    } catch (badgeImportError) {
      console.error(`[AnalysisProcessor] Failed to import badge service:`, badgeImportError);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error(`[AnalysisProcessor] Error processing analysis ${analysisId}:`, {
      error: errorMessage,
      stack: errorStack,
      provider,
      model,
      mode,
      userId,
      inputLength: inputText?.length || 0,
      hasImages: images?.length > 0,
    });
    
    // Provide helpful error message for missing API key
    if (errorMessage.includes('not configured') || errorMessage.includes('API key')) {
      console.error(`[AnalysisProcessor] ⚠️  MISSING API KEY: Please set OPENAI_API_KEY in backend/.env file`);
      console.error(`[AnalysisProcessor] Get your API key from: https://platform.openai.com/api-keys`);
    }
    
    // Update status to failed
    const updateData: any = { status: 'failed' };
    
    // Try to store error message if column exists (don't fail if it doesn't)
    try {
      const { data: columns } = await supabaseAdmin
        .from('analyses')
        .select('*')
        .limit(0);
      // If we can query, try to update with error message
      // Note: This is a best-effort attempt - if column doesn't exist, it will just be ignored
      updateData.error_message = errorMessage.substring(0, 500); // Limit length
    } catch (e) {
      // Column might not exist, that's okay
    }
    
    await supabaseAdmin
      .from('analyses')
      .update(updateData)
      .eq('id', analysisId);

    // Auto-refund if enabled
    if (config.autoRefundOnFail && initialCredits > 0) {
      try {
        await atomicCreditDeduction(userId, initialCredits, 'refund', {
          reason: 'ai_processing_failed',
          analysis_id: analysisId,
          original_transaction_id: transactionId,
          error: errorMessage,
        });
        console.log(`[AnalysisProcessor] Refunded ${initialCredits} credits to user ${userId} for failed analysis ${analysisId}`);
      } catch (refundError) {
        console.error('[AnalysisProcessor] Failed to refund credits on analysis failure:', refundError);
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

  // Track per-provider tokens (cast provider to any to support future providers)
  const providerStr = provider as string;
  if (providerStr === 'cohere') {
    updates.cohere_tokens_used = (existing?.cohere_tokens_used || 0) + tokensUsed;
  } else if (providerStr === 'openai') {
    updates.openai_tokens_used = (existing?.openai_tokens_used || 0) + tokensUsed;
  } else if (providerStr === 'claude') {
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

