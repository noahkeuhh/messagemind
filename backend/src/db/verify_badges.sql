-- BADGE SYSTEM VERIFICATION QUERIES
-- Run these in Supabase SQL Editor to verify badge system is working

-- 1. Check badges table exists and has 17 badges
SELECT 
  category,
  COUNT(*) as badge_count
FROM badges
GROUP BY category
ORDER BY category;

-- Expected output:
-- mode: 3 badges
-- plan: 3 badges
-- skill: 4 badges
-- streak: 3 badges
-- usage: 4 badges

-- 2. List all badges
SELECT 
  id,
  name,
  category,
  required_tier,
  icon
FROM badges
ORDER BY 
  CASE category
    WHEN 'usage' THEN 1
    WHEN 'streak' THEN 2
    WHEN 'mode' THEN 3
    WHEN 'skill' THEN 4
    WHEN 'plan' THEN 5
  END,
  name;

-- 3. Check user_badges table exists
SELECT COUNT(*) as unlocked_badges_count
FROM user_badges;

-- 4. Check indexes exist
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND (tablename = 'badges' OR tablename = 'user_badges')
ORDER BY tablename, indexname;

-- Expected indexes:
-- badges: idx_badges_category, badges_pkey
-- user_badges: idx_user_badges_unlocked_at, idx_user_badges_user_id, user_badges_pkey

-- 5. Test badge unlock (replace USER_ID with actual user UUID)
-- This will unlock "First Decode" badge for testing
/*
INSERT INTO user_badges (user_id, badge_id, first_event_payload)
VALUES (
  'YOUR_USER_ID_HERE', -- Replace with actual UUID
  'first_analysis',
  '{"analysis_id": "test-001", "mode_used": "snapshot"}'::jsonb
)
ON CONFLICT (user_id, badge_id) DO NOTHING
RETURNING *;
*/

-- 6. Get user's badges (replace USER_ID with actual user UUID)
/*
WITH user_unlocked AS (
  SELECT badge_id, unlocked_at
  FROM user_badges
  WHERE user_id = 'YOUR_USER_ID_HERE'
)
SELECT 
  b.*,
  CASE 
    WHEN u.badge_id IS NOT NULL THEN 'unlocked'
    ELSE 'locked'
  END as status,
  u.unlocked_at
FROM badges b
LEFT JOIN user_unlocked u ON b.id = u.badge_id
ORDER BY 
  CASE WHEN u.badge_id IS NOT NULL THEN 0 ELSE 1 END,
  u.unlocked_at DESC NULLS LAST,
  b.category,
  b.name;
*/

-- 7. Compute user stats (replace USER_ID with actual user UUID)
/*
WITH user_analyses AS (
  SELECT 
    id,
    mode_used,
    text_length,
    has_images,
    interest_level,
    emotional_risk,
    created_at::date as analysis_date
  FROM analyses
  WHERE user_id = 'YOUR_USER_ID_HERE'
    AND status = 'done'
)
SELECT
  COUNT(*) as total_analyses,
  COUNT(*) FILTER (WHERE text_length > 500) as long_text_count,
  COUNT(*) FILTER (WHERE has_images = true) as image_count,
  COUNT(DISTINCT mode_used) as distinct_modes_count,
  ARRAY_AGG(DISTINCT mode_used ORDER BY mode_used) as modes_used,
  MAX(interest_level) as max_interest_level,
  MAX(emotional_risk) as max_emotional_risk,
  COUNT(DISTINCT analysis_date) as total_analysis_days,
  -- Streak calculation (consecutive days ending today)
  (
    WITH RECURSIVE dates AS (
      SELECT CURRENT_DATE as d, 0 as streak
      UNION ALL
      SELECT d - 1, streak + 1
      FROM dates
      WHERE (d - 1) IN (SELECT analysis_date FROM user_analyses)
        AND streak < 365
    )
    SELECT COALESCE(MAX(streak), 0)
    FROM dates
    WHERE d IN (SELECT analysis_date FROM user_analyses)
  ) as current_streak
FROM user_analyses;
*/

-- 8. Check RLS policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND (tablename = 'badges' OR tablename = 'user_badges')
ORDER BY tablename, policyname;

-- Expected policies:
-- badges: badges_select_policy (SELECT)
-- user_badges: user_badges_insert_policy (INSERT), user_badges_select_policy (SELECT)
