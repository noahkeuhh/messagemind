# Code Review Checklist - Tier-Based Detail Density v2

**For Code Reviewers**: Use this checklist to verify all requirements are met.

---

## Phase 1: Prompt Templates Review

**File**: `backend/src/services/prompt-templates.service.ts`

### Function Signature
- [ ] `getPromptTemplate()` accepts `tier?: 'free' | 'pro' | 'plus' | 'max'`
- [ ] Parameter is second argument (after mode)
- [ ] Maintains backward compatibility (tier is optional)

### PRO Expanded Prompt
- [ ] Includes "TIER: PRO (LITE DETAILS)" section
- [ ] Specifies fields to include: summary_one_liner, confidence.overall, signals.positive (max 2), reply_pack (max 1)
- [ ] Specifies to omit other optional fields
- [ ] Explanation = 1 short paragraph max
- [ ] **max_tokens = 220**
- [ ] Ends with "Return ONLY valid JSON. No markdown. No extra text."

### PLUS Expanded Prompt
- [ ] Includes "TIER: PLUS (RICH DETAILS)" section
- [ ] Specifies fields: summary_one_liner, full confidence, signals, timing_logic, reply_pack (max 3), next_steps (max 3)
- [ ] Explanation = 2 short paragraphs max
- [ ] **max_tokens = 320**
- [ ] Ends with strict JSON line

### MAX Deep Prompt
- [ ] Includes "TIER: MAX (FULL DETAILS)" section
- [ ] Specifies to always include optional details
- [ ] Lists all fields: summary_one_liner, confidence, micro_signal_map, risk_flags, persona_replies (max 2), timing_matrix, what_not_to_send (max 3)
- [ ] Notes "keep each field concise"
- [ ] **max_tokens = 520**
- [ ] Ends with strict JSON line

### Snapshot Prompt
- [ ] Unchanged (no modifications)

### Default Case
- [ ] Returns `getPromptTemplate('snapshot')` for unknown modes

---

## Phase 2: JSON Validators Review

**File**: `backend/src/services/json-validator.service.ts`

### SnapshotResponseSchema
- [ ] Unchanged (no modifications)

### ExpandedResponseSchema
- [ ] Core fields present and required:
  - [ ] intent: string
  - [ ] tone: string
  - [ ] category: string
  - [ ] emotional_risk: enum ['low', 'medium', 'high']
  - [ ] recommended_timing: string
  - [ ] explanation: string
  - [ ] suggested_replies: array of 3+ strings
  - [ ] interest_level: optional string
- [ ] Optional details block:
  - [ ] details.summary_one_liner: optional string
  - [ ] details.confidence: optional object with 4 optional number fields (0..1)
  - [ ] details.signals: optional object with 3 optional string arrays
  - [ ] details.timing_logic: optional object with why_this_timing and avoid_when
  - [ ] details.reply_pack: optional array of objects (style, text, why_it_works, risk)
  - [ ] details.next_steps: optional string array
- [ ] Schema uses `.strict()` (no extra fields)
- [ ] validateExpandedResponse() function exists and uses schema

### DeepResponseSchema
- [ ] Core fields present and required:
  - [ ] intent, tone, category, emotional_risk, recommended_timing (as before)
  - [ ] explanation: object with 4 required string fields (meaning_breakdown, emotional_context, relationship_signals, hidden_patterns)
  - [ ] suggested_replies: object with 5 required string fields (playful, confident, safe, bold, escalation)
  - [ ] conversation_flow: array of exactly 3 objects (min(3).max(3))
  - [ ] escalation_advice: string
  - [ ] risk_mitigation: string
  - [ ] interest_level: optional string
- [ ] Optional details block:
  - [ ] summary_one_liner: optional string
  - [ ] confidence: optional object with 4 optional fields
  - [ ] micro_signal_map: optional object with 4 optional number fields (0..1)
  - [ ] risk_flags: optional object with 3 optional enum fields
  - [ ] persona_replies: optional array of objects (persona, reply)
  - [ ] timing_matrix: optional object with best_windows and avoid_windows
  - [ ] what_not_to_send: optional string array
- [ ] Schema uses `.strict()`
- [ ] validateDeepResponse() function exists and uses schema
- [ ] Conversation flow validation: exactly 3 steps (min 3, max 3)

### Validation Functions
- [ ] validateSnapshotResponse() unchanged
- [ ] validateExpandedResponse() uses ExpandedResponseSchema
- [ ] validateDeepResponse() uses DeepResponseSchema
- [ ] All functions use try/catch with proper error handling

---

## Phase 3: Analysis Processor Review

**File**: `backend/src/services/analysis-processor.service.ts`

### Prompt Template Call
- [ ] Old: `const isProExpanded = subscriptionTier === 'pro' && mode === 'expanded';`
  `const promptTemplate = getPromptTemplate(mode, subscriptionTier, isProExpanded);`
  
- [ ] New: `const promptTemplate = getPromptTemplate(mode, subscriptionTier as 'free' | 'pro' | 'plus' | 'max');`

- [ ] `isProExpanded` variable removed

- [ ] Tier is passed as second parameter (after mode)

### Result Handling
- [ ] Response validation happens after AI call
- [ ] Details block (if present) stored in analysis_json
- [ ] Core fields always present

---

## Phase 4: Acceptance Tests Review

**File**: `backend/src/services/acceptance-tests-v2.ts`

### Test 1: PRO Expanded LITE Details
- [ ] Calls `getPromptTemplate('expanded', 'pro')`
- [ ] Verifies `maxTokens === 220`
- [ ] Checks prompt includes "PRO (LITE DETAILS)"
- [ ] Checks core JSON shape in prompt

### Test 2: PLUS Expanded RICH Details
- [ ] Calls `getPromptTemplate('expanded', 'plus')`
- [ ] Verifies `maxTokens === 320`
- [ ] Checks prompt includes "PLUS (RICH DETAILS)"
- [ ] Checks detailed fields mentioned in prompt

### Test 3: MAX Deep FULL Details
- [ ] Calls `getPromptTemplate('deep', 'max')`
- [ ] Verifies `maxTokens === 520`
- [ ] Checks prompt includes "MAX (FULL DETAILS)"
- [ ] Checks full field list in prompt

### Test 4: Expanded Response Validation
- [ ] Tests core-only response validates
- [ ] Tests lite details response validates (PRO)
- [ ] Tests rich details response validates (PLUS)

### Test 5: Deep Response with FULL Details
- [ ] Tests deep core response validates
- [ ] Tests full details response validates (MAX)

### Test 6: Token Caps Cost Control
- [ ] Verifies PRO max_tokens = 220
- [ ] Verifies PLUS max_tokens = 320
- [ ] Verifies MAX max_tokens = 520

### Test Summary
- [ ] Prints pass/fail count
- [ ] All tests included and working
- [ ] No import.meta issues (uses export instead)

---

## Phase 5: Documentation Review

### TIER_BASED_DETAIL_DENSITY_V2.md
- [ ] Explains core requirements and what changed
- [ ] Shows optional details block structure
- [ ] Explains tier-based detail rules
- [ ] Documents token caps
- [ ] Includes example responses

### TIER_BASED_DETAIL_DENSITY_COMPLETE.md
- [ ] Detailed implementation guide
- [ ] Cost control verification section
- [ ] Deployment checklist
- [ ] Full example responses (PRO/PLUS/MAX)

### TIER_DETAIL_DENSITY_QUICK_UPDATE.md
- [ ] Quick summary of changes
- [ ] Visual comparison (before/after)
- [ ] Key features highlighted

### TIER_DETAIL_DENSITY_VALIDATION.md
- [ ] Requirement-by-requirement verification
- [ ] Implementation checklist
- [ ] Final validation status

### EXECUTIVE_SUMMARY_TIER_DENSITY.md
- [ ] Business value explanation
- [ ] Technical implementation overview
- [ ] Cost control verification
- [ ] Example responses for each tier

---

## Phase 6: Integration Review

### Backward Compatibility
- [ ] Core JSON fields unchanged
- [ ] Optional details are truly optional
- [ ] Existing code continues to work
- [ ] No database migrations needed
- [ ] API responses extend (not break) format

### Cost Control
- [ ] Token caps set: 220 (PRO), 320 (PLUS), 520 (MAX)
- [ ] Prompts instruct tier-specific detail inclusion
- [ ] Result bounded within token budgets
- [ ] No cost increase despite richer details

### No Regressions
- [ ] Snapshot mode unchanged
- [ ] Snapshot tests still pass
- [ ] Free tier unchanged
- [ ] Existing credit calculations unchanged

---

## Phase 7: Security & Quality Review

### TypeScript
- [ ] No new compilation errors introduced
- [ ] Types match expectations
- [ ] Tier enum values match ('free' | 'pro' | 'plus' | 'max')

### Input Validation
- [ ] Tier parameter is validated (enum check)
- [ ] Mode parameter is validated (enum check)
- [ ] JSON validation preserves strict checking
- [ ] No injection vulnerabilities

### Error Handling
- [ ] Prompts include strict JSON requirements
- [ ] Validation catches malformed responses
- [ ] Retry logic preserved
- [ ] Error messages informative

---

## Final Sign-Off

### Requirements Met
- [ ] All core fields preserved (backward compatible)
- [ ] Optional details v2 structures implemented
- [ ] Tier-based detail rules enforced via prompts
- [ ] Token caps prevent cost increase
- [ ] Validation logic supports optional fields
- [ ] Analysis processor passes tier correctly
- [ ] Acceptance tests comprehensive
- [ ] Documentation complete

### Code Quality
- [ ] No new compilation errors
- [ ] Tests pass
- [ ] No security issues
- [ ] No performance regressions
- [ ] Code is maintainable and clear

### Ready for Deployment
- [ ] All files modified/created correctly
- [ ] All tests pass
- [ ] All documentation complete
- [ ] All requirements verified
- [ ] Low risk (optional fields, backward compatible)

---

## Reviewer Approval

**Reviewed by**: ________________  
**Date**: ________________  
**Status**: ☐ APPROVED ☐ NEEDS CHANGES

**Comments**:
```




```

---

**Template Version**: 1.0  
**Last Updated**: December 10, 2025
