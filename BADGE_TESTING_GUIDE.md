# Badge System Testing Guide

## Prerequisites

1. **Database Migration Run**: Execute `backend/src/db/migration_badges.sql` in Supabase SQL Editor
2. **Backend Running**: `cd backend && npm run dev`
3. **Frontend Running**: `cd .. && npm run dev`
4. **Test User**: Have a logged-in user account

## Quick Verification Steps

### 1. Verify Database Setup

**In Supabase SQL Editor:**
```sql
-- Check badges table has 17 badges
SELECT category, COUNT(*) as count
FROM badges
GROUP BY category
ORDER BY category;

-- Expected output:
-- mode: 3, plan: 3, skill: 4, streak: 3, usage: 4
```

### 2. Test API Endpoint

**Using curl or Postman:**
```bash
# Get user's badges (replace YOUR_JWT_TOKEN)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/user/badges
```

**Expected Response:**
```json
{
  "unlocked": [],
  "locked": [
    {
      "id": "first_analysis",
      "name": "First Decode",
      "category": "usage",
      "description": "You ran your first analysis.",
      "icon": "spark",
      "required_tier": null,
      "reward_credits": 0
    }
    // ... 16 more badges
  ]
}
```

### 3. Test Frontend Page

1. Navigate to `http://localhost:5173/badges`
2. Should see:
   - Progress summary card (0/17 badges, 0% complete)
   - 3 tabs: "Alle badges", "Ontgrendeld", "Vergrendeld"
   - All 17 badges shown as locked
   - Badges grouped by category
   - Lock icons on locked badges

### 4. Test Badge Unlocking

**Method A: Complete an Analysis (Recommended)**
1. Go to Dashboard
2. Paste a message and run analysis
3. Wait for analysis to complete
4. Navigate to `/badges` page
5. Should see "First Decode" badge unlocked

**Method B: Manual Database Insert**
```sql
-- In Supabase SQL Editor (replace YOUR_USER_ID)
INSERT INTO user_badges (user_id, badge_id, first_event_payload)
VALUES (
  'YOUR_USER_ID',
  'first_analysis',
  '{"analysis_id": "test-001", "mode_used": "snapshot"}'::jsonb
)
ON CONFLICT (user_id, badge_id) DO NOTHING;
```

**Method C: Test API Endpoint**
```bash
# Manually trigger badge evaluation
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_type": "analysis_completed", "payload": {"analysis_id": "test-001"}}' \
  http://localhost:3000/api/test/trigger-badge-eval
```

## Detailed Test Scenarios

### Scenario 1: First Analysis Badge ✅

**Steps:**
1. Login as new user with no analyses
2. Complete first analysis from Dashboard
3. Navigate to `/badges`

**Expected:**
- "First Decode" badge is unlocked
- Shows unlock timestamp ("vandaag" or "gisteren")
- Badge has gradient background (not grayscale)
- Progress: 1/17 badges (6%)

### Scenario 2: Volume Badges (10, 50, 100)

**Steps:**
1. Complete 10 analyses
2. Check `/badges` page after each analysis

**Expected:**
- After 10: "Signal Reader" unlocks
- After 50: "Signal Hunter" unlocks
- After 100: "Signal Master" unlocks

**Quick Test (Database):**
```sql
-- Create 10 test analyses for your user
INSERT INTO analyses (user_id, input_text, mode, status, created_at)
SELECT 
  'YOUR_USER_ID',
  'Test message ' || generate_series,
  'snapshot',
  'done',
  NOW() - (generate_series || ' hours')::interval
FROM generate_series(1, 10);

-- Then trigger badge eval via test endpoint
```

### Scenario 3: Streak Badges (3, 7, 30 days)

**Steps:**
1. Complete analysis today
2. Complete analysis tomorrow
3. Continue for 3 days

**Expected:**
- After 3 consecutive days: "3-Day Streak" unlocks
- After 7 consecutive days: "7-Day Streak" unlocks
- After 30 consecutive days: "30-Day Streak" unlocks

**Quick Test (Database - Simulated Streak):**
```sql
-- Create analyses for last 7 days
INSERT INTO analyses (user_id, input_text, mode, status, created_at)
SELECT 
  'YOUR_USER_ID',
  'Day ' || generate_series || ' message',
  'snapshot',
  'done',
  (CURRENT_DATE - generate_series) + INTERVAL '12 hours'
FROM generate_series(0, 6);

-- Trigger badge evaluation
```

### Scenario 4: Mode Badges

**4A: Screenshot Detective (First Image)**
1. Upload screenshot in Dashboard
2. Complete analysis with image

**Expected:**
- "Screenshot Detective" badge unlocks

**4B: Deep Diver (First Deep - MAX tier only)**
1. Upgrade to MAX tier
2. Type 100+ character message
3. Select "Deep" mode
4. Complete analysis

**Expected:**
- "Deep Diver" badge unlocks
- Badge shows "MAX" tier requirement when locked

**4C: Mode Explorer (All 3 Modes)**
1. Complete 1 snapshot analysis
2. Complete 1 expanded analysis
3. Complete 1 deep analysis

**Expected:**
- "Mode Explorer" badge unlocks

### Scenario 5: Skill Badges

**5A: Long Reader (500+ chars)**
1. Paste text longer than 500 characters
2. Complete analysis

**Expected:**
- "Long Reader" badge unlocks

**5B: Image Pro (10+ image analyses)**
1. Complete 10 analyses with images

**Expected:**
- "Image Pro" badge unlocks

**5C: Green Flag Hunter (interest_level >= 8)**
1. Analyze a very positive/interested message
2. Get high interest score

**Expected:**
- "Green Flag Hunter" badge unlocks

**5D: Red Flag Aware (emotional_risk >= 7)**
1. Analyze a concerning/risky message
2. Get high emotional risk score

**Expected:**
- "Red Flag Aware" badge unlocks

### Scenario 6: Plan Badges

**6A: PRO Member**
1. Upgrade to PRO tier from Settings

**Expected:**
- "PRO Member" badge unlocks immediately

**6B: PLUS Member**
1. Upgrade to PLUS tier from Settings

**Expected:**
- "PLUS Member" badge unlocks
- "PRO Member" also unlocked (lower tier)

**6C: MAX Member**
1. Upgrade to MAX tier from Settings

**Expected:**
- "MAX Member" badge unlocks
- All plan badges unlocked

## Frontend UI Tests

### Layout Tests
- [ ] Progress card shows correct badge count
- [ ] Progress percentage calculates correctly
- [ ] Tabs show correct badge counts
- [ ] Badges grouped by category
- [ ] Category headers show correct icons
- [ ] Grid responsive (3 cols desktop, 2 tablet, 1 mobile)

### Badge Card Tests
- [ ] Locked badges show lock overlay
- [ ] Locked badges are semi-transparent
- [ ] Unlocked badges show full color
- [ ] Badge icons render correctly (17 different icons)
- [ ] Unlock timestamp shows ("vandaag", "gisteren", "X dagen geleden")
- [ ] Category colors match:
  - Usage: Blue gradient
  - Streak: Orange gradient
  - Mode: Purple gradient
  - Skill: Green gradient
  - Plan: Magenta gradient

### Tab Tests
- [ ] "Alle badges" tab shows all 17 badges
- [ ] "Ontgrendeld" tab shows only unlocked badges
- [ ] "Vergrendeld" tab shows only locked badges
- [ ] Empty state shows when no unlocked badges
- [ ] Empty state shows when all badges unlocked

### Animation Tests
- [ ] Page fades in on load
- [ ] Badge cards have hover scale effect
- [ ] Tab transitions are smooth
- [ ] Loading spinner shows during fetch

## Backend Tests

### Badge Service Tests

**Test computeUserStats():**
```typescript
// In backend console or test file
import { badgeService } from './services/badge.service.js';

const stats = await badgeService.computeUserStats('USER_ID');
console.log(stats);

// Expected output:
// {
//   total_completed_analyses: 5,
//   total_long_text_analyses: 2,
//   total_image_analyses: 1,
//   consecutive_day_streak: 3,
//   high_interest_count: 1,
//   high_risk_count: 0,
//   modes_used: Set(['snapshot', 'expanded'])
// }
```

**Test evaluateAnalysisBadges():**
```bash
# Via test endpoint
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "analysis_completed",
    "payload": {
      "analysis_id": "test-001",
      "mode_used": "deep",
      "text_length": 600,
      "hasImages": true,
      "interest_level": 9,
      "emotional_risk": 2
    }
  }' \
  http://localhost:3000/api/test/trigger-badge-eval
```

**Test evaluatePlanBadges():**
```bash
# Via test endpoint
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "plan_upgraded",
    "payload": {
      "new_plan": "max"
    }
  }' \
  http://localhost:3000/api/test/trigger-badge-eval
```

### Integration Tests

**Test 1: Badge unlocks after analysis completion**
1. Check `analysis-processor.service.ts` logs
2. Should see: `[BadgeService] Evaluating badges for user X`
3. Should see: `[BadgeService] New badge unlocked: first_analysis`

**Test 2: No duplicate unlocks**
1. Complete 2 analyses
2. Check user_badges table
3. Should see only 1 row for "first_analysis"

**Test 3: API returns correct locked/unlocked split**
1. Unlock 2 badges
2. Call GET /api/user/badges
3. Verify: `unlocked: [2 badges]`, `locked: [15 badges]`

## Common Issues & Solutions

### Issue: Badges not unlocking after analysis

**Possible Causes:**
1. Migration not run → Run `migration_badges.sql`
2. Badge service not triggered → Check `analysis-processor.service.ts` logs
3. RLS policies blocking → Check Supabase RLS settings
4. User not authenticated → Verify JWT token

**Debug:**
```sql
-- Check if badge service is trying to insert
SELECT * FROM user_badges ORDER BY unlocked_at DESC LIMIT 10;

-- Check if analyses table has done status
SELECT * FROM analyses WHERE user_id = 'YOUR_USER_ID' AND status = 'done';
```

### Issue: Frontend shows loading forever

**Possible Causes:**
1. Backend not running
2. API endpoint not registered
3. CORS issue
4. Authentication issue

**Debug:**
```bash
# Check backend logs
# Should see: GET /api/user/badges 200

# Check browser console
# Should see: Network request to /api/user/badges
```

### Issue: Streak calculation incorrect

**Possible Causes:**
1. Timezone mismatch
2. Analyses not on consecutive days
3. Dates stored in wrong format

**Debug:**
```sql
-- Check analysis dates
SELECT 
  user_id,
  created_at::date as analysis_date,
  COUNT(*) as count
FROM analyses
WHERE user_id = 'YOUR_USER_ID' AND status = 'done'
GROUP BY user_id, created_at::date
ORDER BY analysis_date DESC;
```

### Issue: Badge icons not showing

**Possible Causes:**
1. Lucide icons not installed
2. Icon name mismatch
3. Component import issue

**Debug:**
```bash
# Check if lucide-react is installed
npm list lucide-react

# Check BadgeIcon.tsx has correct icon mappings
```

## Verification Checklist

### Database ✅
- [ ] badges table exists with 17 rows
- [ ] user_badges table exists
- [ ] Indexes created (3 total)
- [ ] RLS policies active (3 total)

### Backend ✅
- [ ] BadgeService class exists
- [ ] GET /api/user/badges endpoint works
- [ ] POST /api/test/trigger-badge-eval endpoint works
- [ ] Badge evaluation triggers after analysis

### Frontend ✅
- [ ] BadgeIcon component renders
- [ ] BadgeCard component renders
- [ ] Badges page loads without errors
- [ ] API data fetches successfully
- [ ] Tabs filter badges correctly
- [ ] Empty states show correctly

### Integration ✅
- [ ] First analysis unlocks "First Decode"
- [ ] 10 analyses unlock "Signal Reader"
- [ ] 3-day streak unlocks "3-Day Streak"
- [ ] Image analysis unlocks "Screenshot Detective"
- [ ] Deep analysis unlocks "Deep Diver" (MAX tier)
- [ ] Tier upgrade unlocks plan badges

## Performance Benchmarks

- Badge evaluation: < 200ms
- API response: < 100ms
- Page load: < 500ms
- Database query (getUserBadges): < 50ms

## Next Steps After Testing

1. **Add Badge Strip to Dashboard**
   - Show 5 most recent unlocked badges
   - Horizontal scroll
   - Click → navigate to /badges

2. **Add Toast Notifications**
   - Show toast when badge unlocks
   - Badge icon + name + description
   - Celebration animation (confetti?)

3. **Add Badge Sharing**
   - Social media share buttons
   - Generate badge images
   - Share to Twitter/Facebook

4. **Add Badge Rewards**
   - Change reward_credits from 0 to actual values
   - Credit user account when badge unlocks
   - Show "Earned X credits!" in toast

5. **Add Leaderboards**
   - Global badge rankings
   - Friend comparisons
   - Weekly/monthly leaders

---

**Happy testing! 🎉**
