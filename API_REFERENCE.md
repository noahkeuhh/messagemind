## 📡 API CHANGES & REFERENCE

### New Response Format

All analysis endpoints now return complete model/mode/credit tracking info.

---

## POST /api/user/action

**Request:**
```json
{
  "mode": "snapshot|expanded|deep",
  "input_text": "string",
  "images": ["url"],
  "use_premium": false
}
```

**Response (202 Accepted - Processing):**
```json
{
  "analysis_id": "uuid",
  "credits_charged": 5,
  "credits_remaining": 95,
  "provider_used": "openai-gpt-4o-mini",
  "model_used": "gpt-4o-mini",
  "mode_used": "snapshot",
  "queued": true,
  "status": "queued",
  "breakdown": {
    "base": 5,
    "inputExtra": 0,
    "outputExtra": 0,
    "modules": 0,
    "premium": 0
  }
}
```

**Error Responses:**
```json
// Insufficient credits
{
  "error": "insufficient_credits",
  "message": "Niet genoeg credits om deze analyse uit te voeren",
  "credits_needed": 12,
  "credits_remaining": 5,
  "breakdown": { /* cost breakdown */ }
}

// Deep mode not allowed
{
  "error": "deep_mode_not_allowed",
  "message": "Deep mode requires Plus or Max tier. Upgrade to access."
}

// Monthly limit reached (Free tier)
{
  "error": "monthly_limit_reached",
  "message": "Je hebt je maandelijkse gratis analyse al gebruikt."
}
```

---

## GET /api/user/analysis/:id

**Response (After processing complete):**
```json
{
  "status": "done",
  "analysis_json": {
    "intent": "string",
    "tone": "string",
    "category": "string",
    "emotional_risk": "low|medium|high",
    "recommended_timing": "string",
    "explanation": "string (expanded/deep only)",
    "suggested_replies": ["string"] or { /* deep format */ },
    "interest_level": "string (optional)",
    "conversation_flow": [ /* deep only */ ],
    "escalation_advice": "string (deep only)",
    "risk_mitigation": "string (deep only)"
  },
  "credits_charged": 5,
  "credits_remaining": 95,
  "provider_used": "openai-gpt-4o-mini",
  "model_used": "gpt-4o-mini",
  "mode_used": "snapshot",
  "tokens_actual": 156,
  "created_at": "2024-12-09T10:30:00Z",
  "updated_at": "2024-12-09T10:30:15Z"
}
```

---

## POST /api/user/subscribe

**Request:**
```json
{
  "tier": "free|pro|plus|max",
  "interval": "month|year"
}
```

**Response:**
```json
{
  "subscription_id": "sub_xxx",
  "client_secret": "seti_xxx",
  "status": "incomplete"
}
```

**New Tier Validation:**
Only valid tiers: `free`, `pro`, `plus`, `max`
(Previously: `pro`, `max`, `vip`)

---

## GET /api/user/credits

**Response:**
```json
{
  "credits_remaining": 95,
  "daily_limit": 100,
  "subscription_tier": "pro",
  "last_reset_date": "2024-12-09T00:00:00Z"
}
```

---

## Provider & Model Mapping

### Free Tier
```
snapshot mode → Groq llama3-8b-instant
provider_used: "groq-llama3-8b"
model_used: "llama3-8b-instant"
```

### Pro Tier
```
snapshot → OpenAI GPT-4o-mini
expanded → OpenAI GPT-4o-mini
provider_used: "openai-gpt-4o-mini"
model_used: "gpt-4o-mini"
```

### Plus Tier
```
snapshot → OpenAI GPT-4o-mini
expanded → OpenAI GPT-4o-mini
images → OpenAI GPT-4o-mini
provider_used: "openai-gpt-4o-mini"
model_used: "gpt-4o-mini"
```

### Max Tier
```
snapshot → OpenAI GPT-4o-mini
expanded → OpenAI GPT-4o-mini
deep → OpenAI GPT-4o
provider_used: "openai-gpt-4o" (for deep) or "openai-gpt-4o-mini"
model_used: "gpt-4o" (for deep) or "gpt-4o-mini"
```

---

## Credit Cost Calculation

### Algorithm
```typescript
1. Determine text length:
   - If text ≤ 200 chars: cost = 5
   - If text > 200 chars: cost = 12
   - If no text: cost = 0

2. Determine image cost:
   - Per image: cost = 30
   - Multiple images: 30 * count

3. Calculate base cost:
   - base_cost = text_cost + image_cost

4. Apply deep mode multiplier (Max tier only):
   - if mode === 'deep':
     - final_cost = ceil(base_cost * 1.2)
   - else:
     - final_cost = base_cost

5. Examples:
   - Short text only: 5 credits
   - Long text only: 12 credits
   - Image + short text: 35 credits
   - Image + long text: 42 credits
   - Image + short text (deep): 42 credits (35 * 1.2 = 42)
   - Image + long text (deep): 51 credits (42 * 1.2 = 50.4 → 51)
```

---

## Response Structure by Mode

### SNAPSHOT (2 fields required)
```json
{
  "intent": "Interested",
  "tone": "Flirty",
  "category": "Question",
  "emotional_risk": "low",
  "recommended_timing": "Respond within 2 hours",
  "suggested_replies": ["Hey!", "What's up?"],
  "interest_level": "85%" // optional
}
```

### EXPANDED (3 fields required)
```json
{
  "intent": "Testing your interest",
  "tone": "Flirty and confident",
  "category": "Conversation starter",
  "emotional_risk": "low",
  "recommended_timing": "Respond within 2 hours",
  "explanation": "She's clearly interested and testing...",
  "suggested_replies": ["Hey!", "What's up?", "How about..."],
  "interest_level": "85%" // optional
}
```

### DEEP (Max tier only)
```json
{
  "intent": "Testing romantic interest",
  "tone": "Playful with undertones",
  "category": "High-value signal",
  "emotional_risk": "low",
  "recommended_timing": "Respond within 1 hour",
  "explanation": {
    "meaning_breakdown": "She's indicating interest...",
    "emotional_context": "Confident and positive...",
    "relationship_signals": "Testing for reciprocal interest...",
    "hidden_patterns": "She's qualified first..."
  },
  "suggested_replies": {
    "playful": "Ha, I like your style 😏",
    "confident": "Interesting observation... tell me more",
    "safe": "Thanks! How have you been?",
    "bold": "You should see what I'm thinking right now",
    "escalation": "Let's find out over coffee this week"
  },
  "conversation_flow": [
    { "you": "Your response goes here" },
    { "them_reaction": "Her likely response pattern" },
    { "you_next": "Your follow-up strategy" }
  ],
  "escalation_advice": "She's ready for in-person...",
  "risk_mitigation": "Be authentic but...",
  "interest_level": "90%" // optional
}
```

---

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `insufficient_credits` | User doesn't have enough credits | Show upgrade modal |
| `monthly_limit_reached` | Free tier used monthly analysis | Show upgrade modal |
| `deep_mode_not_allowed` | Tier doesn't support deep | Disable deep option |
| `mode_not_allowed` | Tier doesn't support mode | Show tier limits |
| `batch_limit_exceeded` | Too many batch inputs | Show batch limit |
| `input_too_large` | Input exceeds max chars | Show error message |
| `user_not_found` | User doesn't exist | Show login screen |
| `analysis_not_found` | Analysis ID not valid | Show error |

---

## UI Implementation Guide

### Display Model & Mode
```tsx
<div className="flex gap-4">
  {providerUsed && (
    <span>Model: {providerUsed}</span>
  )}
  {modeUsed && (
    <span>Mode: {modeUsed}</span>
  )}
</div>
```

### Display Credits
```tsx
<div>
  Credits spent: {creditsCharged}
  Credits remaining: {creditsRemaining}
</div>
```

### Handle Insufficient Credits
```tsx
if (response.error === 'insufficient_credits') {
  showInsufficientCreditsModal({
    needed: response.credits_needed,
    available: response.credits_remaining
  });
}
```

### Handle Mode Restrictions
```tsx
const canUseMode = {
  snapshot: tier !== undefined, // All tiers
  expanded: tier === 'pro' || tier === 'plus' || tier === 'max',
  deep: tier === 'max'
};

if (!canUseMode[selectedMode]) {
  showModeLockedModal(selectedMode);
}
```

---

## Caching (Opt-in)

If response includes `"cached": true`:
- No credits were charged
- Use the analysis_json directly
- Skip the polling step

---

## Testing Endpoints

### Test Free Tier
```bash
curl -X POST http://localhost:3001/api/user/action \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "snapshot",
    "input_text": "Hey! How are you?"
  }'
```

### Test Pro Tier (Expanded Mode)
```bash
curl -X POST http://localhost:3001/api/user/action \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "expanded",
    "input_text": "I've been thinking about what you said last night..."
  }'
```

### Test Max Tier (Deep Mode)
```bash
curl -X POST http://localhost:3001/api/user/action \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "deep",
    "input_text": "I really enjoyed our conversation. I'd like to see you again soon..."
  }'
```

---

## Rate Limiting

- **Default**: 10 requests per minute
- **Window**: 60 seconds
- **Header**: `X-RateLimit-Remaining`

---

## Migration from Old API

### Old Tier Names → New Tier Names
- `pro` → `pro` (unchanged)
- `max` → `plus` (NEW tier)
- `vip` → `max` (NEW top tier)

### Old Response → New Response
```javascript
// OLD
{
  analysis_id: "uuid",
  status: "queued"
}

// NEW
{
  analysis_id: "uuid",
  status: "queued",
  credits_charged: 5,
  credits_remaining: 95,
  provider_used: "openai-gpt-4o-mini",
  model_used: "gpt-4o-mini",
  mode_used: "snapshot",
  breakdown: { /* ... */ }
}
```

---

**Last Updated:** December 9, 2025
**API Version:** 2.0.0 (Breaking changes - requires frontend update)
