# 🎯 Badge System Quick Reference

## Database Migration (MUST RUN FIRST!)

```sql
-- In Supabase SQL Editor:
-- Copy/paste contents of: backend/src/db/migration_badges.sql
```

**Verify:**
```sql
SELECT COUNT(*) FROM badges; -- Should return: 17
SELECT COUNT(*) FROM user_badges; -- Should return: 0 (initially)
```

## 17 Badges Overview

| Badge ID | Name | Category | Condition | Tier |
|----------|------|----------|-----------|------|
| first_analysis | First Decode | usage | 1st analysis | All |
| analysis_10 | Signal Reader | usage | 10 analyses | All |
| analysis_50 | Signal Hunter | usage | 50 analyses | All |
| analysis_100 | Signal Master | usage | 100 analyses | All |
| streak_3 | 3-Day Streak | streak | 3 consecutive days | All |
| streak_7 | 7-Day Streak | streak | 7 consecutive days | All |
| streak_30 | 30-Day Streak | streak | 30 consecutive days | All |
| first_image | Screenshot Detective | mode | 1st image analysis | All |
| first_deep | Deep Diver | mode | 1st deep analysis | MAX |
| multi_mode | Mode Explorer | mode | All 3 modes used | All |
| long_reader | Long Reader | skill | Text > 500 chars | All |
| image_pro | Image Pro | skill | 10+ image analyses | All |
| green_flag_hunter | Green Flag Hunter | skill | interest_level >= 8 | All |
| red_flag_aware | Red Flag Aware | skill | emotional_risk >= 7 | All |
| pro_member | PRO Member | plan | Upgraded to PRO | PRO+ |
| plus_member | PLUS Member | plan | Upgraded to PLUS | PLUS+ |
| max_member | MAX Member | plan | Upgraded to MAX | MAX |

## API Endpoints

### GET /api/user/badges
Returns user's unlocked and locked badges.

**Response:**
```json
{
  "unlocked": [
    {
      "id": "first_analysis",
      "name": "First Decode",
      "category": "usage",
      "description": "You ran your first analysis.",
      "icon": "spark",
      "required_tier": null,
      "reward_credits": 0,
      "unlocked_at": "2024-01-15T10:30:00Z"
    }
  ],
  "locked": [...]
}
```

### POST /api/test/trigger-badge-eval (TEST ONLY)
Manually trigger badge evaluation.

**Request:**
```json
{
  "event_type": "analysis_completed",
  "payload": {
    "analysis_id": "test-001",
    "mode_used": "deep",
    "text_length": 600,
    "hasImages": true,
    "interest_level": 9,
    "emotional_risk": 2
  }
}
```

## Frontend Routes

- `/badges` - Full badges page with tabs
- Badge components:
  - `BadgeIcon` - Maps 17 icon types
  - `BadgeCard` - Displays individual badge

## Event Flow

```
1. User completes analysis
   ↓
2. analysis-processor.service marks analysis 'done'
   ↓
3. badgeService.evaluateBadgesForEvent() called
   ↓
4. Compute user stats from analyses table
   ↓
5. Evaluate all 17 badge conditions
   ↓
6. Unlock new badges (idempotent)
   ↓
7. Frontend fetches via GET /api/user/badges
```

## Quick Tests

### Test 1: First Analysis Badge
```bash
1. Login
2. Complete analysis from Dashboard
3. Navigate to /badges
4. Verify "First Decode" is unlocked
```

### Test 2: Manual Unlock (Database)
```sql
-- Replace YOUR_USER_ID with actual UUID
INSERT INTO user_badges (user_id, badge_id)
VALUES ('YOUR_USER_ID', 'first_analysis')
ON CONFLICT DO NOTHING;

-- Then refresh /badges page
```

### Test 3: API Test
```bash
curl -H "Authorization: Bearer YOUR_JWT" \
     http://localhost:3000/api/user/badges
```

## Files Changed/Created

### Backend
- ✅ `backend/src/db/migration_badges.sql` (NEW)
- ✅ `backend/src/db/verify_badges.sql` (NEW)
- ✅ `backend/src/services/badge.service.ts` (NEW)
- ✅ `backend/src/services/analysis-processor.service.ts` (MODIFIED)
- ✅ `backend/src/routes/user.routes.ts` (MODIFIED)
- ✅ `backend/src/routes/test.routes.ts` (MODIFIED)

### Frontend
- ✅ `src/components/BadgeIcon.tsx` (NEW)
- ✅ `src/components/BadgeCard.tsx` (NEW)
- ✅ `src/pages/Badges.tsx` (MODIFIED)

### Documentation
- ✅ `BADGE_SYSTEM_COMPLETE.md` (NEW)
- ✅ `BADGE_TESTING_GUIDE.md` (NEW)
- ✅ `BADGE_SYSTEM_VOLTOOID.md` (NEW)
- ✅ `BADGE_QUICK_REFERENCE.md` (NEW - this file)

## Common Commands

### Backend Dev
```bash
cd backend
npm run dev
```

### Frontend Dev
```bash
npm run dev
```

### Database Query
```sql
-- Check badge counts by category
SELECT category, COUNT(*) FROM badges GROUP BY category;

-- Check user's unlocked badges
SELECT b.name, ub.unlocked_at 
FROM user_badges ub
JOIN badges b ON b.id = ub.badge_id
WHERE ub.user_id = 'YOUR_USER_ID'
ORDER BY ub.unlocked_at DESC;
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Badges not unlocking | Run migration, check backend logs |
| API 404 | Verify backend running, check routes |
| Frontend loading forever | Check browser console, verify auth |
| Streak incorrect | Check timezone, verify consecutive days |
| Icons not showing | Check lucide-react installed |

## Next Features (Future)

1. 🎉 **Toast Notifications** - Show when badge unlocks
2. 📊 **Dashboard Strip** - 5 recent badges
3. 🎁 **Reward Credits** - Change from 0 to real values
4. 🏆 **Leaderboards** - Global rankings
5. 📱 **Social Sharing** - Share badges on social media

---

**Status: ✅ VOLLEDIG GEÏMPLEMENTEERD**

Run migration → Test → Enjoy! 🚀
