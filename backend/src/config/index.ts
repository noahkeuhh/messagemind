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
      model: process.env.OPENAI_MODEL || 'openai/gpt-oss-120b',
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY || '',
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY || '',
      baseUrl: 'https://api.anthropic.com/v1',
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
    },
    // Legacy support
    serviceKey: process.env.AI_SERVICE_KEY || '',
    serviceUrl: process.env.AI_SERVICE_URL || 'https://api.openai.com/v1',
    model: process.env.AI_MODEL || 'openai/gpt-oss-120b',
  },

  // Application
  app: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    currency: process.env.CURRENCY || 'EUR',
    creditTokenRatio: parseInt(process.env.CREDIT_TOKEN_RATIO || '20', 10),
  },

  // Frontend URL for password reset redirects
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Admin
  admin: {
    apiKey: process.env.ADMIN_API_KEY || '',
  },

  // Cron
  cron: {
    dailyResetTime: process.env.DAILY_RESET_TIME || '00:00:00',
    dailyResetTimezone: process.env.DAILY_RESET_TIMEZONE || 'Europe/Amsterdam',
  },

  // Base credits per mode (fallback when no input provided)
  baseCredits: {
    snapshot: 8, // Short text (≤200 chars) = 8 credits
    expanded: 12, // Long text = 12 credits
    deep: 30,
  },

  // Subscription tiers with pricing and AI model routing (Production architecture)
  subscriptionTiers: {
    free: { 
      dailyCreditsLimit: 0, // No daily credits, only 1 total analysis (single-use)
      monthlyFreeAnalyses: 1, // 1 free snapshot total (single-use, not daily)
      name: 'Free',
      priceCents: 0, // €0
      aiModel: 'llama-3.3-70b-versatile' as const, // Groq llama-3.3-70b-versatile (ALL TIERS SAME)
      provider: 'groq' as const,
      batchLimit: 1,
      deepAllowed: false, // Free tier cannot use deep mode
      expandedAllowed: true, // Free tier can use expanded
      explanationAllowed: false, // Free tier cannot use explanation
    },
    pro: { 
      dailyCreditsLimit: 100, // 100 credits/day
      monthlyFreeAnalyses: 0,
      name: 'Pro',
      priceCents: 1700, // €17/month
      aiModel: 'llama-3.3-70b-versatile' as const, // Groq llama-3.3-70b-versatile (ALL TIERS SAME)
      provider: 'groq' as const,
      batchLimit: 1,
      deepAllowed: false, // Pro: deep toggle hidden in UI
      expandedAllowed: false, // Expanded removed from Pro
      explanationAllowed: false, // Explanation removed from Pro
      deepCost: 12, // Deep cost exists but toggle hidden
    },
    plus: { 
      dailyCreditsLimit: 180, // 180 credits/day
      monthlyFreeAnalyses: 0,
      name: 'Plus',
      priceCents: 2900, // €29/month
      aiModel: 'llama-3.3-70b-versatile' as const, // Groq llama-3.3-70b-versatile (ALL TIERS SAME)
      provider: 'groq' as const,
      batchLimit: 3,
      deepAllowed: true, // Plus allows deep toggle (+12 credits)
      expandedAllowed: false, // Plus default is expanded
      explanationAllowed: false, // Explanation removed from Plus
      deepCost: 12, // Extra cost for deep toggle
    },
    max: { 
      dailyCreditsLimit: 300, // 300 credits/day
      monthlyFreeAnalyses: 0,
      name: 'Max',
      priceCents: 5900, // €59/month
      aiModel: 'llama-3.3-70b-versatile' as const, // Groq llama-3.3-70b-versatile (ALL TIERS SAME)
      provider: 'groq' as const,
      batchLimit: 10,
      deepAllowed: true, // Max tier has deep mode
      expandedAllowed: false, // Max default is deep
      explanationAllowed: false, // Deep mode includes explanation, no toggle needed
    },
  },

  /* ========== PREVIOUS SPECIFICATION (COMMENTED OUT) ==========
  subscriptionTiers: {
    free: { 
      aiModel: 'llama3-8b-instant' as const,
      provider: 'groq' as const,
    },
    pro: { 
      aiModel: 'gpt-4o-mini' as const,
      provider: 'openai' as const,
    },
    plus: { 
      aiModel: 'gpt-4o-mini' as const,
      provider: 'openai' as const,
    },
    max: { 
      aiModel: 'gpt-4o' as const,
      provider: 'openai' as const,
    },
  },
  ========================================================== */

  // Dynamic credit scaling parameters
  creditScaling: {
    // Input-based scaling
    inputBaseThresholdChars: parseInt(process.env.INPUT_BASE_THRESHOLD_CHARS || '200', 10),
    inputChunkChars: parseInt(process.env.INPUT_CHUNK_CHARS || '100', 10),
    imageInputEquivChars: 1000, // Each image counts as 1000 chars
    shortThresholdChars: parseInt(process.env.SHORT_THRESHOLD_CHARS || '200', 10), // Text length threshold: ≤200 = short, >200 = long
    imageBaseCredits: parseInt(process.env.IMAGE_BASE_CREDITS || '30', 10), // Base credits per image
    textShortCredits: parseInt(process.env.TEXT_SHORT_CREDITS || '8', 10), // Credits for short text (≤200 chars)
    textLongCredits: parseInt(process.env.TEXT_LONG_CREDITS || '12', 10), // Credits for long text (>200 chars)
    deepModeMultiplier: parseFloat(process.env.DEEP_MODE_MULTIPLIER || '1.2'), // Deep mode multiplier for Max tier
    
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

  // Credit top-up packs (in-app purchases) - FINAL SPECIFICATION
  creditTopups: {
    pack_50: {
      credits: 50,
      priceCents: 500, // €5
      stripePriceId: process.env.STRIPE_PRICE_ID_TOPUP_50 || '',
    },
    pack_100: {
      credits: 100,
      priceCents: 999, // €9.99
      stripePriceId: process.env.STRIPE_PRICE_ID_TOPUP_100 || '',
    },
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
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30', 10), // Increased from 10 to 30
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
