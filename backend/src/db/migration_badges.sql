-- Badge System Migration
-- Creates badge tables and seeds initial badge definitions

-- 1) badges table
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('usage', 'streak', 'mode', 'skill', 'plan')),
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  required_tier TEXT CHECK (required_tier IN ('free', 'pro', 'plus', 'max')),
  is_active BOOLEAN DEFAULT true,
  reward_credits INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2) user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  first_event_payload JSONB,
  UNIQUE(user_id, badge_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_unlocked_at ON user_badges(unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);

-- Seed badges data
INSERT INTO badges (id, name, category, description, icon, required_tier, reward_credits) VALUES
-- Onboarding / First Steps
('first_analysis', 'First Decode', 'usage', 'You ran your first analysis.', 'spark', NULL, 0),
('first_image', 'Screenshot Detective', 'mode', 'You analyzed your first screenshot or image.', 'image', NULL, 0),
('first_deep', 'Deep Diver', 'mode', 'You unlocked your first Deep analysis.', 'zap', 'max', 0),

-- Usage Volume
('analysis_10', 'Signal Reader', 'usage', '10 messages analyzed.', 'target', NULL, 0),
('analysis_50', 'Signal Hunter', 'usage', '50 messages analyzed.', 'crosshair', NULL, 0),
('analysis_100', 'Signal Master', 'usage', '100 messages analyzed.', 'trophy', NULL, 0),

-- Consistency / Streaks
('streak_3', '3-Day Streak', 'streak', 'Analyzed at least one message 3 days in a row.', 'flame', NULL, 0),
('streak_7', '7-Day Streak', 'streak', 'Analyzed at least one message 7 days in a row.', 'fire', NULL, 0),
('streak_30', '30-Day Streak', 'streak', 'Analyzed at least one message 30 days in a row.', 'sun', NULL, 0),

-- Mode Mix / Exploration
('multi_mode', 'Mode Explorer', 'mode', 'You''ve used Snapshot, Expanded and Deep.', 'layers', NULL, 0),
('long_reader', 'Long Game', 'usage', 'You''ve analyzed 20 long messages.', 'book', NULL, 0),
('image_pro', 'Visual Decoder', 'mode', 'You''ve analyzed 20 images.', 'eye', NULL, 0),

-- Interest & Risk "Skill" Badges
('green_flag_hunter', 'Green Flag Hunter', 'skill', '10 analyses with interest level above 70.', 'heart', NULL, 0),
('red_flag_aware', 'Red Flag Aware', 'skill', '10 analyses with emotional risk marked as medium or high.', 'alert', NULL, 0),

-- Plan / Tier Badges
('pro_member', 'Pro Member', 'plan', 'You unlocked the Pro plan.', 'star', 'pro', 0),
('plus_member', 'Plus Member', 'plan', 'You unlocked the Plus plan.', 'sparkles', 'plus', 0),
('max_member', 'Max Member', 'plan', 'You unlocked the Max plan.', 'crown', 'max', 0)

ON CONFLICT (id) DO NOTHING;

-- Grant permissions
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- RLS policies for badges (read-only for all authenticated users)
CREATE POLICY "Badges are viewable by all authenticated users"
  ON badges FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS policies for user_badges (users can only see their own)
CREATE POLICY "Users can view their own badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin can insert badges (handled by backend service)
CREATE POLICY "Service role can insert user badges"
  ON user_badges FOR INSERT
  TO service_role
  WITH CHECK (true);
