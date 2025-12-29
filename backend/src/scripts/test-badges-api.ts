import { supabase } from '../lib/supabase.js';

async function testBadgesAPI() {
  console.log('🧪 Testing Badges API...\n');

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Not authenticated. Please log in first.');
      console.log('You can test this manually by:');
      console.log('1. Opening http://localhost:8080/dashboard/badges in your browser');
      console.log('2. Logging in with your account');
      console.log('3. Checking the browser console and network tab');
      return false;
    }

    console.log('✅ User authenticated:', user.email);
    console.log('User ID:', user.id);

    // Get user's session token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('❌ No active session');
      return false;
    }

    // Test GET /api/user/badges endpoint
    console.log('\n📡 Testing GET /api/user/badges...');
    
    const response = await fetch('http://localhost:3001/api/user/badges', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return false;
    }

    const data = await response.json();
    
    console.log('\n✅ API Response successful!');
    console.log('📊 Unlocked badges:', data.unlocked?.length || 0);
    console.log('🔒 Locked badges:', data.locked?.length || 0);
    console.log('📋 Total badges:', (data.unlocked?.length || 0) + (data.locked?.length || 0));

    if (data.unlocked && data.unlocked.length > 0) {
      console.log('\n🎉 Your unlocked badges:');
      data.unlocked.forEach((badge: any) => {
        console.log(`  - ${badge.name} (${badge.category})`);
      });
    }

    console.log('\n✅ Badge API is working correctly!');
    console.log('🌐 Badge page should be accessible at: http://localhost:8080/dashboard/badges');
    
    return true;
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure backend is running on port 3001');
    console.log('2. Make sure you are logged in');
    console.log('3. Check backend logs for errors');
    return false;
  }
}

testBadgesAPI()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
