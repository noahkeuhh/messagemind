#!/usr/bin/env node

/**
 * Fix Max tier credits - set daily_credits_limit to 300
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
  console.error('Current env:', { supabaseUrl, hasKey: !!supabaseKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMaxCredits() {
  try {
    console.log('🔍 Checking for Max tier users with incorrect daily_credits_limit...\n');

    // Find all Max users with wrong limit
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('id, email, subscription_tier, daily_credits_limit, credits_remaining')
      .eq('subscription_tier', 'max');

    if (selectError) {
      console.error('Error fetching users:', selectError);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log('No Max tier users found');
      return;
    }

    console.log(`Found ${users.length} Max tier user(s):\n`);
    
    for (const user of users) {
      console.log(`User: ${user.email}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Current daily_credits_limit: ${user.daily_credits_limit}`);
      console.log(`  Current credits_remaining: ${user.credits_remaining}`);
      
      if (user.daily_credits_limit !== 300) {
        console.log(`  ⚠️  Incorrect! Should be 300. Fixing...`);
        
        const { data, error } = await supabase
          .from('users')
          .update({ 
            daily_credits_limit: 300,
            credits_remaining: 300
          })
          .eq('id', user.id)
          .select();

        if (error) {
          console.error(`  ❌ Error updating user:`, error);
        } else {
          console.log(`  ✅ Fixed! New daily_credits_limit: 300, credits_remaining: 300`);
        }
      } else {
        console.log(`  ✅ Already correct (300)`);
      }
      console.log('');
    }

    console.log('✅ Done! Refresh your browser to see the updated credits.');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

fixMaxCredits();
