#!/usr/bin/env node

/**
 * Test Utility: Update user subscription tier
 * Usage: node scripts/update-test-user-tier.js <userId> <tier>
 * 
 * Example: node scripts/update-test-user-tier.js 013299b2-4878-46d7-9124-c09be263c65b max
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateUserTier(userId, tier) {
  try {
    if (!['free', 'pro', 'plus', 'max'].includes(tier)) {
      console.error(`Error: Invalid tier "${tier}". Must be one of: free, pro, plus, max`);
      process.exit(1);
    }

    // Define daily credit limits per tier
    const tierLimits = {
      free: 0,
      pro: 100,
      plus: 180,
      max: 300
    };

    const dailyLimit = tierLimits[tier];

    console.log(`Updating user ${userId} to tier: ${tier}`);
    console.log(`Setting daily_credits_limit to: ${dailyLimit}`);

    const { data, error } = await supabase
      .from('users')
      .update({ 
        subscription_tier: tier,
        daily_credits_limit: dailyLimit,
        credits_remaining: dailyLimit  // Also reset current credits to the new limit
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error updating user:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.error(`Error: User ${userId} not found`);
      process.exit(1);
    }

    console.log(`✅ User ${userId} updated successfully`);
    console.log(`   New tier: ${data[0].subscription_tier}`);
    console.log(`   Daily limit: ${data[0].daily_credits_limit}`);
    console.log(`   Credits remaining: ${data[0].credits_remaining}`);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/update-test-user-tier.js <userId> <tier>');
  console.error('Example: node scripts/update-test-user-tier.js 013299b2-4878-46d7-9124-c09be263c65b max');
  process.exit(1);
}

const [userId, tier] = args;
updateUserTier(userId, tier);
