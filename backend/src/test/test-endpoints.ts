/**
 * Test script for API endpoints
 * Run with: npm run test
 */

import { config } from '../config/index.js';

const API_BASE = `http://localhost:${config.app.port}/api`;

async function testEndpoint(method: string, path: string, body?: any, headers?: Record<string, string>) {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${path}`, options);
    const data = await response.json();

    console.log(`\n${method} ${path}`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    return { status: response.status, data };
  } catch (error) {
    console.error(`Error testing ${method} ${path}:`, error);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Starting API endpoint tests...\n');

  // Health check
  await testEndpoint('GET', '/health');

  // Note: These tests require authentication tokens
  // Replace with actual tokens from Supabase Auth
  const testToken = process.env.TEST_AUTH_TOKEN || 'your_test_token_here';
  const testUserId = process.env.TEST_USER_ID || 'your_test_user_id_here';

  const authHeaders = {
    'Authorization': `Bearer ${testToken}`,
  };

  // Test user endpoints (requires auth)
  console.log('\n📋 Testing user endpoints (requires valid token)...');
  
  // Get credits
  await testEndpoint('GET', '/user/credits', undefined, authHeaders);

  // Test action (will fail without credits or invalid token)
  await testEndpoint('POST', '/user/action', {
    action_type: 'short_chat',
    input_text: 'Test message',
  }, authHeaders);

  // Test buy pack
  await testEndpoint('POST', '/user/buy_pack', {
    pack_id: 'pack_50',
  }, authHeaders);

  // Test history
  await testEndpoint('GET', '/user/history', undefined, authHeaders);

  // Test admin endpoints (requires admin key)
  const adminHeaders = {
    'x-admin-api-key': config.admin.apiKey || 'test_admin_key',
  };

  console.log('\n🔐 Testing admin endpoints...');
  await testEndpoint('GET', '/admin/metrics', undefined, adminHeaders);

  console.log('\n✅ Tests completed!');
  console.log('\nNote: Some tests may fail if:');
  console.log('  - Authentication tokens are invalid');
  console.log('  - Database is not set up');
  console.log('  - Stripe is not configured');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };



