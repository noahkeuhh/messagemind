-- Supabase Database Triggers
-- Run this in your Supabase SQL Editor after creating the schema

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  tier_config JSONB;
  welcome_credits INTEGER;
BEGIN
  -- Default to 'free' tier with zero daily credits (1 free analysis tracked separately)
  tier_config := '{"free": {"dailyCreditsLimit": 0}}'::jsonb;
  welcome_credits := 0;

  -- Create user record
  INSERT INTO public.users (
    id,
    email,
    subscription_tier,
    daily_credits_limit,
    credits_remaining,
    last_reset_date,
    metadata
  ) VALUES (
    NEW.id,
    NEW.email,
    'free',
    welcome_credits,
    welcome_credits,
    NOW(),
    '{}'::jsonb
  );

  -- Create signup bonus transaction
  INSERT INTO public.credits_transactions (
    user_id,
    type,
    amount,
    details
  ) VALUES (
    NEW.id,
    'signup_bonus',
    welcome_credits,
    jsonb_build_object('tier', 'free', 'welcome_bonus', true)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


