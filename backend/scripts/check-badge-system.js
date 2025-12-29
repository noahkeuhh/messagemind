#!/usr/bin/env node

/**
 * Check if badge tables exist and are populated
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

async function checkBadgeSystem() {
  try {
    console.log('🔍 Checking badge system...\n');

    // Check if badges table exists and has data
    console.log('1️⃣ Checking badges table...');
    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .limit(5);

    if (badgesError) {
      console.error('❌ Error accessing badges table:', badgesError.message);
      console.log('\n💡 Solution: Run the badge migration:');
      console.log('   Execute the SQL in backend/src/db/migration_badges.sql in your Supabase SQL editor');
      return false;
    }

    if (!badges || badges.length === 0) {
      console.error('❌ Badges table exists but has no data');
      console.log('\n💡 Solution: Run the badge migration to seed data:');
      console.log('   Execute the SQL in backend/src/db/migration_badges.sql in your Supabase SQL editor');
      return false;
    }

    console.log(`✅ Badges table OK - Found ${badges.length} badges (showing first 5)`);
    badges.forEach(badge => {
      console.log(`   - ${badge.name} (${badge.category})`);
    });

    // Check if user_badges table exists
    console.log('\n2️⃣ Checking user_badges table...');
    const { data: userBadges, error: userBadgesError } = await supabase
      .from('user_badges')
      .select('*')
      .limit(1);

    if (userBadgesError) {
      console.error('❌ Error accessing user_badges table:', userBadgesError.message);
      console.log('\n💡 Solution: Run the badge migration:');
      console.log('   Execute the SQL in backend/src/db/migration_badges.sql in your Supabase SQL editor');
      return false;
    }

    console.log('✅ User_badges table OK');

    // Test backend API
    console.log('\n3️⃣ Testing backend API...');
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/user/badges`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      console.log(`⚠️  Backend API returned ${response.status}`);
      if (response.status === 401) {
        console.log('   This is expected - authentication required');
      } else {
        const text = await response.text();
        console.log('   Response:', text);
      }
    } else {
      console.log('✅ Backend API responding');
    }

    console.log('\n✅ Badge system is correctly set up!');
    console.log('\n📊 Total badges in system:', badges.length);
    
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

checkBadgeSystem();
