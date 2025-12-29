# Testing the Prompt Optimization Fix

## The Error You Saw

```
Groq API error: Failed to parse AI response as JSON: 
Unterminated string in JSON at position 1280 (line 15 column 90)
```

## Root Cause

The old prompt template had complex JSON block examples in the system prompt:

```typescript
// OLD - CAUSED ERROR
{
  "intent": "",
  "tone": "",
  "category": "",
  ...
}
```

This confused Groq into generating invalid JSON with unterminated strings.

## The Fix Applied

Rewritten prompts with inline example responses:

```typescript
// NEW - PREVENTS ERROR
{"intent":"testing interest","tone":"playful",...}
```

Plus clearer instructions in plain English instead of JSON blocks.

---

## How to Test the Fix

### Test 1: Quick Snapshot Test

```bash
curl -X POST http://localhost:5000/api/user-action/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "Hey! How are you?",
    "mode": "snapshot"
  }'
```

**Expected**: Valid JSON response with core snapshot fields
**Result**: ✅ PASS if JSON is valid, ❌ FAIL if "Unterminated string" error

### Test 2: PRO Expanded (LITE DETAILS)

```bash
curl -X POST http://localhost:5000/api/user-action/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "Would you like to grab coffee this weekend?",
    "mode": "expanded"
  }'
```

**Expected**: Valid JSON with explanation + 3 suggested replies
**Expected Explanation Length**: 1 short sentence (because PRO tier)
**Result**: ✅ PASS if valid, ❌ FAIL if JSON error

### Test 3: PLUS Expanded (RICH DETAILS)

Same test but with PLUS account:

```bash
curl -X POST http://localhost:5000/api/user-action/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PLUS_TOKEN" \
  -d '{
    "text": "Would you like to grab coffee this weekend? I've been thinking about you...",
    "mode": "expanded"
  }'
```

**Expected**: Valid JSON with explanation + 3 suggested replies
**Expected Explanation Length**: 1-2 sentences (because PLUS tier)
**Check**: max_tokens should not exceed 320
**Result**: ✅ PASS if valid and concise

### Test 4: Deep Mode (MAX tier only)

```bash
curl -X POST http://localhost:5000/api/user-action/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MAX_TOKEN" \
  -d '{
    "text": "I can't stop thinking about our last conversation. Your sense of humor is incredible and you really get me.",
    "mode": "deep"
  }'
```

**Expected**: Complete deep structure with all core fields + structured explanation + conversation_flow
**Check**: All required fields present and valid
**Check**: max_tokens should not exceed 520
**Result**: ✅ PASS if valid

---

## What to Check in Each Response

### Core Field Validity

All modes should have:
```json
{
  "intent": "string (should be meaningful)",
  "tone": "string (should be meaningful)",
  "category": "string (should be meaningful)",
  "emotional_risk": "low | medium | high (must be one of these)",
  "recommended_timing": "string (should be timing advice)",
  "interest_level": "percentage like 75% (should be valid number)"
}
```

### Expanded-Specific Fields

```json
{
  "explanation": "string (should be non-empty)",
  "suggested_replies": ["array", "of", "3", "strings"]
}
```

### Deep-Specific Fields

```json
{
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
  "risk_mitigation": "string"
}
```

---

## Success Criteria

✅ **PASS**: All responses return valid JSON (no parse errors)
✅ **PASS**: All required fields are present and non-empty
✅ **PASS**: Optional fields are handled correctly
✅ **PASS**: Tier-specific differences visible:
   - PRO Expanded: shorter explanations
   - PLUS Expanded: richer explanations
   - MAX Deep: comprehensive with full details

❌ **FAIL**: "Unterminated string in JSON" error appears
❌ **FAIL**: Missing required fields
❌ **FAIL**: Invalid enum values (e.g. emotional_risk = "urgent")

---

## Troubleshooting

### If you still see "Unterminated string" error:

1. Check that you're using the latest code from `prompt-templates.service.ts`
2. Verify `npm run build` completes (pre-existing errors are OK, this file shouldn't add new ones)
3. Restart the backend server
4. Try a fresh request

### If JSON has extra fields:

This is OK - the validators allow optional fields. Check that core fields are valid.

### If explanation is empty:

This might indicate the model is skipping the explanation field. Check if it's because:
- max_tokens is too restrictive (increase by 50 and retest)
- Model is optimizing for other fields
- Text is too simple (try with more complex message)

---

## Automated Test Script

Create `test-tier-density.sh`:

```bash
#!/bin/bash

echo "Testing Snapshot..."
curl -s http://localhost:5000/api/user-action/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"Hi","mode":"snapshot"}' | jq '.' | head -20

echo ""
echo "Testing PRO Expanded..."
curl -s http://localhost:5000/api/user-action/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"Hi there!","mode":"expanded"}' | jq '.' | head -20

echo ""
echo "If you see valid JSON above, the fix works!"
```

---

## Expected Timeline

- ✅ **Immediate**: JSON parsing errors should stop
- ✅ **Next 24h**: Validate with multiple test messages
- ✅ **Next 48h**: Confirm token usage hasn't increased
- ✅ **After validation**: Proceed to Phase 2 (optional details rendering)

---

**Remember**: These prompts are now simpler and clearer. The model should consistently return valid JSON now.

If you still see errors, let me know the exact error message and the input text you were testing.
