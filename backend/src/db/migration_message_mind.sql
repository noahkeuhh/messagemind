-- MessageMind Database Migration
-- Adds new fields and tables for the complete system

-- Add new columns to analyses table
ALTER TABLE analyses 
  ADD COLUMN IF NOT EXISTS mode TEXT CHECK (mode IN ('snapshot', 'expanded', 'deep')),
  ADD COLUMN IF NOT EXISTS analysis_hash TEXT,
  ADD COLUMN IF NOT EXISTS tokens_estimated INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tokens_actual INTEGER,
  ADD COLUMN IF NOT EXISTS analysis_json JSONB,
  ADD COLUMN IF NOT EXISTS expanded_toggle BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS explanation_toggle BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS model_version TEXT;

-- Update action_type to support new modes
ALTER TABLE analyses 
  DROP CONSTRAINT IF EXISTS analyses_action_type_check;
ALTER TABLE analyses 
  ADD CONSTRAINT analyses_action_type_check 
  CHECK (action_type IN ('short_chat', 'long_chat', 'image_analysis', 'snapshot', 'expanded', 'deep'));

-- Add index for analysis_hash for caching lookups
CREATE INDEX IF NOT EXISTS idx_analyses_analysis_hash ON analyses(analysis_hash) WHERE analysis_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analyses_mode ON analyses(mode);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id_status ON analyses(user_id, status);

-- Add free trial tracking columns to users table (for FREE tier)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS free_trial_used_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS free_trial_reset_at TIMESTAMP WITH TIME ZONE;

-- Update subscription tiers in users table (already exists, but ensure correct values)
-- Note: daily_credits_limit is already in users table

-- Add idempotency_events table (if not exists, rename from request_idempotency)
CREATE TABLE IF NOT EXISTS idempotency_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_idempotency_events_processed_at ON idempotency_events(processed_at);

-- Update credit_packs with new packs if needed
INSERT INTO credit_packs (id, credits, price_cents, bonus_credits, is_active) VALUES
  ('pack_50', 50, 500, 0, true),
  ('pack_100', 100, 999, 0, true),
  ('pack_120', 120, 1000, 20, true),
  ('pack_200', 200, 1500, 0, true),
  ('pack_300', 300, 2000, 50, true)
ON CONFLICT (id) DO UPDATE SET
  credits = EXCLUDED.credits,
  price_cents = EXCLUDED.price_cents,
  bonus_credits = EXCLUDED.bonus_credits,
  is_active = EXCLUDED.is_active;

-- Function to generate analysis hash (spec-compliant with toggles)
CREATE OR REPLACE FUNCTION generate_analysis_hash(
  p_user_id UUID,
  p_input_text TEXT,
  p_mode TEXT,
  p_model_version TEXT,
  p_expanded_toggle BOOLEAN,
  p_explanation_toggle BOOLEAN
) RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    digest(
      COALESCE(p_user_id::TEXT, '') || 
      COALESCE(p_input_text, '') || 
      COALESCE(p_mode, '') || 
      COALESCE(p_model_version, '') || 
      COALESCE(p_expanded_toggle::TEXT, 'false') ||
      COALESCE(p_explanation_toggle::TEXT, 'false'),
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

