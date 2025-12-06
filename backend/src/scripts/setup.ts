/**
 * Setup script to initialize database and verify configuration
 * Run with: tsx src/scripts/setup.ts
 */

import { config } from '../config/index.js';
import { supabaseAdmin } from '../lib/supabase.js';

async function checkSupabaseConnection() {
  console.log('🔍 Checking Supabase connection...');
  
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (error: any) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
}

async function checkTables() {
  console.log('\n🔍 Checking database tables...');
  
  const tables = [
    'users',
    'credits_transactions',
    'analyses',
    'saved_replies',
    'credit_packs',
    'admin_metrics',
    'stripe_webhook_events',
  ];

  const missing: string[] = [];

  for (const table of tables) {
    try {
      const { error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        missing.push(table);
        console.log(`❌ Table '${table}' missing or inaccessible`);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    } catch (error) {
      missing.push(table);
      console.log(`❌ Table '${table}' check failed`);
    }
  }

  if (missing.length > 0) {
    console.log(`\n⚠️  Missing tables: ${missing.join(', ')}`);
    console.log('   Run src/db/schema.sql in Supabase SQL Editor');
    return false;
  }

  return true;
}

async function checkCreditPacks() {
  console.log('\n🔍 Checking credit packs...');
  
  try {
    const { data, error } = await supabaseAdmin
      .from('credit_packs')
      .select('*');

    if (error) {
      console.error('❌ Error fetching credit packs:', error.message);
      return false;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No credit packs found');
      console.log('   Default packs should be created by schema.sql');
      return false;
    }

    console.log(`✅ Found ${data.length} credit pack(s):`);
    data.forEach(pack => {
      console.log(`   - ${pack.id}: ${pack.credits} credits for €${(pack.price_cents / 100).toFixed(2)}`);
    });

    return true;
  } catch (error: any) {
    console.error('❌ Error checking credit packs:', error.message);
    return false;
  }
}

async function checkConfig() {
  console.log('\n🔍 Checking configuration...');
  
  const checks = [
    { name: 'Supabase URL', value: config.supabase.url, required: true },
    { name: 'Supabase Service Key', value: config.supabase.serviceKey ? '***' : '', required: true },
    { name: 'Stripe Secret Key', value: config.stripe.secretKey ? '***' : '', required: false },
    { name: 'Stripe Webhook Secret', value: config.stripe.webhookSecret ? '***' : '', required: false },
    { name: 'Admin API Key', value: config.admin.apiKey ? '***' : '', required: false },
    { name: 'AI Service Key', value: config.ai.serviceKey ? '***' : '', required: false },
    { name: 'Port', value: config.app.port.toString(), required: false },
    { name: 'Currency', value: config.app.currency, required: false },
  ];

  let allGood = true;

  checks.forEach(check => {
    if (check.required && !check.value) {
      console.log(`❌ ${check.name}: Missing (required)`);
      allGood = false;
    } else if (check.value) {
      console.log(`✅ ${check.name}: Configured`);
    } else {
      console.log(`⚠️  ${check.name}: Not configured (optional)`);
    }
  });

  return allGood;
}

async function main() {
  console.log('🚀 AI Flirt Studio - Setup Verification\n');
  console.log('=' .repeat(50));

  const configOk = await checkConfig();
  const supabaseOk = await checkSupabaseConnection();
  const tablesOk = supabaseOk ? await checkTables() : false;
  const packsOk = tablesOk ? await checkCreditPacks() : false;

  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Summary:');

  if (configOk && supabaseOk && tablesOk && packsOk) {
    console.log('✅ All checks passed! Backend is ready to use.');
    console.log('\nNext steps:');
    console.log('  1. Start the server: npm run dev');
    console.log('  2. Test endpoints with Postman collection');
    console.log('  3. Configure Stripe webhooks');
    console.log('  4. Set up cron job for daily resets');
  } else {
    console.log('⚠️  Some checks failed. Please fix the issues above.');
    console.log('\nCommon fixes:');
    if (!configOk) {
      console.log('  - Set all required environment variables in .env');
    }
    if (!supabaseOk || !tablesOk) {
      console.log('  - Run src/db/schema.sql in Supabase SQL Editor');
      console.log('  - Run src/db/triggers.sql for user signup trigger');
    }
    if (!packsOk) {
      console.log('  - Credit packs should be created by schema.sql');
    }
  }
}

main().catch(console.error);



