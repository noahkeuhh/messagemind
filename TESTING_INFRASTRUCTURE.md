# Deep Mode Testing Infrastructure - Complete Implementation

## Executive Summary

A complete development testing infrastructure has been implemented to enable easy testing of the Mode-Included Premium system without requiring manual database modifications or complex environment setup.

**Status**: ✅ COMPLETE AND READY FOR TESTING

---

## What Was Implemented

### 1. Development Debug Panel (Frontend)

**File**: `src/components/dashboard/AnalysisWorkspace.tsx`

A beautiful, intuitive debug panel that appears at the bottom of the analysis workspace in development mode:

- **Visual**: Yellow-themed panel with current tier display
- **Controls**: Four quick-click buttons (FREE, PRO, PLUS, MAX)
- **Feedback**: Toast notifications showing updated tier and credits
- **Visibility**: Development mode only (`import.meta.env.MODE === 'development'`)
- **Tree-shaking**: Completely removed from production builds by Vite

### 2. Backend Tier Update Endpoint

**File**: `backend/src/routes/test.routes.ts`

Development-only API endpoint for changing user tier:

```
POST /api/test/set-user-tier
```

**Features**:
- ✅ Production safety: Only works in development mode
- ✅ Input validation: Checks tier is valid before updating
- ✅ Database safe: Uses supabaseAdmin with proper transaction handling
- ✅ Detailed response: Returns new tier, credits remaining, daily limits
- ✅ Error handling: Clear error messages for validation failures

**Request Body**:
```json
{
  "tier": "free" | "pro" | "plus" | "max"
}
```

**Response**:
```json
{
  "new_tier": "max",
  "credits_remaining": 300,
  "daily_credits_limit": 300,
  "subscription_tier": "max"
}
```

### 3. Frontend API Function

**File**: `src/lib/api.ts`

TypeScript-safe wrapper around the tier endpoint:

```typescript
api.setUserTier(tier: 'free' | 'pro' | 'plus' | 'max'): Promise<UserResponse>
```

**Features**:
- ✅ Full TypeScript support
- ✅ Proper error handling with structured error objects
- ✅ Integrated with existing API client patterns
- ✅ Used by debug panel to update tier

---

## Complete Testing Workflow

### Prerequisites
1. Start frontend dev server: `npm run dev`
2. Start backend dev server: `npm run dev` (in backend folder)
3. Log in to the application
4. Navigate to dashboard

### Test Scenario 1: Test Deep Mode Availability

```
Step 1: Click MAX button in debug panel
  Expected: 
  - Yellow panel shows "Current tier: MAX"
  - Toast: "Tier Updated - Your tier has been changed to MAX. Credits: XXX"
  - "Deep" mode button becomes available
  
Step 2: Paste a test message
  Expected:
  - Text input accepts input normally
  - Mode selector shows "Deep" option
  
Step 3: Click "Deep" mode button
  Expected:
  - Button highlights/selects
  - Cost display updates (1.25x multiplier)
  
Step 4: Click "Analyze"
  Expected:
  - Confirmation modal appears
  - Shows "Deep" mode selected
  - Shows cost calculation
  
Step 5: Click "Confirm"
  Expected:
  - Analysis starts (loading spinner)
  - After 5-15 seconds: Results appear
  - Results should include deep mode fields (risk_flags, persona_replies, etc.)
```

### Test Scenario 2: Test PRO Mode Cost Increase

```
Step 1: Click PRO button in debug panel
  Expected:
  - Tier: "Current tier: PRO"
  - Only "Snapshot" and "Expanded" modes available
  
Step 2: Type "Hello there"
  Expected:
  - Short text (5 credits base)
  - Snapshot mode: 5 credits
  - Toggle Expanded: 5 + 8 = 13 credits
  
Step 3: Type long text (>200 chars)
  Expected:
  - Long text (12 credits base)
  - Snapshot mode: 12 credits
  - Toggle Expanded: 12 + 8 = 20 credits
```

### Test Scenario 3: Test PLUS Mode (Expanded Included)

```
Step 1: Click PLUS button
  Expected:
  - Tier: "Current tier: PLUS"
  - Modes: Snapshot + Expanded available
  - Expanded shows "(included)" label
  
Step 2: Type message and select Expanded
  Expected:
  - Cost stays at base (no +8 surcharge)
  - Analysis includes expanded fields (interest_level, explanation, etc.)
```

### Test Scenario 4: Test FREE Tier Limitation

```
Step 1: Click FREE button
  Expected:
  - Only "Snapshot" mode button visible
  - Cannot toggle other modes
  
Step 2: Try to manually select Expanded
  Expected:
  - Button disabled/hidden
  - Only snapshot analysis available
```

### Test Scenario 5: Monitor Prompt Simplification (v3)

**Purpose**: Verify the new text-only prompts (without JSON examples) fix the JSON parsing errors

```
Step 1: Set tier to MAX
Step 2: Paste several different test messages
Step 3: Request Deep mode for each
Step 4: Monitor browser console

Check for:
  ❌ "Unterminated string in JSON" errors (should be gone)
  ❌ JSON parsing failures
  ✅ "Analysis completed" messages
  ✅ Valid analysis_json in responses
```

---

## Technical Implementation Details

### How the Tier System Works

**Tier Access Control** (`backend/src/routes/user.routes.ts` line ~136):
```typescript
if (mode === 'deep' && user.subscription_tier !== 'max') {
  return res.status(403).json({
    error: 'deep_mode_not_allowed',
    message: 'Deep mode requires MAX tier'
  });
}
```

**Frontend Error Handling** (`src/lib/api.ts`):
```typescript
// HTTP 403 handler creates structured error object
if (response.status === 403) {
  const errorData = await response.json();
  const error: any = new Error(errorData.message);
  error.error = errorData.error;
  throw error;
}
```

**User-Friendly Messages** (`src/components/dashboard/AnalysisWorkspace.tsx`):
```typescript
if (error.error === "deep_mode_not_allowed") {
  toast({
    title: "Deep Mode Requires Max Tier",
    description: "Deep analysis is only available with a Max subscription.",
    variant: "destructive",
  });
}
```

### Token Caps by Tier

These limits are checked in the backend before Groq API calls:

| Tier | Snapshot | Expanded | Deep | Cost |
|------|----------|----------|------|------|
| FREE | 220 tokens | - | - | Base only |
| PRO | 220 tokens | 220 tokens | - | +8 credits for Expanded |
| PLUS | 320 tokens | 320 tokens | - | Included |
| MAX | 320 tokens | 320 tokens | 520 tokens | 1.25x multiplier for Deep |

### Prompt Generation Strategy

**Evolution**:
1. **v1**: Removed JSON examples, kept field descriptions → Still got JSON parsing errors
2. **v2**: Added explicit complete JSON templates → Still got JSON parsing errors
3. **v3** (Current): Removed ALL JSON from prompts, pure English descriptions → Code ready to test

**Files Modified**: `backend/src/services/prompt-templates.service.ts`

**Current Approach**:
- No JSON in system prompts at all
- Field descriptions in plain English
- AI generates fresh JSON without template conflicts
- Groq uses implicit JSON structure from field descriptions

---

## File Manifest

### Modified Files

1. **src/components/dashboard/AnalysisWorkspace.tsx**
   - Added: Development debug panel (lines ~675-710)
   - Purpose: Tier switching UI
   - Size: ~35 lines added

2. **src/lib/api.ts**
   - Added: HTTP 403 error handler (lines ~103-113)
   - Added: `api.setUserTier()` function (lines ~320-329)
   - Purpose: Structured error handling + tier update endpoint
   - Size: ~20 lines added

3. **src/components/dashboard/AnalysisWorkspace.tsx**
   - Modified: Error handling in `handleConfirmAnalyze` (lines ~276-308)
   - Purpose: Display specific error messages for tier restrictions
   - Size: ~30 lines modified

4. **backend/src/routes/test.routes.ts**
   - Added: supabaseAdmin import (line 5)
   - Added: POST `/api/test/set-user-tier` endpoint (lines ~111-165)
   - Purpose: Development-only tier update endpoint
   - Size: ~60 lines added

5. **backend/src/services/prompt-templates.service.ts**
   - Modified: All three mode prompts
   - Purpose: Simplified to text-only, no JSON examples
   - Size: Streamlined while maintaining field specifications

### New Documentation Files

1. **DEV_DEBUG_PANEL.md**
   - Complete guide for using the debug panel
   - Troubleshooting section
   - Technical implementation details

2. **TESTING_INFRASTRUCTURE.md** (this file)
   - Complete testing workflows
   - File manifest
   - Technical details

---

## Build Status

✅ **Frontend Build**: PASSING
```
npm run build
→ Built successfully in 4.45s
→ No new errors introduced
```

✅ **Backend TypeScript**: PASSING
```
npx tsc --noEmit
→ No new errors introduced
→ Pre-existing errors unchanged (stripe/admin/subscription types)
```

---

## Security Considerations

### Development-Only Endpoint

The `/api/test/set-user-tier` endpoint includes a critical safety check:

```typescript
if (config.app.nodeEnv === 'production') {
  return res.status(403).json({
    error: 'not_allowed',
    message: 'This endpoint is only available in development mode'
  });
}
```

**This means**:
- ✅ Cannot be exploited in production
- ✅ Safe to deploy with this code
- ✅ No security risk from leaving it in codebase

### Debug Panel Visibility

The debug panel uses Vite's build-time environment variable:

```typescript
if (import.meta.env.MODE === 'development') {
  // Panel code here
}
```

**This means**:
- ✅ Completely removed from production builds
- ✅ Zero runtime overhead
- ✅ Tree-shaken by Vite during minification
- ✅ No performance impact

---

## Verification Checklist

- ✅ Debug panel UI added to AnalysisWorkspace
- ✅ Backend tier endpoint implemented
- ✅ Frontend API function created
- ✅ Error handling improved for 403 responses
- ✅ User-friendly error messages added
- ✅ Prompts simplified to text-only (v3)
- ✅ Development safety checks in place
- ✅ Frontend builds successfully
- ✅ Backend compiles successfully
- ✅ All tier modes documented
- ✅ Complete testing workflows documented

---

## Next Steps for User

### Immediate Actions

1. **Start Dev Servers**:
   ```bash
   # Terminal 1 - Frontend
   npm run dev
   
   # Terminal 2 - Backend
   cd backend
   npm run dev
   ```

2. **Load Dashboard**:
   - Go to `http://localhost:5173` (or shown port)
   - Log in with test account

3. **Find Debug Panel**:
   - Scroll down in the AnalysisWorkspace
   - Look for yellow "DEV MODE" panel

4. **Test Tier Switching**:
   - Click MAX button
   - Confirm tier updated in panel and toast
   - Verify Deep mode button appears

5. **Test Deep Mode Analysis**:
   - Paste a test message (e.g., "Hey, what are you up to?")
   - Click "Deep" mode
   - Click "Analyze"
   - Monitor console for JSON parsing errors
   - Verify analysis results appear

### Monitoring Points

**Browser Console** (F12 → Console tab):
- Look for errors starting with "Failed to parse AI response"
- Check for "Unterminated string in JSON" (should NOT appear)
- Confirm "[AnalysisWorkspace] Analysis completed" messages

**Network Tab** (F12 → Network tab):
- Monitor POST requests to `/api/user/action`
- Check response contains valid JSON in `analysis_json` field
- Verify response status is 200 (not 403)

**Credits Display**:
- Should update immediately after tier change
- Should decrease after analysis completes
- Should match cost calculation

---

## Troubleshooting Reference

See **DEV_DEBUG_PANEL.md** for detailed troubleshooting section covering:
- Debug panel not showing
- Tier change not working
- Deep mode still showing errors
- JSON parsing errors persisting
- Credit miscalculations

---

## Success Criteria

**Implementation is successful when**:

1. ✅ User can click tier buttons in debug panel
2. ✅ Tier changes are reflected immediately
3. ✅ Deep mode becomes available when tier is MAX
4. ✅ Deep mode analysis completes without JSON parsing errors
5. ✅ Credits are deducted correctly per tier/mode
6. ✅ All three modes (snapshot, expanded, deep) work as expected
7. ✅ Error messages are clear and actionable

**JSON Parsing v3 is successful when**:
- No "Unterminated string in JSON" errors in console
- All deep mode analyses complete successfully
- Analysis results contain expected deep mode fields

---

## Code Examples

### Using the Debug Panel

The debug panel appears automatically in development mode. No manual action needed - just click tier buttons.

### Using setUserTier from Browser Console

If you prefer manual control:

```javascript
// Change to MAX tier
api.setUserTier('max').then(response => {
  console.log('Tier updated:', response.new_tier);
  console.log('Credits:', response.credits_remaining);
});

// Then reload page to refresh UI
location.reload();
```

### Calling Endpoint Directly

```bash
curl -X POST http://localhost:3000/api/test/set-user-tier \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{"tier": "max"}'
```

---

## Summary

All infrastructure is in place for comprehensive testing of the Mode-Included Premium system. The development debug panel provides an intuitive interface for tier switching, error messages are now clear and actionable, and the simplified prompt strategy (v3) is ready to be tested in production.

**Status**: Ready for immediate testing ✅

**Build Status**: Passing ✅

**Documentation**: Complete ✅
