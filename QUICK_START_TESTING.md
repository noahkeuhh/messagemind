# Quick Start Guide: Testing Deep Mode

## 60-Second Setup

### Step 1: Start Servers (30 seconds)

**Terminal 1 - Frontend:**
```bash
cd c:\Users\noahb\Downloads\ai-chat-coach-6e9cbb37-main
npm run dev
```
Wait for: `➜ Local: http://localhost:5173`

**Terminal 2 - Backend:**
```bash
cd c:\Users\noahb\Downloads\ai-chat-coach-6e9cbb37-main\backend
npm run dev
```
Wait for: `Server running on http://localhost:3000`

### Step 2: Access Dashboard (20 seconds)

1. Open browser: `http://localhost:5173`
2. Log in with your test account
3. Click "Dashboard" in navigation

### Step 3: Test Deep Mode (10 seconds)

1. **Scroll to bottom** of the AnalysisWorkspace
2. **Find the yellow "DEV MODE" panel**
3. **Click the MAX button**
4. **Confirm**: Toast shows "Tier Updated"
5. **Type a message**: "Hey, what are you doing?"
6. **Click "Deep" mode button** (now available)
7. **Click "Analyze"**
8. **Wait 5-15 seconds** for results

✅ Success: Results appear with deep mode insights

---

## What to Look For

### ✅ Success Indicators

- Yellow debug panel visible at bottom
- Tier buttons clickable
- Toast notification appears when switching tiers
- "Deep" mode button becomes available
- Analysis completes and shows results
- Browser console has NO "JSON parsing" errors

### ❌ Failure Indicators

- Yellow debug panel not visible → Not in dev mode
- Tier button click has no effect → Backend not running
- Error: "Deep Mode Requires Max Tier" → Tier didn't update
- Error: "Network error" → Backend unreachable
- Console: "Unterminated string in JSON" → Prompt issue persists

---

## Console Checks

Press `F12` → Click "Console" tab and look for:

```javascript
// Good - you'll see these logs
[AnalysisWorkspace] Starting analysis: {mode: "deep", hasText: true, hasImage: false}
[AnalysisWorkspace] API response received: {analysis_id: "...", cached: false, credits_charged: 15}
[AnalysisWorkspace] Analysis completed, provider: groq, mode: deep

// Bad - if you see these, there's a problem
Failed to parse AI response as JSON: Unterminated string in JSON
Error: deep_mode_not_allowed
Network error
```

---

## Test All Three Modes

### 1. Test Snapshot (All Tiers)
- Click FREE
- Select "Snapshot"
- Paste: "Hey there!"
- Cost: 5 credits
- ✅ Should work

### 2. Test Expanded (PRO/PLUS/MAX)
- Click PRO
- Toggle "Expanded"
- Cost should show: 13 credits (5 + 8 surcharge)
- ✅ Should work
- Click PLUS
- Select "Expanded"
- Cost should show: 5 credits (no surcharge)
- ✅ Should work

### 3. Test Deep (MAX Only)
- Click MAX
- Select "Deep"
- Cost should show: 6-7 credits (1.25x multiplier)
- Click "Analyze"
- ✅ Should work
- Results should have deep fields: `risk_flags`, `persona_replies`, `timing_matrix`

---

## Verify Credit Calculations

After each analysis, check the credit display:

| Tier | Mode | Input | Expected Cost |
|------|------|-------|---|
| FREE | Snapshot | "Hey" (short, <200 chars) | 5 |
| PRO | Snapshot | "Hey" | 5 |
| PRO | Expanded | "Hey" | 13 (5+8) |
| PLUS | Expanded | "Hey" | 5 (included) |
| MAX | Deep | "Hey" | 6 (5 × 1.25) |
| MAX | Deep | Long text (>200 chars) | 16 (12 × 1.25) |

---

## If Something Goes Wrong

### Debug Panel Not Showing?
```javascript
// Check in console
console.log(import.meta.env.MODE)
// Should print: "development"
// If not, reload page (Ctrl+Shift+R)
```

### Tier Not Updating?
```javascript
// Try from console
api.setUserTier('max')
  .then(r => console.log('Updated to:', r.new_tier))
  .catch(e => console.error('Error:', e.message))
```

### Still Getting JSON Errors?
```javascript
// Check what the API is actually returning
api.executeAction({
  mode: 'deep',
  input_text: 'test message'
})
  .then(r => console.log('Response:', r))
  .catch(e => console.error('Error:', e))
```

---

## Full Documentation

For detailed information, see:
- **DEV_DEBUG_PANEL.md** - Complete debug panel guide
- **TESTING_INFRASTRUCTURE.md** - Full testing workflows
- **MODE_INCLUDED_PREMIUM_IMPLEMENTATION.md** - System overview

---

## Success Checklist

- [ ] Frontend running on `localhost:5173`
- [ ] Backend running on `localhost:3000`
- [ ] Logged in to dashboard
- [ ] Yellow "DEV MODE" panel visible at bottom
- [ ] Can click tier buttons
- [ ] Toast notification appears after tier change
- [ ] Deep mode button appears when tier is MAX
- [ ] Deep mode analysis completes successfully
- [ ] Results show deep mode fields
- [ ] No JSON parsing errors in console
- [ ] Credits deducted correctly

**All checked?** 🎉 Deep Mode is working!

---

## Next: Monitor Production

Once testing is successful:

1. **Monitor real usage** for JSON parsing errors
2. **Check token usage** against caps (520 for MAX deep)
3. **Verify costs** match tier specifications
4. **Validate deep mode insights** with users

If JSON parsing errors appear in production:
- Check `backend/src/services/prompt-templates.service.ts`
- Review Groq API response in logs
- May need to adjust prompt further
