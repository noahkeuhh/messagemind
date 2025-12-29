# Deep Mode Network Error - Diagnosis & Solution

## Problem
When attempting deep mode analysis, user gets: "Network error. Please check your connection."

## Root Cause
The user's subscription tier is not 'max'. Deep mode is restricted to MAX tier only:
- Backend returns HTTP 403 Forbidden with error: `deep_mode_not_allowed`
- Frontend was treating all non-200 errors as "Network error"
- User couldn't see the real reason for the failure

## Solution Implemented

### 1. Enhanced Error Handling in Frontend
**File**: `src/lib/api.ts`

Added specific handling for HTTP 403 errors:
```typescript
// Handle 403 - Forbidden (deep mode, batch limit, etc)
if (response.status === 403) {
  const data = await response.json();
  const error: any = {
    error: data.error || 'forbidden',
    message: data.message || 'Access denied',
  };
  throw error;
}
```

Now 403 errors are thrown as structured objects with `error` field for proper handling.

### 2. User-Friendly Error Messages
**File**: `src/components/dashboard/AnalysisWorkspace.tsx`

Added specific error handling:
```typescript
} else if (error.error === "deep_mode_not_allowed") {
  toast({
    title: "Deep Mode Requires Max Tier",
    description: "Deep analysis is only available with a Max subscription. Please upgrade to use this feature.",
    variant: "destructive",
  });
} else if (error.error === "batch_limit_exceeded") {
  toast({
    title: "Batch Limit Exceeded",
    description: error.message || "Your tier does not support this many batch inputs.",
    variant: "destructive",
  });
}
```

Users now see clear messages about why deep mode isn't available.

### 3. Test User Tier Update Script
**File**: `backend/scripts/update-test-user-tier.js`

Helper script to update test user subscription tier:

```bash
# Update user to MAX tier for deep mode testing
node backend/scripts/update-test-user-tier.js <userId> max

# Example with actual user ID
node backend/scripts/update-test-user-tier.js 013299b2-4878-46d7-9124-c09be263c65b max
```

## How to Test Deep Mode

### Step 1: Update Test User to MAX Tier
```bash
node backend/scripts/update-test-user-tier.js 013299b2-4878-46d7-9124-c09be263c65b max
```

This gives the user:
- Subscription tier: `max`
- Daily credit limit: 300
- Access to all modes: snapshot, expanded, deep

### Step 2: Refresh Browser
- Clear session cache or log in again
- Browser will fetch updated tier from `/user/credits` endpoint

### Step 3: Test Deep Analysis
- Go to dashboard
- Enter a message
- Click "Deep" button (should now be available)
- Submit analysis
- Backend will process with deep mode prompt template
- Should receive detailed analysis response

## Tier Requirements

| Mode | Required Tier | Cost (example) | Features |
|------|---|---|---|
| snapshot | FREE/PRO/PLUS/MAX | 5-12 credits | Basic analysis |
| expanded | PRO/PLUS/MAX | 8-12 credits* | More details |
| deep | MAX only | 15-50 credits* | Complete analysis with conversation flow, risk flags, etc |

*Cost depends on input length and other factors

## Files Modified

1. `src/lib/api.ts` - Added 403 error handling
2. `src/components/dashboard/AnalysisWorkspace.tsx` - Added specific error messages
3. `backend/scripts/update-test-user-tier.js` - New test utility script

## Verification

✅ Frontend build: PASSING  
✅ Error handling: Structured error objects properly passed  
✅ User messages: Clear and actionable  
✅ Test utility: Ready to update test users  

## Next Steps

1. Run the tier update script for your test user
2. Reload the browser
3. Try deep mode analysis
4. Verify it works and shows proper detailed response

If you need to test different tiers (free, pro, plus), use the same script with different tier values.
