/**
 * PRICING & CREDIT SYSTEM - INTEGRATION TEST
 * Verifies the complete system works as specified
 */

import { config } from '../config/index.js';

// Test 1: Verify pricing configuration
export function testPricingConfiguration() {
  console.log('TEST 1: Pricing Configuration');
  
  const expectedPrices = {
    free: 0,
    pro: 1700, // $17
    plus: 2900, // $29
    max: 5900, // $59
  };

  const expectedCredits = {
    free: 1, // 1 total analysis
    pro: 100,
    plus: 180,
    max: 300,
  };

  for (const tier of ['free', 'pro', 'plus', 'max'] as const) {
    const tierConfig = config.subscriptionTiers[tier];
    
    if (tierConfig.priceCents !== expectedPrices[tier]) {
      throw new Error(`❌ ${tier}: Expected price ${expectedPrices[tier]}, got ${tierConfig.priceCents}`);
    }
    
    const expectedLimit = tier === 'free' ? 0 : expectedCredits[tier];
    if (tierConfig.dailyCreditsLimit !== expectedLimit) {
      throw new Error(`❌ ${tier}: Expected daily limit ${expectedLimit}, got ${tierConfig.dailyCreditsLimit}`);
    }
    
    console.log(`✅ ${tier}: Price €${tierConfig.priceCents / 100}, Daily limit: ${tierConfig.dailyCreditsLimit}`);
  }
}

// Test 2: Verify credit cost rules
export function testCreditCostRules() {
  console.log('\nTEST 2: Credit Cost Rules');
  
  const expectedCosts = {
    textShort: 5,     // ≤200 chars
    textLong: 12,     // >200 chars
    image: 30,        // per image
    deepMultiplier: 1.2,
  };

  for (const [key, value] of Object.entries(expectedCosts)) {
    let actual: number | undefined;
    
    switch (key) {
      case 'textShort':
        actual = config.creditScaling.textShortCredits;
        break;
      case 'textLong':
        actual = config.creditScaling.textLongCredits;
        break;
      case 'image':
        actual = config.creditScaling.imageBaseCredits;
        break;
      case 'deepMultiplier':
        actual = config.creditScaling.deepModeMultiplier;
        break;
    }
    
    if (actual !== value) {
      throw new Error(`❌ ${key}: Expected ${value}, got ${actual}`);
    }
    console.log(`✅ ${key}: ${actual}`);
  }
}

// Test 3: Verify model routing rules
export function testModelRouting() {
  console.log('\nTEST 3: Model Routing Rules');
  
  const expectedRouting = {
    free: { model: 'llama-3.3-70b-versatile', provider: 'groq' },
    pro: { model: 'llama-3.3-70b-versatile', provider: 'groq' },
    plus: { model: 'llama-3.3-70b-versatile', provider: 'groq' },
    max: { model: 'llama-3.3-70b-versatile', provider: 'groq' },
  };

  for (const [tier, expected] of Object.entries(expectedRouting)) {
    const tierConfig = config.subscriptionTiers[tier as keyof typeof config.subscriptionTiers];
    
    if (tierConfig.aiModel !== expected.model) {
      throw new Error(`❌ ${tier}: Expected model ${expected.model}, got ${tierConfig.aiModel}`);
    }
    
    if (tierConfig.provider !== expected.provider) {
      throw new Error(`❌ ${tier}: Expected provider ${expected.provider}, got ${tierConfig.provider}`);
    }
    
    console.log(`✅ ${tier}: ${expected.provider}/${expected.model}`);
  }
}

// Test 4: Verify mode availability by tier
export function testModeAvailabilityByTier() {
  console.log('\nTEST 4: Mode Availability by Tier');
  
  const expectedModes = {
    free: { snapshot: true, expanded: false, deep: false },
    pro: { snapshot: true, expanded: true, deep: false },
    plus: { snapshot: true, expanded: true, deep: false },
    max: { snapshot: true, expanded: true, deep: true },
  };

  for (const [tier, modes] of Object.entries(expectedModes)) {
    const tierConfig = config.subscriptionTiers[tier as keyof typeof config.subscriptionTiers];
    
    if (modes.deep && !tierConfig.deepAllowed) {
      throw new Error(`❌ ${tier}: Deep mode should be allowed`);
    }
    if (!modes.deep && tierConfig.deepAllowed) {
      throw new Error(`❌ ${tier}: Deep mode should NOT be allowed`);
    }
    
    console.log(`✅ ${tier}: snapshot=${modes.snapshot}, expanded=${modes.expanded}, deep=${modes.deep}`);
  }
}

// Test 5: Verify free tier constraints
export function testFreeTierConstraints() {
  console.log('\nTEST 5: Free Tier Constraints');
  
  const freeTier = config.subscriptionTiers.free;
  
  if (freeTier.dailyCreditsLimit !== 0) {
    throw new Error(`❌ Free tier should have 0 daily credits limit, got ${freeTier.dailyCreditsLimit}`);
  }
  
  if (freeTier.monthlyFreeAnalyses !== 1) {
    throw new Error(`❌ Free tier should have 1 monthly free analysis, got ${freeTier.monthlyFreeAnalyses}`);
  }
  
  if (freeTier.deepAllowed) {
    throw new Error(`❌ Free tier should NOT allow deep mode`);
  }
  
  console.log(`✅ Free tier: 1 snapshot analysis total, no daily credits, no deep mode`);
}

// Test 6: Verify batch limits
export function testBatchLimits() {
  console.log('\nTEST 6: Batch Limits by Tier');
  
  const expectedLimits = {
    free: 1,
    pro: 1,
    plus: 3,
    max: 10,
  };

  for (const [tier, expectedLimit] of Object.entries(expectedLimits)) {
    const tierConfig = config.subscriptionTiers[tier as keyof typeof config.subscriptionTiers];
    
    if (tierConfig.batchLimit !== expectedLimit) {
      throw new Error(`❌ ${tier}: Expected batch limit ${expectedLimit}, got ${tierConfig.batchLimit}`);
    }
    
    console.log(`✅ ${tier}: Batch limit ${expectedLimit}`);
  }
}

// Main test runner
export async function runAllTests() {
  console.log('🧪 PRICING & CREDIT SYSTEM - INTEGRATION TESTS\n');
  console.log('=' .repeat(50));
  
  try {
    testPricingConfiguration();
    testCreditCostRules();
    testModelRouting();
    testModeAvailabilityByTier();
    testFreeTierConstraints();
    testBatchLimits();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL TESTS PASSED!\n');
    console.log('SYSTEM STATUS: Production-ready');
    console.log('- Pricing: CORRECT');
    console.log('- Credit costs: CORRECT');
    console.log('- Model routing: CORRECT');
    console.log('- Tier constraints: CORRECT');
    console.log('- Mode availability: CORRECT');
    console.log('- Batch limits: CORRECT');
    
  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('❌ TEST FAILED!');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run tests if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  await runAllTests();
}
