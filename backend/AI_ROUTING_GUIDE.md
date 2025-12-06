# AI Routing & Premium Upgrade Guide

## Overview

The backend implements intelligent AI provider routing based on subscription tiers and supports premium upgrades for individual requests.

## Provider Routing

### Default Routing by Tier

| Subscription Tier | Default Provider | Model |
|------------------|------------------|-------|
| Free | Cohere | command-r-plus |
| Pro | Cohere | command-r-plus |
| Max | OpenAI | gpt-4-turbo-preview |
| VIP | Claude | claude-3-5-sonnet-20241022 |

### Premium Upgrade

Any user can upgrade a single request to use the premium provider (OpenAI GPT-4) by setting `use_premium: true` in the request. This adds 30 extra credits to the action cost.

## API Usage

### Standard Request

```typescript
POST /api/user/action
{
  "action_type": "short_chat",
  "input_text": "Hey, how are you?",
  "use_premium": false  // Uses tier default
}
```

### Premium Upgrade Request

```typescript
POST /api/user/action
{
  "action_type": "short_chat",
  "input_text": "Hey, how are you?",
  "use_premium": true  // Forces OpenAI GPT-4, adds 30 credits
}
```

**Cost Calculation:**
- Base cost: 5 credits (short_chat)
- Premium upgrade: +30 credits
- **Total: 35 credits**

## Action Costs

| Action Type | Base Cost | With Premium |
|------------|-----------|--------------|
| short_chat | 5 | 35 |
| long_chat | 20 | 50 |
| image_analysis | 50 | 80 |

## Provider Characteristics

### Cohere (Pro/Free)
- **Best for:** Quick, actionable advice
- **Style:** Concise, high-status coaching
- **Speed:** Fast responses
- **Cost:** Lower token usage

### OpenAI GPT-4 (Max/Premium)
- **Best for:** Deep analysis with nuance
- **Style:** Empathetic, tactical, structured
- **Speed:** Moderate
- **Cost:** Higher token usage

### Claude (VIP)
- **Best for:** Psychological depth and emotional intelligence
- **Style:** High-level psychology with escalation strategy
- **Speed:** Moderate
- **Cost:** Highest token usage

## Prompt Templates

Each provider has tailored prompts for different action types:

### Short Chat
- **Cohere:** Concise, actionable advice
- **OpenAI:** Structured with explanation
- **Claude:** Deep emotional reading

### Long Chat
- All providers provide deeper analysis
- More context and nuance
- Extended reply suggestions

### Image Analysis
- OCR extraction (if needed)
- Visual context analysis
- Same analysis structure as text

## Response Format

All providers return standardized JSON:

```json
{
  "intent": "Brief description",
  "intentLabel": "positive" | "neutral" | "negative",
  "toneScore": 0-100,
  "interestLevel": 0-100,
  "flags": ["signal1", "signal2"],
  "suggested_replies": [
    {
      "type": "direct" | "playful" | "confident",
      "text": "Reply text..."
    }
  ],
  "recommended_timing": "Advice on when to respond",
  "tokens_used": 150,
  "confidence": 0.85
}
```

## Configuration

### Environment Variables

```env
# Cohere
COHERE_API_KEY=your_cohere_key

# OpenAI
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4-turbo-preview

# Claude
CLAUDE_API_KEY=your_claude_key
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

### Config File

Provider routing is configured in `src/config/index.ts`:

```typescript
subscriptionTiers: {
  pro: { defaultProvider: 'cohere' },
  max: { defaultProvider: 'openai' },
  vip: { defaultProvider: 'claude' },
},
premiumProvider: 'openai',
actionCosts: {
  premium_upgrade: 30,
}
```

## Testing

### Test All Providers

```bash
GET /api/test/providers?text=Hey, how are you?&action_type=short_chat
```

### Test Mock Mode

If providers aren't configured, the system automatically uses mock mode:

```bash
GET /api/test/mock-analysis?provider=cohere&text=Test message
```

## Monitoring

Admin metrics track token usage per provider:

```sql
SELECT 
  date,
  cohere_tokens_used,
  openai_tokens_used,
  claude_tokens_used,
  total_ai_tokens_used
FROM admin_metrics
ORDER BY date DESC;
```

## Best Practices

1. **Use Premium Wisely:** Premium upgrade costs 30 extra credits. Use for important conversations.

2. **Tier Selection:**
   - **Pro:** Good for regular users who want quick advice
   - **Max:** Best for users who want deeper analysis
   - **VIP:** For users who want psychological depth

3. **Error Handling:** If a provider fails, the system will:
   - Mark analysis as failed
   - Optionally refund credits (if `AUTO_REFUND_ON_FAIL=true`)
   - Log error for monitoring

4. **Rate Limiting:** All endpoints have rate limiting to prevent abuse.

## Troubleshooting

**Provider not working:**
- Check API key in `.env`
- Verify key has correct permissions
- Check provider status page
- Review server logs

**Premium upgrade not working:**
- Verify user has enough credits (base + 30)
- Check `use_premium` is set to `true`
- Verify OpenAI API key is configured

**Wrong provider used:**
- Check user's `subscription_tier`
- Verify tier configuration in `config/index.ts`
- Check if `use_premium` flag is set correctly


