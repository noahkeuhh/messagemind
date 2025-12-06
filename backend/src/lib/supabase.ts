import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

// Service role client (bypasses RLS)
let adminClient: SupabaseClient | null = null;

if (config.supabase.serviceKey) {
  adminClient = createClient(
    config.supabase.url,
    config.supabase.serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Wrapper that throws helpful error if service key is missing
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!adminClient) {
      throw new Error(
        'SUPABASE_SERVICE_KEY is required for this operation. ' +
        'Get it from: https://supabase.com/dashboard/project/pjijprbtcajlsuuttcti/settings/api ' +
        '(Look for the "service_role" key)'
      );
    }
    return (adminClient as any)[prop];
  }
});

// Anon client (respects RLS)
export const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Helper to get authenticated user from JWT
export async function getUserFromToken(token: string) {
  if (!adminClient) {
    console.error('Cannot get user from token: SUPABASE_SERVICE_KEY is not configured');
    return null;
  }
  
  try {
    const { data: { user }, error } = await adminClient.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}



