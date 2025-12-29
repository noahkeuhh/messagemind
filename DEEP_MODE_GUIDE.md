# Deep Mode Implementation Guide

## How Deep Mode Works

Deep mode is MessageMind's most advanced analysis tier, **exclusively for MAX subscribers**.

### Automatic Mode Selection

Unlike other features, **deep mode is automatically activated** based on input characteristics:

#### MAX Tier Auto-Routing
```
IF user uploads image(s):
  → mode = "deep"
  
ELSE IF short text (≤200 chars) AND no images:
  → mode = "expanded"
  
ELSE:
  → mode = "deep"
```

### Frontend Behavior

- **FREE**: Only shows "Snapshot" button
- **PRO**: Shows "Snapshot" and "Expanded" buttons + toggles
- **PLUS**: No mode selector — shows info text "Mode auto-selected"
- **MAX**: No mode selector — shows info text "Mode auto-selected: Images/Long text → Deep"

### Backend Flow

1. **User submits** analysis with:
   - `mode: 'deep'` (hint from frontend for MAX)
   - `input_text: string`
   - `images?: string[]`
   - `expandedToggle?: boolean` (PRO only)
   - `explanationToggle?: boolean` (PRO only)

2. **routeModel()** determines actual mode:
   ```ts
   determineMode(tier, inputText, hasImages, expandedToggle)
   ```

3. **calculateDynamicCredits()** computes cost:
   ```ts
   // Base cost
   baseTotal = baseText + baseImages + inputExtra
   
   // MAX deep multiplier
   if (tier === 'max' && mode === 'deep') {
     totalCredits = ceil(baseTotal * 1.2)
   }
   ```

4. **getPromptTemplate()** returns deep template:
   - System prompt with full JSON schema
   - maxTokens: 520
   - temperature: 0.8

5. **AI processes** and returns:
   ```json
   {
     "intent": "...",
     "tone": "...",
     "category": "...",
     "emotional_risk": "low|medium|high",
     "recommended_timing": "...",
     "explanation": {
       "meaning_breakdown": "...",
       "emotional_context": "...",
       "relationship_signals": "...",
       "hidden_patterns": "..."
     },
     "suggested_replies": {
       "playful": "...",
       "confident": "...",
       "safe": "...",
       "bold": "...",
       "escalation": "..."
     },
     "conversation_flow": [
       {"you": "..."},
       {"them_reaction": "..."},
       {"you_next": "..."}
     ],
     "escalation_advice": "...",
     "risk_mitigation": "...",
     "interest_level": "80%",
     "details": {
       "summary_one_liner": "...",
       "confidence": {...},
       "micro_signal_map": {...},
       "risk_flags": {...},
       "persona_replies": [...],
       "timing_matrix": {...},
       "what_not_to_send": [...]
     }
   }
   ```

### Credit Costs

| Input Type | Base Cost | MAX Deep Multiplier | Total |
|------------|-----------|---------------------|-------|
| Short text (≤200) | 5 | - | 5 (uses expanded) |
| Long text (>200) | 12 | ×1.2 | 15 |
| 1 image + short text | 35 | ×1.2 | 42 |
| 1 image + long text | 42 | ×1.2 | 51 |

### Testing Deep Mode

1. **Set tier to MAX**:
   ```bash
   POST /api/test/set-user-tier
   { "tier": "max" }
   ```

2. **Test image analysis** (triggers deep):
   ```bash
   POST /api/user/action
   {
     "mode": "deep",
     "input_text": "What does this mean?",
     "images": ["https://example.com/screenshot.jpg"]
   }
   ```

3. **Test long text** (triggers deep):
   ```bash
   POST /api/user/action
   {
     "mode": "deep",
     "input_text": "A very long message over 200 characters..."
   }
   ```

4. **Test short text** (uses expanded, not deep):
   ```bash
   POST /api/user/action
   {
     "mode": "deep",
     "input_text": "Hey"
   }
   ```

### Common Issues

**Q: Deep mode not working?**
- Check user tier is MAX
- Verify GROQ_API_KEY is set
- Check input length or image presence
- Review logs: `[ModelRouting]` and `[AnalysisProcessor]`

**Q: Frontend shows wrong mode?**
- For MAX, mode selector should be hidden
- Backend always overrides requested mode with determineMode()

**Q: Wrong JSON structure returned?**
- Check prompt template for mode='deep'
- Verify maxTokens: 520
- Check AI response parsing in ai-providers.service.ts

### Files Modified

- `backend/src/services/credit-scaling.service.ts` - determineMode(), cost calculation
- `backend/src/services/model-routing.service.ts` - routeModel()
- `backend/src/services/prompt-templates.service.ts` - deep prompt
- `backend/src/routes/user.routes.ts` - endpoint logic
- `src/components/dashboard/AnalysisWorkspace.tsx` - UI behavior
