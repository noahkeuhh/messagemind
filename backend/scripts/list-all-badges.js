#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllBadges() {
  const { data: badges, error } = await supabase
    .from('badges')
    .select('*')
    .order('category, name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`\n📋 Total badges: ${badges.length}\n`);
  
  const byCategory = {};
  badges.forEach(badge => {
    if (!byCategory[badge.category]) byCategory[badge.category] = [];
    byCategory[badge.category].push(badge);
  });

  for (const [category, categoryBadges] of Object.entries(byCategory)) {
    console.log(`\n${category.toUpperCase()} (${categoryBadges.length})`);
    console.log('─'.repeat(60));
    categoryBadges.forEach(badge => {
      console.log(`  ✓ ${badge.name.padEnd(25)} - ${badge.description}`);
      if (badge.required_tier) console.log(`    Required: ${badge.required_tier}`);
    });
  }
}

listAllBadges();
