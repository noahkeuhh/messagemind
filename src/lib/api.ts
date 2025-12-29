import { supabase } from '@/integrations/supabase/client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Cache session to prevent excessive calls
let cachedSession: { access_token: string | null; expires_at: number | null } | null = null;
let sessionPromise: Promise<any> | null = null;

async function getSessionToken(): Promise<string | null> {
  // Return cached token if still valid (with 5 minute buffer)
  if (cachedSession && cachedSession.expires_at) {
    const expiresIn = cachedSession.expires_at * 1000 - Date.now();
    if (expiresIn > 5 * 60 * 1000) { // 5 minutes buffer
      return cachedSession.access_token;
    }
  }

  // Reuse existing promise if already fetching
  if (sessionPromise) {
    const result = await sessionPromise;
    return result?.access_token || null;
  }

  // Fetch new session
  sessionPromise = supabase.auth.getSession().then(({ data: { session } }) => {
    cachedSession = {
      access_token: session?.access_token || null,
      expires_at: session?.expires_at || null,
    };
    sessionPromise = null;
    return session;
  });

  const session = await sessionPromise;
  return session?.access_token || null;
}

export interface ApiError {
  error: string;
  message?: string;
  credits_needed?: number;
  credits_remaining?: number;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Get auth token from cached session
  const token = await getSessionToken();

  if (!token && !endpoint.includes('/health')) {
    throw new Error('Not authenticated. Please sign in.');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add idempotency key for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(options.method || '')) {
    const idempotencyKey = options.headers?.['Idempotency-Key'] || generateIdempotencyKey();
    headers['Idempotency-Key'] = idempotencyKey;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 - Unauthorized
    if (response.status === 401) {
      // Clear cached session
      cachedSession = null;
      sessionPromise = null;
      // Redirect to login or refresh token
      window.location.href = '/';
      throw new Error('Session expired. Please sign in again.');
    }

    // Handle 402 - Insufficient Credits
    if (response.status === 402) {
      const data = await response.json();
      const error: any = new Error(data.message || 'Not enough credits');
      error.error = 'insufficient_credits';
      error.credits_needed = data.credits_needed;
      error.credits_remaining = data.credits_remaining;
      throw error;
    }

    // Handle 403 - Forbidden (deep mode, batch limit, etc)
    if (response.status === 403) {
      const data = await response.json();
      const error: any = new Error(data.message || 'Access denied');
      error.error = data.error || 'forbidden';
      // Include additional context if available
      if (data.current_limit !== undefined) error.current_limit = data.current_limit;
      if (data.requested !== undefined) error.requested = data.requested;
      throw error;
    }

    // Handle 429 - Rate Limit
    if (response.status === 429) {
      const data = await response.json();
      throw new Error(data.message || 'Too many requests. Please wait a moment.');
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.message || errorData.error || `API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error. Please check your connection.');
  }
}

function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// Specific API functions
export const api = {
  // Credits
  async getCredits() {
    return apiRequest<{
      user_id: string;
      credits_remaining: number;
      daily_limit: number;
      last_reset_date: string;
      subscription_tier: string;
      free_analysis_available?: boolean;
      monthly_free_analyses_used?: number;
      monthly_free_analyses_limit?: number;
    }>('/user/credits');
  },

  // Actions (MessageMind format)
  async executeAction(data: {
    mode: 'snapshot' | 'expanded' | 'deep';
    input_text?: string;
    images?: string[];
    expandedToggle?: boolean;      // PRO: Expanded toggle (+12 credits)
    explanationToggle?: boolean;   // PRO: Explanation toggle (+4), PLUS: Enhanced Explanation (+8)
    recompute?: boolean;
    user_id?: string; // Optional, backend will use authenticated user if not provided
  }) {
    try {
      // Get user_id from session if not provided
      let userId = data.user_id;
      if (!userId) {
        const session = await supabase.auth.getSession();
        userId = session.data.session?.user?.id;
      }

      const requestData = {
        ...data,
        user_id: userId, // Include user_id in request
      };

      console.log('[API] Executing action:', { mode: data.mode, hasInput: !!data.input_text, hasImages: !!data.images?.length, userId });

      return await apiRequest<{
        analysis_id: string;
        status: string;
        credits_charged: number;
        credits_remaining: number;
        provider_used?: string; // Model name (gpt-4o-mini, gpt-4, etc.)
        mode_used?: string; // Actual mode used (snapshot, expanded, deep)
        queued: boolean;
        breakdown?: any;
        cached?: boolean;
        analysis_json?: any; // Include analysis_json for cached responses
      }>('/user/action', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    } catch (error: any) {
      console.error('[API] executeAction error:', error);
      throw error;
    }
  },

  // Analysis (Production format)
  async getAnalysis(analysisId: string) {
    console.log(`[API] Fetching analysis ${analysisId}`);
    const result = await apiRequest<{
      status: string;
      analysis_json: any;
      provider_used: string;
      mode_used: string;
      credits_charged: number;
      credits_remaining: number;
      tokens_actual: number;
      created_at: string;
      updated_at: string;
      input_text: string;
      image_url: string | null;
      error_message?: string;
    }>(`/user/analysis/${analysisId}`);
    console.log(`[API] Analysis ${analysisId} status: ${result.status}, provider: ${result.provider_used}, mode: ${result.mode_used}`);
    return result;
  },

  // History
  async getHistory(limit = 20, offset = 0) {
    return apiRequest<{
      analyses: Array<{
        id: string;
        input_text: string | null;
        image_url: string | null;
        status: string;
        credits_used: number;
        created_at: string;
        analysis_result: any;
        provider_used: string;
        mode: string;
      }>;
      total: number;
    }>(`/user/history?limit=${limit}&offset=${offset}`);
  },

  // Purchase
  async buyPack(packId: string) {
    return apiRequest<{
      checkout_url: string;
      session_id: string;
    }>('/user/buy_pack', {
      method: 'POST',
      body: JSON.stringify({ pack_id: packId }),
    });
  },

  // Saved Replies
  async saveReply(data: {
    reply_text: string;
    reply_type?: string;
    analysis_id?: string;
  }) {
    return apiRequest('/user/save_reply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSavedReplies() {
    return apiRequest<{
      replies: Array<{
        id: string;
        reply_text: string;
        reply_type: string | null;
        analysis_id: string | null;
        created_at: string;
      }>;
    }>('/user/saved_replies');
  },

  async deleteSavedReply(replyId: string) {
    return apiRequest<{ success: boolean; message: string }>(`/user/saved_reply/${replyId}`, {
      method: 'DELETE',
    });
  },

  // Subscriptions
  async subscribe(tier: string, interval: 'month' | 'year' = 'month') {
    return apiRequest<{
      checkout_url: string;
      session_id: string;
    }>('/user/subscribe', {
      method: 'POST',
      body: JSON.stringify({ tier, interval }),
    });
  },

  async cancelSubscription(immediate: boolean = false) {
    return apiRequest('/user/cancel_subscription', {
      method: 'POST',
      body: JSON.stringify({ immediate }),
    });
  },

  // Subscription info
  async getSubscription() {
    return apiRequest<{
      subscription_tier: string;
      subscription_info: any;
      payment_method: any;
      usage: {
        analyses_this_month: number;
        credits_used_this_month: number;
      };
    }>('/user/subscription');
  },

  // Billing portal
  async getBillingPortal() {
    return apiRequest<{ url: string }>('/user/billing_portal');
  },

  // Data export
  async exportData() {
    return apiRequest('/user/data/export');
  },

  // Delete account
  async deleteAccount() {
    return apiRequest('/user', {
      method: 'DELETE',
    });
  },

  // Test endpoints (development only)
  async setUserTier(tier: 'free' | 'pro' | 'plus' | 'max') {
    return apiRequest<{
      message: string;
      user_id: string;
      new_tier: string;
      daily_credits_limit: number;
      credits_remaining: number;
    }>('/test/set-user-tier', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    });
  },

  // Auth endpoints
  async forgotPassword(email: string) {
    return apiRequest<{
      success: boolean;
      message: string;
    }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(accessToken: string, newPassword: string) {
    return apiRequest<{
      success: boolean;
      message: string;
    }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ 
        access_token: accessToken, 
        new_password: newPassword 
      }),
    });
  },

  // Badges
  async getBadges() {
    return apiRequest<{
      unlocked: Array<{
        id: string;
        name: string;
        category: string;
        description: string;
        icon: string;
        required_tier: string | null;
        reward_credits: number;
        unlocked_at: string;
      }>;
      locked: Array<{
        id: string;
        name: string;
        category: string;
        description: string;
        icon: string;
        required_tier: string | null;
        reward_credits: number;
      }>;
    }>('/user/badges');
  },
};

