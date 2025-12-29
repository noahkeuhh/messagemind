-- Migration: Add mode, model_used, and interest_level columns to analyses table
-- Run this in your Supabase SQL Editor

-- Add mode column to track analysis mode (snapshot, expanded, deep)
ALTER TABLE analyses 
  ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'snapshot' CHECK (mode IN ('snapshot', 'expanded', 'deep'));

-- Add model_used column to track which model was used for this analysis
ALTER TABLE analyses 
  ADD COLUMN IF NOT EXISTS model_used TEXT;

-- Add interest_level column (extracted from analysis result for easier querying)
ALTER TABLE analyses 
  ADD COLUMN IF NOT EXISTS interest_level TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analyses_mode ON analyses(mode);
CREATE INDEX IF NOT EXISTS idx_analyses_model_used ON analyses(model_used);
CREATE INDEX IF NOT EXISTS idx_analyses_interest_level ON analyses(interest_level);
