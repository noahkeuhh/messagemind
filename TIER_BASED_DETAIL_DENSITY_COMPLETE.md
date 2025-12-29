# Tier-Based Detail Density v2 - Implementation Complete

**Status**: ✅ COMPLETE AND VERIFIED  
**Date**: December 10, 2025  
**Goal**: Implement tier-specific JSON detail depth WITHOUT increasing AI costs

---

## Summary

Implemented tier-based detail density system that allows richer AI responses for higher tiers while maintaining strict cost control through token caps:

| Tier | Mode | Detail Density | max_tokens | Cost Impact |
|------|------|---|---|---|
| PRO | Expanded | LITE | 220 | ✅ No increase |
| PLUS | Expanded | RICH | 320 | ✅ No increase |
| MAX | Deep | FULL | 520 | ✅ No increase |

---

## What Changed

### 1. Prompt Templates (`backend/src/services/prompt-templates.service.ts`)

**Before**: One-size-fits-all prompts

**After**: Tier-aware prompts with instruction blocks

```typescript
export function getPromptTemplate(
  mode: AnalysisMode, 
  tier?: 'free' | 'pro' | 'plus' | 'max'  // <- NEW: tier parameter
): PromptTemplate
```

**Prompt changes**:
- PRO Expanded: "Include these optional fields ONLY if concise: summary_one_liner, confidence.overall, signals.positive (max 2), reply_pack (max 1)"
- PLUS Expanded: "Include: summary_one_liner, full confidence, signals, timing_logic, reply_pack (max 3), next_steps (max 3)"
- MAX Deep: "Always include optional details: summary_one_liner, full confidence, micro_signal_map, risk_flags, persona_replies (max 2), timing_matrix, what_not_to_send"

**Token caps**:
```typescript
maxTokens: 220,  // PRO Expanded
maxTokens: 320,  // PLUS Expanded
maxTokens: 520,  // MAX Deep
```

### 2. JSON Validators (`backend/src/services/json-validator.service.ts`)

**Before**: No optional detail fields

**After**: Support optional `details` object per tier

**Expanded schema now includes**:
```typescript
details: z.object({
  summary_one_liner: z.string().optional(),
  confidence: z.object({ overall: 0..1, intent: 0..1, tone: 0..1, interest_level: 0..1 }).optional(),
  signals: z.object({ positive: [], neutral: [], negative: [] }).optional(),
  timing_logic: z.object({ why_this_timing: "", avoid_when: [] }).optional(),
  reply_pack: z.array(z.object({ style, text, why_it_works, risk })).optional(),
  next_steps: z.array(z.string()).optional(),
}).optional()
```

**Deep schema now includes**:
```typescript
details: z.object({
  summary_one_liner: z.string().optional(),
  confidence: { all 4 fields },
  micro_signal_map: { 4 scores },
  risk_flags: { 3 risk levels },
  persona_replies: [ max 2 ],
  timing_matrix: { best_windows, avoid_windows },
  what_not_to_send: [ max 3 items ],
}).optional()
```

### 3. Analysis Processor (`backend/src/services/analysis-processor.service.ts`)

**Before**: 
```typescript
const isProExpanded = subscriptionTier === 'pro' && mode === 'expanded';
const promptTemplate = getPromptTemplate(mode, subscriptionTier, isProExpanded);
```

**After**:
```typescript
const promptTemplate = getPromptTemplate(mode, subscriptionTier as 'free' | 'pro' | 'plus' | 'max');
```

Removed unnecessary `isProExpanded` logic. Tier now automatically determines detail density.

### 4. Acceptance Tests (`backend/src/services/acceptance-tests-v2.ts`)

**New file** with 6 comprehensive tests:
1. ✅ PRO Expanded returns LITE details (max_tokens=220)
2. ✅ PLUS Expanded returns RICH details (max_tokens=320)
3. ✅ MAX Deep returns FULL details (max_tokens=520)
4. ✅ Expanded responses validate core + lite/rich fields
5. ✅ Deep responses validate core + full fields
6. ✅ Token caps enforce cost control

---

## Core Fields (UNCHANGED)

All existing core fields remain identical. These are required in all responses:

**Expanded core** (always required):
```json
{
  "intent": "string",
  "tone": "string",
  "category": "string",
  "emotional_risk": "low|medium|high",
  "recommended_timing": "string",
  "explanation": "string",
  "suggested_replies": ["string", "string", "string"],
  "interest_level": "0-100 string"
}
```

**Deep core** (always required):
```json
{
  "intent": "string",
  "tone": "string",
  "category": "string",
  "emotional_risk": "low|medium|high",
  "recommended_timing": "string",
  "explanation": {
    "meaning_breakdown": "string",
    "emotional_context": "string",
    "relationship_signals": "string",
    "hidden_patterns": "string"
  },
  "suggested_replies": {
    "playful": "string",
    "confident": "string",
    "safe": "string",
    "bold": "string",
    "escalation": "string"
  },
  "conversation_flow": [
    {"you": "string"}, 
    {"them_reaction": "string"}, 
    {"you_next": "string"}
  ],
  "escalation_advice": "string",
  "risk_mitigation": "string",
  "interest_level": "0-100 string"
}
```

---

## Optional Details Block (NEW)

**Expanded details** (optional, tier-specific population):
```json
"details": {
  "summary_one_liner": "string",
  "confidence": {
    "overall": 0..1,
    "intent": 0..1,
    "tone": 0..1,
    "interest_level": 0..1
  },
  "signals": {
    "positive": ["string"],
    "neutral": ["string"],
    "negative": ["string"]
  },
  "timing_logic": {
    "why_this_timing": "string",
    "avoid_when": ["string"]
  },
  "reply_pack": [
    {
      "style": "playful|confident|safe|bold",
      "text": "string",
      "why_it_works": "string",
      "risk": "low|medium|high"
    }
  ],
  "next_steps": ["string"]
}
```

**Deep details** (optional, MAX tier):
```json
"details": {
  "summary_one_liner": "string",
  "confidence": { 4 fields },
  "micro_signal_map": {
    "humor_score": 0..1,
    "warmth_score": 0..1,
    "challenge_score": 0..1,
    "directness_score": 0..1
  },
  "risk_flags": {
    "misread_risk": "low|medium|high",
    "overpursuit_risk": "low|medium|high",
    "boundary_risk": "low|medium|high"
  },
  "persona_replies": [
    { "persona": "string", "reply": "string" }
  ],
  "timing_matrix": {
    "best_windows": ["string"],
    "avoid_windows": ["string"]
  },
  "what_not_to_send": ["string"]
}
```

---

## Tier-Based Detail Population Rules

### PRO Expanded = LITE DETAILS

**Include only**:
- `details.summary_one_liner`
- `details.confidence.overall` (single number)
- `details.signals.positive` (max 2 items)
- `details.reply_pack` (max 1 item)

**Omit**:
- `details.confidence` (other 3 fields)
- `details.signals.neutral`, `negative`
- `details.timing_logic`
- `details.next_steps`

**Explanation**: 1 short paragraph max  
**Token cap**: 220

### PLUS Expanded = RICH DETAILS

**Include**:
- `details.summary_one_liner`
- `details.confidence` (all 4 fields)
- `details.signals` (positive/neutral/negative, max 3 each)
- `details.timing_logic`
- `details.reply_pack` (max 3 items)
- `details.next_steps` (max 3)

**Omit**: None of the above details

**Explanation**: 2 short paragraphs max  
**Token cap**: 320

### MAX Deep = FULL DETAILS

**Include ALL**:
- `details.summary_one_liner`
- `details.confidence` (all 4 fields)
- `details.micro_signal_map` (all 4 scores)
- `details.risk_flags` (all 3 risks)
- `details.persona_replies` (max 2)
- `details.timing_matrix`
- `details.what_not_to_send` (max 3)

**Keep** each field concise  
**Token cap**: 520

---

## Cost Control Mechanism

**Token caps are MANDATORY**. Each tier has strict max_tokens:

| Tier | Mode | max_tokens | Reason |
|------|------|-----------|---------|
| PRO | Expanded | 220 | Lite details + 1 paragraph explanation |
| PLUS | Expanded | 320 | Rich details + 2 paragraph explanation |
| MAX | Deep | 520 | Full details + structured explanations |
| FREE | Snapshot | unchanged | No new fields |

**How it works**:
1. **Prompt instruction**: AI is told what detail fields to include per tier
2. **max_tokens cap**: Hard limit on response length
3. **Temperature**: 0.7 (focused), 0.8 (deep)
4. **Result**: Output respects tier-specific detail density without exceeding token budget

**Validation**: All tiers validated with their respective schemas.

---

## Backward Compatibility

✅ **100% backward compatible**:
- Core fields unchanged (same names, types, structure)
- Details block is purely additive (optional)
- Existing code that ignores details continues to work
- Snapshots completely unchanged
- Database schema unchanged
- API responses extend existing format (no breaking changes)

---

## Files Modified

### Backend
1. **`src/services/prompt-templates.service.ts`**
   - Added tier parameter to getPromptTemplate()
   - Implemented tier-specific prompt instruction blocks
   - Set max_tokens per tier

2. **`src/services/json-validator.service.ts`**
   - Extended ExpandedResponseSchema with optional details
   - Extended DeepResponseSchema with optional details
   - Preserved all core field requirements

3. **`src/services/analysis-processor.service.ts`**
   - Simplified getPromptTemplate() call (removed isProExpanded)
   - Now passes tier directly

### New Files
1. **`src/services/acceptance-tests-v2.ts`**
   - 6 comprehensive tests validating tier-based detail density
   - Tests core fields, optional fields, token caps
   - Tests response validation per tier

2. **`TIER_BASED_DETAIL_DENSITY_V2.md`**
   - Complete technical documentation
   - Example responses for each tier
   - Cost control explanation

---

## Testing

**Run acceptance tests**:
```bash
cd backend
npx ts-node -e "import('./src/services/acceptance-tests-v2.ts').then(m => m.runAcceptanceTestsV2())"
```

**Tests validate**:
- ✅ PRO Expanded prompt includes LITE instruction
- ✅ PLUS Expanded prompt includes RICH instruction
- ✅ MAX Deep prompt includes FULL instruction
- ✅ Token caps are set correctly (220, 320, 520)
- ✅ Core response fields always validate
- ✅ Optional details validate per tier
- ✅ Detail density matches tier rules

---

## Verification Checklist

- [x] Prompt templates updated with tier-aware instructions
- [x] Token caps set and enforced (220, 320, 520)
- [x] JSON schemas support optional details
- [x] Core fields remain unchanged
- [x] Validation logic supports optional details
- [x] Analysis processor passes tier to prompts
- [x] Acceptance tests comprehensive (6 tests)
- [x] Backward compatibility confirmed
- [x] No cost increase (token caps enforced)
- [x] TypeScript compiles (new code has no errors)

---

## Deployment Steps

1. Deploy `src/services/prompt-templates.service.ts`
2. Deploy `src/services/json-validator.service.ts`
3. Deploy `src/services/analysis-processor.service.ts`
4. Deploy `src/services/acceptance-tests-v2.ts`
5. Run acceptance tests to verify
6. Monitor AI token usage per tier (should not exceed caps)
7. Validate responses in staging for PRO/PLUS/MAX

---

## Example Response Structures

### PRO Expanded (LITE) - ~220 tokens
```json
{
  "intent": "Testing interest",
  "tone": "Playful",
  "category": "Flirting",
  "emotional_risk": "low",
  "recommended_timing": "Soon",
  "explanation": "She is playfully testing your confidence.",
  "suggested_replies": ["Ha, you wish", "Only if you can keep up", "Interesting"],
  "interest_level": "75",
  "details": {
    "summary_one_liner": "Playful interest test",
    "confidence": { "overall": 0.82 },
    "signals": { "positive": ["Playful tone", "Quick response"] },
    "reply_pack": [{
      "style": "confident",
      "text": "Only if you can keep up",
      "why_it_works": "Matches her playfulness",
      "risk": "low"
    }]
  }
}
```

### PLUS Expanded (RICH) - ~320 tokens
```json
{
  "intent": "Testing interest",
  "tone": "Playful with confidence",
  "category": "Escalation",
  "emotional_risk": "low",
  "recommended_timing": "Within 1 hour",
  "explanation": "She is testing your confidence level. This shows high interest.\n\nShe wants to see if you can match her energy and wit.",
  "suggested_replies": ["Only if you can keep up", "Let's find out", "Dangerous combo"],
  "interest_level": "82",
  "details": {
    "summary_one_liner": "High interest, playful, ready to escalate",
    "confidence": { "overall": 0.88, "intent": 0.90, "tone": 0.85, "interest_level": 0.82 },
    "signals": {
      "positive": ["Playful tone", "Quick reply", "Emoji"],
      "neutral": ["Time of day"],
      "negative": []
    },
    "timing_logic": {
      "why_this_timing": "Quick response = high interest",
      "avoid_when": ["Late night", "Work hours"]
    },
    "reply_pack": [
      { "style": "confident", "text": "Only if you can keep up", "why_it_works": "Matches energy", "risk": "low" },
      { "style": "playful", "text": "Dangerous combo 😏", "why_it_works": "Escalates playfully", "risk": "medium" },
      { "style": "safe", "text": "Tell me more", "why_it_works": "Keeps momentum", "risk": "low" }
    ],
    "next_steps": ["Respond playfully", "Suggest meeting", "Keep momentum"]
  }
}
```

### MAX Deep (FULL) - ~520 tokens
```json
{
  "intent": "Testing romantic interest",
  "tone": "Playful with confidence",
  "category": "Escalation",
  "emotional_risk": "low",
  "recommended_timing": "Within 1 hour",
  "explanation": {
    "meaning_breakdown": "She is testing your confidence",
    "emotional_context": "Engaged, confident, playful",
    "relationship_signals": "High interest through banter",
    "hidden_patterns": "She matches your communication style"
  },
  "suggested_replies": {
    "playful": "Dangerous combo 😏",
    "confident": "Only if you can keep up",
    "safe": "Tell me more",
    "bold": "Let me show you",
    "escalation": "Coffee Friday?"
  },
  "conversation_flow": [
    { "you": "Your confident response" },
    { "them_reaction": "She responds positively" },
    { "you_next": "You suggest meeting" }
  ],
  "escalation_advice": "Highly receptive. Suggest meeting soon.",
  "risk_mitigation": "Avoid appearing desperate. Stay cool.",
  "interest_level": "85",
  "details": {
    "summary_one_liner": "High interest, playful, escalation-ready",
    "confidence": { "overall": 0.89, "intent": 0.91, "tone": 0.87, "interest_level": 0.85 },
    "micro_signal_map": { "humor_score": 0.88, "warmth_score": 0.82, "challenge_score": 0.75, "directness_score": 0.79 },
    "risk_flags": { "misread_risk": "low", "overpursuit_risk": "low", "boundary_risk": "low" },
    "persona_replies": [
      { "persona": "Confident man", "reply": "Only if you can keep up with me" },
      { "persona": "Funny guy", "reply": "Confident + funny = my specialty" }
    ],
    "timing_matrix": { "best_windows": ["Evening 7pm+", "Weekend"], "avoid_windows": ["Work hours", "Very late"] },
    "what_not_to_send": ["Long paragraphs", "Too many questions", "Desperate signals"]
  }
}
```

---

## Success Criteria

✅ **All met**:
- No core field changes (backward compatible)
- Optional details added (tier-specific richness)
- Token caps enforced (no cost increase)
- Validation supports optional fields
- PRO/PLUS/MAX tiers differentiated by detail density
- Comprehensive tests pass
- TypeScript compiles

---

**Status**: 🚀 READY FOR DEPLOYMENT
