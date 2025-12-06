import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory (where npm scripts run from)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },

  // AI Providers
  ai: {
    cohere: {
      apiKey: process.env.COHERE_API_KEY || '',
      baseUrl: 'https://api.cohere.ai/v1',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: 'https://api.openai.com/v1',
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY || '',
      baseUrl: 'https://api.anthropic.com/v1',
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
    },
    // Legacy support
    serviceKey: process.env.AI_SERVICE_KEY || '',
    serviceUrl: process.env.AI_SERVICE_URL || 'https://api.openai.com/v1',
    model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
  },

  // Application
  app: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    currency: process.env.CURRENCY || 'EUR',
    creditTokenRatio: parseInt(process.env.CREDIT_TOKEN_RATIO || '20', 10),
  },

  // Admin
  admin: {
    apiKey: process.env.ADMIN_API_KEY || '',
  },

  // Cron
  cron: {
    dailyResetTime: process.env.DAILY_RESET_TIME || '00:00:00',
    dailyResetTimezone: process.env.DAILY_RESET_TIMEZONE || 'Europe/Amsterdam',
  },

  // Base credits per mode (MessageMind specification)
  baseCredits: {
    snapshot: 5,
    expanded: 12,
    deep: 30,
  },

  // Subscription tiers with pricing and AI model routing (updated for MessageMind)
  subscriptionTiers: {
    free: { 
      dailyCreditsLimit: 0, // No daily credits, only monthly free analysis
      monthlyFreeAnalyses: 1, // 1 free snapshot per month
      name: 'Free',
      priceCents: 0,
      aiModel: 'gpt-3.5-turbo' as const,
      provider: 'openai' as const,
      batchLimit: 1,
      deepAllowed: false,
    },
    pro: { 
      dailyCreditsLimit: 100, // 3,000 credits/month
      monthlyFreeAnalyses: 0,
      name: 'Pro',
      priceCents: 1600, // €16/month
      aiModel: 'gpt-3.5-turbo' as const,
      provider: 'openai' as const,
      batchLimit: 1,
      deepAllowed: false,
    },
    plus: { 
      dailyCreditsLimit: 180, // 5,400 credits/month
      monthlyFreeAnalyses: 0,
      name: 'Plus',
      priceCents: 3000, // €30/month
      aiModel: 'gpt-4' as const,
      provider: 'openai' as const,
      batchLimit: 3,
      deepAllowed: true, // Limited to 200 output tokens
    },
    max: { 
      dailyCreditsLimit: 300, // 9,000 credits/month
      monthlyFreeAnalyses: 0,
      name: 'Max',
      priceCents: 4900, // €49/month
      aiModel: 'gpt-4' as const,
      provider: 'openai' as const,
      batchLimit: 10,
      deepAllowed: true, // Unlimited
    },
  },

  // Dynamic credit scaling parameters
  creditScaling: {
    // Input-based scaling
    inputBaseThresholdChars: parseInt(process.env.INPUT_BASE_THRESHOLD_CHARS || '200', 10),
    inputChunkChars: parseInt(process.env.INPUT_CHUNK_CHARS || '100', 10),
    imageInputEquivChars: 1000, // Each image counts as 1000 chars
    
    // Output-based scaling
    outputBaselineTokens: {
      snapshot: parseInt(process.env.OUTPUT_BASELINE_SNAPSHOT || '100', 10),
      expanded: parseInt(process.env.OUTPUT_BASELINE_EXPANDED || '200', 10),
      deep: parseInt(process.env.OUTPUT_BASELINE_DEEP || '600', 10),
    },
    outputChunkTokens: parseInt(process.env.OUTPUT_CHUNK_TOKENS || '80', 10),
    
    // Mode multipliers
    deepMultiplier: 1.2,
    
    // Premium upgrade
    premiumFeeCredits: parseInt(process.env.PREMIUM_FEE_CREDITS || '30', 10),
    
    // Limits
    maxInputChars: parseInt(process.env.MAX_INPUT_CHARS || '2000', 10),
    
    // Token estimation
    shortFormMaxTokens: parseInt(process.env.SHORT_FORM_MAX_TOKENS || '150', 10),
    longFormBaseTokens: parseInt(process.env.LONG_FORM_BASE_TOKENS || '350', 10),
    imageAnalysisBaseTokens: parseInt(process.env.IMAGE_ANALYSIS_BASE_TOKENS || '750', 10),
  },

  // Auto refund on AI failure
  autoRefundOnFail: process.env.AUTO_REFUND_ON_FAIL === 'true' || false,
  
  // Caching
  cache: {
    retentionDays: parseInt(process.env.CACHE_RETENTION_DAYS || '30', 10),
    enabled: process.env.CACHE_ENABLED !== 'false',
  },

  // Rate limiting
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10', 10),
  },
} as const;

// Validation
if (!config.supabase.url) {
  throw new Error('Missing required Supabase configuration: SUPABASE_URL is not set in .env file');
}

if (!config.supabase.anonKey) {
  console.warn('⚠️  Warning: SUPABASE_ANON_KEY is not set. Some features may not work.');
}

if (!config.supabase.serviceKey) {
  console.warn(
    '⚠️  Warning: SUPABASE_SERVICE_KEY is not set in .env file.\n' +
    '   Admin features and some backend operations will not work.\n' +
    '   Get it from: https://supabase.com/dashboard/project/pjijprbtcajlsuuttcti/settings/api\n' +
    '   Look for the "service_role" key (it has a warning icon).\n'
  );
}

if (!config.stripe.secretKey) {
  console.warn('Warning: Stripe secret key not configured. Payment features will not work.');
}


