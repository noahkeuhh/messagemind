#!/usr/bin/env node

/**
 * Check and fix all users' daily_credits_limit based on their tier
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  console.error('Make sure your .env file has these variables set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Expected limits per tier
const EXPECTED_LIMITS = {
  free: 0,
  pro: 100,
  plus: 180,
  max: 300
};

async function checkAllTierCredits() {
  try {
    console.log('🔍 Checking all users\' daily_credits_limit...\n');

    // Fetch all users
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('id, email, subscription_tier, daily_credits_limit, credits_remaining')
      .order('subscription_tier', { ascending: true });

    if (selectError) {
      console.error('Error fetching users:', selectError);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log('No users found');
      return;
    }

    console.log(`Found ${users.length} user(s)\n`);

    let correctCount = 0;
    let incorrectCount = 0;
    let fixedCount = 0;
    let errorCount = 0;

    // Group by tier for better overview
    const usersByTier = {
      free: [],
      pro: [],
      plus: [],
      max: []
    };

    users.forEach(user => {
      if (usersByTier[user.subscription_tier]) {
        usersByTier[user.subscription_tier].push(user);
      }
    });

    // Check each tier
    for (const [tier, tierUsers] of Object.entries(usersByTier)) {
      if (tierUsers.length === 0) continue;

      const expectedLimit = EXPECTED_LIMITS[tier];
      console.log(`\n📊 ${tier.toUpperCase()} TIER (${tierUsers.length} user(s)) - Expected: ${expectedLimit} credits/day`);
      console.log('─'.repeat(80));

      for (const user of tierUsers) {
        const isCorrect = user.daily_credits_limit === expectedLimit;
        
        if (isCorrect) {
          console.log(`✅ ${user.email}`);
          console.log(`   Limit: ${user.daily_credits_limit} | Credits: ${user.credits_remaining}`);
          correctCount++;
        } else {
          console.log(`⚠️  ${user.email}`);
          console.log(`   Current limit: ${user.daily_credits_limit} (INCORRECT! Should be ${expectedLimit})`);
          console.log(`   Fixing...`);
          incorrectCount++;

          // Fix the user
          const { data, error } = await supabase
            .from('users')
            .update({ 
              daily_credits_limit: expectedLimit,
              credits_remaining: expectedLimit  // Reset credits to match new limit
            })
            .eq('id', user.id)
            .select();

          if (error) {
            console.error(`   ❌ Error updating user:`, error.message);
            errorCount++;
          } else {
            console.log(`   ✅ Fixed! New limit: ${expectedLimit}, credits: ${expectedLimit}`);
            fixedCount++;
          }
        }
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('📈 SUMMARY');
    console.log('═'.repeat(80));
    console.log(`Total users checked: ${users.length}`);
    console.log(`✅ Correct: ${correctCount}`);
    console.log(`⚠️  Incorrect: ${incorrectCount}`);
    console.log(`🔧 Fixed: ${fixedCount}`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount}`);
    }
    console.log('\n✅ Done! Refresh your browser to see updated credits.');

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

checkAllTierCredits();
