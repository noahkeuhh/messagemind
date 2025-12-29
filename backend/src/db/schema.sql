-- AI Flirt Studio Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'plus', 'max')),
  daily_credits_limit INTEGER NOT NULL DEFAULT 0,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_free_analysis_date TIMESTAMP WITH TIME ZONE, -- For Free tier: track when last free analysis was used
  monthly_free_analyses_used INTEGER DEFAULT 0, -- For Free tier: count of free analyses used this month
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT
);

-- Credits transactions table
CREATE TABLE IF NOT EXISTS credits_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('daily_reset', 'action_spend', 'purchase', 'admin_adjust', 'signup_bonus', 'refund')),
  amount INTEGER NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analyses (history) table
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input_text TEXT,
  image_url TEXT,
  analysis_result JSONB,
  credits_used INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'done', 'failed')),
  tokens_used INTEGER DEFAULT 0,
  provider_used TEXT,
  model_used TEXT,
  action_type TEXT CHECK (action_type IN ('short_chat', 'long_chat', 'image_analysis')),
  mode TEXT DEFAULT 'snapshot' CHECK (mode IN ('snapshot', 'expanded', 'deep')),
  interest_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analyses table
CREATE INDEX IF NOT EXISTS idx_analyses_provider_used ON analyses(provider_used);
CREATE INDEX IF NOT EXISTS idx_analyses_model_used ON analyses(model_used);
CREATE INDEX IF NOT EXISTS idx_analyses_mode ON analyses(mode);
CREATE INDEX IF NOT EXISTS idx_analyses_interest_level ON analyses(interest_level);

-- Saved replies table
CREATE TABLE IF NOT EXISTS saved_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  reply_type TEXT,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit packs configuration table
CREATE TABLE IF NOT EXISTS credit_packs (
  id TEXT PRIMARY KEY,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT,
  bonus_credits INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin metrics (aggregated daily)
CREATE TABLE IF NOT EXISTS admin_metrics (
  date DATE PRIMARY KEY,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  total_credits_sold INTEGER DEFAULT 0,
  total_ai_tokens_used BIGINT DEFAULT 0,
  revenue_cents BIGINT DEFAULT 0,
  total_analyses INTEGER DEFAULT 0,
  failed_analyses INTEGER DEFAULT 0,
  cohere_tokens_used BIGINT DEFAULT 0,
  openai_tokens_used BIGINT DEFAULT 0,
  claude_tokens_used BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stripe webhook events (for idempotency)
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT false,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Request idempotency (prevent duplicate action calls)
CREATE TABLE IF NOT EXISTS request_idempotency (
  idempotency_key TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_request_idempotency_user_id ON request_idempotency(user_id);
CREATE INDEX IF NOT EXISTS idx_request_idempotency_expires_at ON request_idempotency(expires_at);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_last_reset_date ON users(last_reset_date);
CREATE INDEX IF NOT EXISTS idx_credits_transactions_user_id ON credits_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_transactions_created_at ON credits_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_analyses_provider_used ON analyses(provider_used);
CREATE INDEX IF NOT EXISTS idx_analyses_action_type ON analyses(action_type);
CREATE INDEX IF NOT EXISTS idx_saved_replies_user_id ON saved_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed ON stripe_webhook_events(processed);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_replies ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Credits transactions: users can view their own
CREATE POLICY "Users can view own transactions" ON credits_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Analyses: users can view their own
CREATE POLICY "Users can view own analyses" ON analyses
  FOR SELECT USING (auth.uid() = user_id);

-- Saved replies: users can manage their own
CREATE POLICY "Users can manage own replies" ON saved_replies
  FOR ALL USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default credit packs
INSERT INTO credit_packs (id, credits, price_cents, bonus_credits, is_active) VALUES
  ('pack_50', 50, 500, 0, true),
  ('pack_120', 120, 1000, 20, true),
  ('pack_300', 300, 2000, 50, true)
ON CONFLICT (id) DO NOTHING;


