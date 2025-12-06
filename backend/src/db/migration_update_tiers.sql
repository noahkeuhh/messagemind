-- Migration: Update subscription tiers and add Free tier fields
-- Run this in your Supabase SQL Editor after running schema.sql

-- Update subscription_tier constraint to include 'plus' and remove 'vip'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_tier_check;
ALTER TABLE users ADD CONSTRAINT users_subscription_tier_check 
  CHECK (subscription_tier IN ('free', 'pro', 'plus', 'max'));

-- Add new columns for Free tier monthly analysis tracking
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS last_free_analysis_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS monthly_free_analyses_used INTEGER DEFAULT 0;

-- Update existing 'vip' users to 'max' (if any exist)
UPDATE users SET subscription_tier = 'max' WHERE subscription_tier = 'vip';

-- Update default daily_credits_limit for free tier
UPDATE users SET daily_credits_limit = 0 WHERE subscription_tier = 'free';

-- Add index for free analysis tracking
CREATE INDEX IF NOT EXISTS idx_users_last_free_analysis_date ON users(last_free_analysis_date);

