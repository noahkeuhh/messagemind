import { supabaseAdmin } from '../lib/supabase.js';

async function verifyBadgeTables() {
  console.log('🔍 Verifying badge system tables...\n');

  try {
    // Check if badges table exists and count rows
    const { data: badgesData, error: badgesError, count: badgesCount } = await supabaseAdmin
      .from('badges')
      .select('*', { count: 'exact', head: true });

    if (badgesError) {
      console.error('❌ Error accessing badges table:', badgesError.message);
      console.log('\n⚠️  The badges table does not exist or is not accessible.');
      console.log('📋 Please run the migration: backend/src/db/migration_badges.sql');
      console.log('   in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)');
      return false;
    }

    console.log(`✅ badges table exists with ${badgesCount} badges`);
    
    if (badgesCount !== 17) {
      console.log(`⚠️  Expected 17 badges, but found ${badgesCount}`);
      console.log('📋 Please run the migration: backend/src/db/migration_badges.sql');
    }

    // Check if user_badges table exists
    const { data: userBadgesData, error: userBadgesError, count: userBadgesCount } = await supabaseAdmin
      .from('user_badges')
      .select('*', { count: 'exact', head: true });

    if (userBadgesError) {
      console.error('❌ Error accessing user_badges table:', userBadgesError.message);
      console.log('\n⚠️  The user_badges table does not exist or is not accessible.');
      console.log('📋 Please run the migration: backend/src/db/migration_badges.sql');
      return false;
    }

    console.log(`✅ user_badges table exists with ${userBadgesCount} unlocked badges`);

    // List all badge categories
    const { data: categoryData, error: categoryError } = await supabaseAdmin
      .from('badges')
      .select('category')
      .order('category');

    if (!categoryError && categoryData) {
      const categories = [...new Set(categoryData.map(b => b.category))];
      console.log(`\n📊 Badge categories: ${categories.join(', ')}`);
    }

    console.log('\n✅ Badge system is properly configured!');
    console.log('🎯 Badge page should be accessible at: http://localhost:8080/dashboard/badges');
    
    return true;
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

verifyBadgeTables()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
