#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBadgeAPI() {
  console.log('🧪 Testing badge API for user...\n');

  // Get a user
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .limit(1);

  if (!users || users.length === 0) {
    console.log('No users found');
    return;
  }

  const user = users[0];
  console.log(`Testing with user: ${user.email} (${user.id})\n`);

  // Import badge service
  const { badgeService } = await import('../src/services/badge.service.js');

  // Call getUserBadges
  try {
    const result = await badgeService.getUserBadges(user.id);
    
    console.log(`✅ API Response:`);
    console.log(`   Unlocked: ${result.unlocked.length}`);
    console.log(`   Locked: ${result.locked.length}`);
    console.log(`   Total: ${result.unlocked.length + result.locked.length}`);
    
    if (result.unlocked.length > 0) {
      console.log(`\n🏆 Unlocked badges:`);
      result.unlocked.forEach(b => console.log(`   - ${b.name}`));
    }
    
    console.log(`\n🔒 Sample locked badges:`);
    result.locked.slice(0, 5).forEach(b => console.log(`   - ${b.name}`));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testBadgeAPI();
