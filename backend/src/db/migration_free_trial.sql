-- Migration: Add free trial tracking and update analysis schema
-- Run this in your Supabase SQL Editor

-- Add free_trial_used_at to users table (track when free trial was used)
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_trial_used_at TIMESTAMP WITH TIME ZONE;

-- Add mode_used, analysis_json, and credits_charged columns to analyses if not exist
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS mode_used TEXT DEFAULT 'snapshot' CHECK (mode_used IN ('snapshot', 'expanded', 'deep'));
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS analysis_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS credits_charged INTEGER DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS analysis_hash TEXT;

-- Add index for free trial tracking
CREATE INDEX IF NOT EXISTS idx_users_free_trial_used_at ON users(free_trial_used_at);

-- Add index for analysis_hash (for caching)
CREATE INDEX IF NOT EXISTS idx_analyses_analysis_hash ON analyses(analysis_hash);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id_analysis_hash ON analyses(user_id, analysis_hash);

-- Create credit top-up purchases table
CREATE TABLE IF NOT EXISTS credit_topup_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits_purchased INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_topup_purchases_user_id ON credit_topup_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_topup_purchases_stripe_payment_intent_id ON credit_topup_purchases(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_credit_topup_purchases_status ON credit_topup_purchases(status);

-- Update analyses table to have updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_credit_topup_purchases_updated_at BEFORE UPDATE ON credit_topup_purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
