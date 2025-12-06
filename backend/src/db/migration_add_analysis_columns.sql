-- Migration: Add missing columns to analyses table
-- Run this in your Supabase SQL Editor

-- Add provider_used column to track which AI provider was used
ALTER TABLE analyses 
  ADD COLUMN IF NOT EXISTS provider_used TEXT;

-- Add action_type column to track the type of analysis (short_chat, long_chat, image_analysis)
ALTER TABLE analyses 
  ADD COLUMN IF NOT EXISTS action_type TEXT CHECK (action_type IN ('short_chat', 'long_chat', 'image_analysis'));

-- Create index for provider_used if it doesn't exist (already in schema but might fail if column didn't exist)
CREATE INDEX IF NOT EXISTS idx_analyses_provider_used ON analyses(provider_used);

-- Create index for action_type for better query performance
CREATE INDEX IF NOT EXISTS idx_analyses_action_type ON analyses(action_type);


