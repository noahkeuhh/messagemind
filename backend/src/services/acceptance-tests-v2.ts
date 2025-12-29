/**
 * Acceptance Tests v2 - Tier-Based Detail Density
 * Validates PRO/PLUS/MAX expanded and deep modes with correct detail depth
 * WITHOUT increasing AI costs
 */

import { getPromptTemplate } from './prompt-templates.service.js';
import { 
  ExpandedResponseSchema, 
  DeepResponseSchema,
  validateExpandedResponse,
  validateDeepResponse
} from './json-validator.service.js';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  error?: string;
}

const results: TestResult[] = [];

// ────────────────────────────────────────
// TEST 1: PRO Expanded - LITE Details
// ────────────────────────────────────────
function testProExpandedLiteDetails() {
  console.log('\n📋 TEST 1: PRO Expanded (LITE Details)');
  
  const template = getPromptTemplate('expanded', 'pro');
  
  // Validate max_tokens cap
  const maxTokensCorrect = template.maxTokens === 220;
  
  // Validate prompt includes tier instruction
  const hasLiteInstruction = template.system.includes('PRO (LITE DETAILS)');
  
  const hasCoreExample = 
    template.system.includes('"intent"') &&
    template.system.includes('"explanation"') &&
    template.system.includes('"suggested_replies"');
  
  const passed = maxTokensCorrect && hasLiteInstruction && hasCoreExample;
  
  results.push({
    name: 'PRO Expanded - LITE Details (max_tokens=220)',
    passed,
    details: `
      ✓ max_tokens = 220: ${maxTokensCorrect ? '✅' : '❌'}
      ✓ Has LITE instruction: ${hasLiteInstruction ? '✅' : '❌'}
      ✓ Has core JSON shape: ${hasCoreExample ? '✅' : '❌'}
    `,
  });
  
  console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
}

// ────────────────────────────────────────
// TEST 2: PLUS Expanded - RICH Details
// ────────────────────────────────────────
function testPlusExpandedRichDetails() {
  console.log('\n📋 TEST 2: PLUS Expanded (RICH Details)');
  
  const template = getPromptTemplate('expanded', 'plus');
  
  // Validate max_tokens cap
  const maxTokensCorrect = template.maxTokens === 320;
  
  // Validate prompt includes tier instruction
  const hasRichInstruction = template.system.includes('PLUS (RICH DETAILS)');
  
  // Validate detailed fields mentioned
  const hasDetailedFields = 
    template.system.includes('details.confidence') &&
    template.system.includes('details.signals') &&
    template.system.includes('details.timing_logic') &&
    template.system.includes('details.reply_pack') &&
    template.system.includes('details.next_steps');
  
  const passed = maxTokensCorrect && hasRichInstruction && hasDetailedFields;
  
  results.push({
    name: 'PLUS Expanded - RICH Details (max_tokens=320)',
    passed,
    details: `
      ✓ max_tokens = 320: ${maxTokensCorrect ? '✅' : '❌'}
      ✓ Has RICH instruction: ${hasRichInstruction ? '✅' : '❌'}
      ✓ Mentions detailed fields: ${hasDetailedFields ? '✅' : '❌'}
    `,
  });
  
  console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
}

// ────────────────────────────────────────
// TEST 3: MAX Deep - FULL Details
// ────────────────────────────────────────
function testMaxDeepFullDetails() {
  console.log('\n📋 TEST 3: MAX Deep (FULL Details)');
  
  const template = getPromptTemplate('deep', 'max');
  
  // Validate max_tokens cap
  const maxTokensCorrect = template.maxTokens === 520;
  
  // Validate prompt includes tier instruction
  const hasFullInstruction = template.system.includes('MAX (FULL DETAILS)');
  
  // Validate full detail fields mentioned
  const hasFullDetailFields = 
    template.system.includes('micro_signal_map') &&
    template.system.includes('risk_flags') &&
    template.system.includes('persona_replies') &&
    template.system.includes('timing_matrix') &&
    template.system.includes('what_not_to_send');
  
  const passed = maxTokensCorrect && hasFullInstruction && hasFullDetailFields;
  
  results.push({
    name: 'MAX Deep - FULL Details (max_tokens=520)',
    passed,
    details: `
      ✓ max_tokens = 520: ${maxTokensCorrect ? '✅' : '❌'}
      ✓ Has FULL instruction: ${hasFullInstruction ? '✅' : '❌'}
      ✓ Mentions full fields: ${hasFullDetailFields ? '✅' : '❌'}
    `,
  });
  
  console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
}

// ────────────────────────────────────────
// TEST 4: Expanded Response Validation
// ────────────────────────────────────────
function testExpandedResponseValidation() {
  console.log('\n📋 TEST 4: Expanded Response Validation');
  
  // Core-only response (should always be valid)
  const coreOnlyResponse = {
    intent: 'Testing intent',
    tone: 'Playful',
    category: 'Flirting',
    emotional_risk: 'low' as const,
    recommended_timing: 'Respond soon',
    explanation: 'She is testing your interest',
    suggested_replies: ['Option 1', 'Option 2', 'Option 3'],
    interest_level: '75',
  };
  
  try {
    validateExpandedResponse(coreOnlyResponse);
    results.push({
      name: 'Expanded core-only response validates',
      passed: true,
      details: 'Core fields validated successfully',
    });
    console.log('✅ Core-only response valid');
  } catch (e) {
    results.push({
      name: 'Expanded core-only response validates',
      passed: false,
      details: 'Core fields should validate',
      error: String(e),
    });
    console.log('❌ Core-only response failed validation');
  }
  
  // Response with lite details (PRO)
  const liteDetailsResponse = {
    ...coreOnlyResponse,
    details: {
      summary_one_liner: 'Testing your interest level',
      confidence: { overall: 0.85 },
      signals: { positive: ['Playful tone', 'Quick response'] },
      reply_pack: [{
        style: 'confident',
        text: 'I like where this is going',
        why_it_works: 'Shows interest without being needy',
        risk: 'low',
      }],
    },
  };
  
  try {
    validateExpandedResponse(liteDetailsResponse);
    results.push({
      name: 'Expanded with LITE details (PRO) validates',
      passed: true,
      details: 'Lite details structure validated',
    });
    console.log('✅ Lite details response valid');
  } catch (e) {
    results.push({
      name: 'Expanded with LITE details (PRO) validates',
      passed: false,
      details: 'Lite details should validate',
      error: String(e),
    });
    console.log('❌ Lite details response failed');
  }
  
  // Response with rich details (PLUS)
  const richDetailsResponse = {
    ...coreOnlyResponse,
    details: {
      summary_one_liner: 'Testing romantic interest with playful energy',
      confidence: {
        overall: 0.88,
        intent: 0.9,
        tone: 0.85,
        interest_level: 0.82,
      },
      signals: {
        positive: ['Quick reply', 'Playful tone', 'Emoji usage'],
        neutral: ['Time of day'],
        negative: [],
      },
      timing_logic: {
        why_this_timing: 'She responded quickly, indicating interest',
        avoid_when: ['Late at night', 'During work hours'],
      },
      reply_pack: [
        {
          style: 'confident',
          text: 'I like where this is going',
          why_it_works: 'Shows mutual interest',
          risk: 'low',
        },
        {
          style: 'playful',
          text: 'You better be this fun in person 😏',
          why_it_works: 'Escalates playfully',
          risk: 'medium',
        },
        {
          style: 'safe',
          text: 'Tell me more about that',
          why_it_works: 'Keeps conversation going without risk',
          risk: 'low',
        },
      ],
      next_steps: ['Respond playfully', 'Suggest meeting soon', 'Keep momentum'],
    },
  };
  
  try {
    validateExpandedResponse(richDetailsResponse);
    results.push({
      name: 'Expanded with RICH details (PLUS) validates',
      passed: true,
      details: 'Rich details structure validated',
    });
    console.log('✅ Rich details response valid');
  } catch (e) {
    results.push({
      name: 'Expanded with RICH details (PLUS) validates',
      passed: false,
      details: 'Rich details should validate',
      error: String(e),
    });
    console.log('❌ Rich details response failed');
  }
}

// ────────────────────────────────────────
// TEST 5: Deep Response with FULL Details
// ────────────────────────────────────────
function testDeepResponseFullDetails() {
  console.log('\n📋 TEST 5: Deep Response with FULL Details');
  
  const deepResponse = {
    intent: 'Testing romantic interest',
    tone: 'Playful with confidence',
    category: 'Escalation',
    emotional_risk: 'low' as const,
    recommended_timing: 'Respond within 1 hour',
    explanation: {
      meaning_breakdown: 'She is testing your confidence level',
      emotional_context: 'Playful and engaged',
      relationship_signals: 'Showing interest through humor',
      hidden_patterns: 'Similar communication style to earlier messages',
    },
    suggested_replies: {
      playful: 'Ha, you better be this fun in person 😏',
      confident: 'Only if you can keep up',
      safe: 'Tell me more about that',
      bold: 'Let me know when you are free this week',
      escalation: 'Coffee this Friday?',
    },
    conversation_flow: [
      { you: 'Your response here' },
      { them_reaction: 'She responds positively' },
      { you_next: 'You escalate to meeting' },
    ],
    escalation_advice: 'She is receptive. Suggest meeting soon.',
    risk_mitigation: 'Avoid being too eager. Keep playing it cool.',
    interest_level: '82',
    // Full details for MAX tier
    details: {
      summary_one_liner: 'High interest, playful, ready to escalate',
      confidence: {
        overall: 0.89,
        intent: 0.91,
        tone: 0.87,
        interest_level: 0.85,
      },
      micro_signal_map: {
        humor_score: 0.88,
        warmth_score: 0.82,
        challenge_score: 0.75,
        directness_score: 0.79,
      },
      risk_flags: {
        misread_risk: 'low',
        overpursuit_risk: 'low',
        boundary_risk: 'low',
      },
      persona_replies: [
        {
          persona: 'Confident man',
          reply: 'Only if you can keep up with me',
        },
        {
          persona: 'Funny guy',
          reply: 'Dangerous combo: confident + funny = my specialty',
        },
      ],
      timing_matrix: {
        best_windows: ['Evening after 7pm', 'Weekend mornings'],
        avoid_windows: ['Work hours', 'Very late at night'],
      },
      what_not_to_send: [
        'Long paragraphs about yourself',
        'Asking too many questions',
        'Appearing desperate or needy',
      ],
    },
  };
  
  try {
    validateDeepResponse(deepResponse);
    results.push({
      name: 'Deep response with FULL details validates',
      passed: true,
      details: 'Deep full details structure validated',
    });
    console.log('✅ Deep full details response valid');
  } catch (e) {
    results.push({
      name: 'Deep response with FULL details validates',
      passed: false,
      details: 'Deep full details should validate',
      error: String(e),
    });
    console.log('❌ Deep full details response failed:', e);
  }
}

// ────────────────────────────────────────
// TEST 6: No Cost Increase (Token Caps)
// ────────────────────────────────────────
function testTokenCapsCostControl() {
  console.log('\n📋 TEST 6: Token Caps Enforce Cost Control');
  
  const proExpanded = getPromptTemplate('expanded', 'pro');
  const plusExpanded = getPromptTemplate('expanded', 'plus');
  const maxDeep = getPromptTemplate('deep', 'max');
  
  const proCorrect = proExpanded.maxTokens === 220;
  const plusCorrect = plusExpanded.maxTokens === 320;
  const maxCorrect = maxDeep.maxTokens === 520;
  
  const passed = proCorrect && plusCorrect && maxCorrect;
  
  results.push({
    name: 'Token caps control costs (PRO=220, PLUS=320, MAX=520)',
    passed,
    details: `
      ✓ PRO max_tokens = 220: ${proCorrect ? '✅' : '❌'} (actual: ${proExpanded.maxTokens})
      ✓ PLUS max_tokens = 320: ${plusCorrect ? '✅' : '❌'} (actual: ${plusExpanded.maxTokens})
      ✓ MAX max_tokens = 520: ${maxCorrect ? '✅' : '❌'} (actual: ${maxDeep.maxTokens})
    `,
  });
  
  console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
}

// ────────────────────────────────────────
// RUN ALL TESTS
// ────────────────────────────────────────
export function runAcceptanceTestsV2() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 ACCEPTANCE TESTS v2 - TIER-BASED DETAIL DENSITY');
  console.log('='.repeat(60));
  
  testProExpandedLiteDetails();
  testPlusExpandedRichDetails();
  testMaxDeepFullDetails();
  testExpandedResponseValidation();
  testDeepResponseFullDetails();
  testTokenCapsCostControl();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    console.log(result.details);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`PASSED: ${passCount}/${totalCount}`);
  console.log(passCount === totalCount ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('='.repeat(60) + '\n');
}

// Export function for use
// Can be run with: npx ts-node -e "import('./acceptance-tests-v2.ts').then(m => m.runAcceptanceTestsV2())"
