-- Migration: Add support for tips (make game_id nullable for non-game transactions)
-- Run this if you have existing data you want to preserve

ALTER TABLE ledger_entries ALTER COLUMN game_id DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN ledger_entries.game_id IS 'Game ID (nullable for non-game transactions like tips)';
