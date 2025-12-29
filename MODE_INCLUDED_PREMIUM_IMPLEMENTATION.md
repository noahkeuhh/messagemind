# MessageMind "Mode-Included Premium" Implementation Guide

## Overview
This document describes the updated MessageMind credit and analysis system with "Mode-Included Premium" logic, which makes Plus and Max tiers feel premium without upgrade friction.

## Changes Implemented

### 1. Backend Mode Routing (Section E)
**File**: `backend/src/services/model-routing.service.ts`

Updated to implement tier-specific mode defaults:

```
FREE:   mode = "snapshot"

PRO:    mode = user_selected ? "expanded" : "snapshot"

PLUS:   mode = (isShort && !hasImages) ? "snapshot" : "expanded"
        (Short = text ≤ 200 chars)

MAX:    if hasImages → "deep"
        else if isShort → "expanded"
        else → "deep"
```

- All tiers use Groq llama-3.3-70b-versatile
- Automatically determines mode based on input and tier
- No user mode selection for PLUS/MAX (pre-determined)
- PRO tier: User can toggle between snapshot and expanded

### 2. Credit Calculation Logic (Section F, C)
**File**: `backend/src/services/credit-scaling.service.ts`

Implements "Mode-Included Premium" cost policy:

#### Base Costs (All Tiers)
- Short text (≤200 chars): 5 credits
- Long text (>200 chars): 12 credits  
- Image: 30 credits each
- Image + text: sum of each
- Extra long penalty: floor(length/500) additional credits

#### Tier-Specific Surcharges
**FREE**:
- total = baseTotal (snapshot only)

**PRO**:
- Snapshot: total = baseTotal
- Expanded: total = baseTotal + 8 (shown as "+8 credits" in UI)

**PLUS**:
- Expanded INCLUDED (no surcharge)
- total = baseTotal (regardless of mode)
- Short inputs default to snapshot automatically, no surcharge
- UI shows: "Expanded included in Plus"

**MAX**:
- Deep INCLUDED via built-in multiplier
- if mode == 'deep': total = ceil(baseTotal × 1.25)
- else: total = baseTotal
- UI shows: "Deep included in Max"

**Algorithm**:
1. Calculate base text + image cost
2. Add input extra penalty (floor(length/500))
3. Multiply by batch count
4. Apply tier/mode surcharges
5. Deduct credits BEFORE AI call atomically

### 3. Frontend Input Area UI (Section J)
**File**: `src/components/dashboard/AnalysisWorkspace.tsx`

Updated to show:
- Real-time credit estimate based on tier + mode rules
- Tier badge (FREE | PRO | PLUS | MAX)
- Mode buttons (only available modes for tier)
- Mode labels with context:
  - PLUS: "Expanded (included)"
  - MAX: "Deep (included)"
- Cost breakdown showing input type (text only / image only / image+text)
- No mode toggle for PLUS/MAX (auto-determined)
- PRO only: "Expanded (+8 credits)" label

**Key Functions**:
- `getAvailableModes()`: Returns modes available for user's tier
- `getModeLabelWithContext()`: Shows tier-specific mode labels
- `getActionCost()`: Calculates cost based on tier, mode, input

### 4. Remove Upgrade Buttons (Section J)
**File**: `src/components/dashboard/AnalysisResults.tsx`

Removed upgrade buttons for PLUS and MAX tiers:

**PRO Tier**:
- Snapshot mode shows "Upgrade to Expanded (+8 credits)" button
- Expanded/Deep shows "Deep Mode not available in Pro" info

**PLUS Tier**:
- Snapshot shows "Expanded included in Plus" (no button, info only)
- Deep mode shows "Upgrade to Max tier to unlock Deep"

**MAX Tier**:
- All modes show "Deep mode included in Max" (no buttons)
- Premium feel with all features included

**FREE Tier**:
- Shows upgrade modal when attempting Expanded/Deep
- "Expanded & Deep are included in Plus and Max"

### 5. Analysis Results Display (Section J)
**File**: `src/components/dashboard/AnalysisResults.tsx`

Header shows:
- Provider used (e.g., "groq")
- Mode used (snapshot | expanded | deep)
- Credits spent (-X)
- Credits remaining (Y)

Tabs:
- Overview: Always shown
- Explanation: Shown for expanded/deep modes
- Deep Analysis: Only shown for deep mode

Conditional sections:
- Interest level gauge: 0-39 Low, 40-69 Medium, 70-100 High
- Deep-only sections: conversation_flow, expanded explanation blocks
- Provider-specific output: JSON structure varies by mode

### 6. API Response Format
**Files**:
- `backend/src/routes/user-action.routes.ts`
- `backend/src/routes/user.routes.ts`

Returns:
```json
{
  "analysis_id": "uuid",
  "status": "done|processing|error",
  "analysis_json": {...},
  "credits_charged": 12,
  "credits_remaining": 88,
  "provider_used": "groq-llama3-8b",
  "mode_used": "expanded",
  "tokens_actual": 250,
  "created_at": "2025-01-01T00:00:00Z"
}
```

## Testing Checklist

### FREE Tier
- [ ] 1 snapshot analysis works per month
- [ ] Expanded/Deep attempts show upgrade modal
- [ ] No surcharges for any mode
- [ ] Correct credit usage: 5 (short), 12 (long)

### PRO Tier
- [ ] Snapshot short: 5 credits
- [ ] Expanded short: 5 + 8 = 13 credits
- [ ] Expanded toggle shows "+8 credits" in UI
- [ ] Deep mode shows as locked
- [ ] Mode toggle works for snapshot ↔ expanded
- [ ] 100 credits/day limit enforced

### PLUS Tier
- [ ] Short text: 5 credits (snapshot mode, auto)
- [ ] Long text: 12 credits (expanded mode, auto)
- [ ] No upgrade buttons shown
- [ ] "Expanded included" messaging shown
- [ ] Mode buttons visible but read-only (auto-selected)
- [ ] 180 credits/day limit enforced
- [ ] Image support works: 30 credits per image

### MAX Tier
- [ ] Short text: 5 or 12 credits (expanded mode based on length)
- [ ] Long text: deep mode = ceil(12 × 1.25) = 15 credits
- [ ] Image: deep mode = ceil(30 × 1.25) = 38 credits
- [ ] "Deep included in Max" messaging shown
- [ ] No upgrade buttons shown
- [ ] Mode buttons visible but read-only (auto-selected)
- [ ] 300 credits/day limit enforced
- [ ] Deep mode tabs visible and functional

## Implementation Notes

1. **Mode Routing is Automatic**
   - Users don't select modes in PLUS/MAX
   - Backend determines mode based on tier + input
   - Frontend shows auto-selected mode for preview

2. **Cost Policy Avoids "Double Pay"**
   - PLUS: Expanded cost = base cost (no surcharge)
   - MAX: Deep cost = base × 1.25 (silent multiplier, no surcharge shown)
   - PRO: Expanded cost = base + 8 (clearly shown)

3. **JSON Output Strict Validation**
   - All modes include interest_level (0-100)
   - Deep mode has expanded explanation object
   - Server-side validation with retry logic (spec section I)

4. **Credit Deduction Atomic**
   - Credits deducted BEFORE AI call
   - No double charging
   - Failure handling with potential refunds

5. **Backwards Compatibility**
   - Existing API fields preserved
   - New fields added, old fields kept
   - Legacy upgrade modals still work for FREE tier

## Configuration

These values are pre-configured in `backend/src/config/index.ts`:

```typescript
creditScaling: {
  shortThresholdChars: 200,      // <= 200 = short
  textShortCredits: 5,            // Cost for short text
  textLongCredits: 12,            // Cost for long text
  imageBaseCredits: 30,           // Cost per image
  deepModeMultiplier: 1.25,       // MAX tier deep mode multiplier
  premiumFeeCredits: 0,           // Removed (kept for compatibility)
  moduleCredits: 0,               // Removed (kept for compatibility)
}
```

## Future Enhancements

Not yet implemented (mentioned in spec):

1. **Section G - Credit Top-ups**
   - +50 credits → €5
   - +100 credits → €9.99
   - Trigger when <20% of daily allowance
   - Stripe integration for purchases

2. **Section I - Strict JSON Validation**
   - Server-side parsing with 1x retry
   - Error marking if invalid

3. **Section L - Acceptance Tests**
   - Full tier credit calculation tests
   - Mode routing tests
   - End-to-end integration tests

## Summary

The "Mode-Included Premium" system makes the tier hierarchy feel natural:
- **FREE**: Limited but functional (1 monthly snapshot)
- **PRO**: Entry-level with optional upgrades (Expanded toggle +8)
- **PLUS**: Feels instantly better (Expanded included, no surcharges)
- **MAX**: Top-tier (Deep included with smart routing)

Costs are controlled through:
1. Base costs (5/12/30 credits)
2. Mode routing (automatic by tier)
3. Silent multipliers (1.25x for MAX Deep)
4. Input penalties (floor(length/500))

No upgrade buttons or friction for PLUS/MAX users - they get premium features automatically.
