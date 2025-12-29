# Development Debug Panel

## Overview

A development-only debug panel has been added to the **AnalysisWorkspace** component to facilitate testing of the Mode-Included Premium system without requiring manual database modifications.

## Location

- **Component**: `src/components/dashboard/AnalysisWorkspace.tsx`
- **Visibility**: Development mode only (`import.meta.env.MODE === 'development'`)
- **Position**: Below the main analysis workspace, above the modal dialogs

## Features

### Tier Switching

The debug panel displays your current subscription tier and provides quick buttons to switch between all four tiers:

- **FREE**: Limited to snapshot mode
- **PRO**: Snapshot + Expanded modes (expanded adds +8 credits)
- **PLUS**: Snapshot + Expanded modes (expanded included)
- **MAX**: Snapshot + Expanded + Deep modes (deep multiplier 1.25x)

### How to Use

1. **Run in Development Mode**:
   ```bash
   npm run dev
   ```

2. **Navigate to Dashboard**:
   - Log in and go to the dashboard

3. **Look for DEV MODE Panel**:
   - At the bottom of the AnalysisWorkspace, you'll see the yellow "DEV MODE" panel
   - It displays your current tier in bold

4. **Click a Tier Button**:
   - Click **FREE**, **PRO**, **PLUS**, or **MAX** to change your tier
   - The panel updates immediately
   - A toast notification confirms the change with your new credits remaining

5. **Test Mode Features**:
   - After switching to MAX, the "Deep" mode button will be available
   - After switching to PRO or PLUS, the "Expanded" mode toggle will work
   - Free tier limits you to "Snapshot" only

## Technical Details

### Backend Endpoint Used

```
POST /api/test/set-user-tier
```

**Headers**: Same as API authentication

**Body**:
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
  "daily_credits_limit": 300
}
```

### Frontend API Function

Located in `src/lib/api.ts`:

```typescript
api.setUserTier(tier: 'free' | 'pro' | 'plus' | 'max'): Promise<UserResponse>
```

Returns user data with updated tier and credits information.

### Security

- The `/api/test/set-user-tier` endpoint **only works in development mode**
- Attempting to call it in production returns a 403 error
- The endpoint validates the tier parameter before updating

## Testing Workflow

### Test Deep Mode
1. Click **MAX** in the debug panel
2. Confirm tier updated to MAX
3. Click "Deep" mode button
4. Paste a message or upload screenshot
5. Verify analysis generates with deep mode insights

### Test Expanded Mode
1. Click **PRO** in the debug panel
2. Toggle "Expanded" mode on/off
3. Verify cost changes (+8 credits for PRO)
4. Click **PLUS** and verify "Expanded" is included

### Test Free Tier Restriction
1. Click **FREE** in the debug panel
2. Try to toggle modes (only Snapshot available)
3. Verify restricted UI prevents other modes

## Troubleshooting

### Debug Panel Not Showing

**Issue**: Yellow DEV MODE panel doesn't appear at bottom of workspace

**Causes**:
- Not running in development mode (`npm run dev` not used)
- Browser cache not cleared after deployment changes
- Component not reloaded

**Solutions**:
- Verify `npm run dev` is running
- Clear browser cache: `Ctrl+Shift+Delete` → Clear cache
- Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
- Restart dev server

### Tier Change Not Working

**Issue**: Clicking tier button shows error toast

**Possible Errors**:
- "Failed to update tier" - Backend endpoint failed
- Network error - API unreachable

**Solutions**:
- Check backend is running: `npm run dev` in `backend/` folder
- Check network tab in DevTools for 403/500 responses
- Verify tier value is valid: 'free' | 'pro' | 'plus' | 'max'

### Deep Mode Still Shows "Network Error"

**Issue**: Even after setting tier to MAX, deep mode shows error

**Cause**: 
- Credits insufficient for deep mode
- Different browser/session than tier change

**Solutions**:
- Verify credits remaining > 0 in debug panel response
- Check "Credits Remaining" display in dashboard
- Try refreshing the page after tier change
- Manually buy credits from the UI if needed

## Production Notes

The debug panel is **completely invisible** in production builds:

- `import.meta.env.MODE` is set to 'production' in production builds
- The entire conditional block is tree-shaken away by Vite
- Zero performance impact or security risk in production
- No need to remove code - Vite handles it automatically

## Code Changes

### AnalysisWorkspace.tsx

Added at the bottom of the JSX return (lines ~675-710):
- Conditional render checking `import.meta.env.MODE === 'development'`
- Displays yellow panel with tier buttons
- Calls `api.setUserTier()` when button clicked
- Updates local `subscriptionTier` state
- Refreshes credits via `loadCredits()`

### api.ts

Added `setUserTier()` function (lines ~320-329):
- POST request to `/test/set-user-tier`
- Type-safe tier parameter validation
- Returns user data with credits info

### test.routes.ts (Backend)

POST `/api/test/set-user-tier` endpoint (lines ~111-165):
- Development-mode only
- Validates tier parameter
- Updates Supabase user record
- Returns updated user object

## Related Files

- `src/components/dashboard/AnalysisWorkspace.tsx` - Debug panel UI
- `src/lib/api.ts` - Frontend API client
- `backend/src/routes/test.routes.ts` - Backend endpoint
- `backend/src/lib/supabase.ts` - Supabase admin client

## Next Steps

Once you have the debug panel working:

1. **Test each tier** to verify mode availability and pricing
2. **Test deep mode analysis** with MAX tier to check prompt simplification (v3)
3. **Monitor for JSON parsing errors** in browser console
4. **Verify token usage** stays within caps (220/320/520)
5. **Check cost calculations** match tier specifications
