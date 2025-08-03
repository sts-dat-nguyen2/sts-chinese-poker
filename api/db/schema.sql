-- Drop tables if they exist to ensure a clean setup
DROP TABLE IF EXISTS ledger_entries;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS players;

-- players: Stores a unique entry for each player name.
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- games: Represents a single game session.
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    buy_in_amount NUMERIC(10, 2) NOT NULL,
    pot_rollover NUMERIC(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'in_progress' NOT NULL, -- e.g., 'in_progress', 'completed', 'draw'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ledger_entries: The core financial transaction log for every monetary movement.
CREATE TABLE ledger_entries (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    entry_type VARCHAR(50) NOT NULL, -- e.g., 'buy_in', 'win', 'penalty_paid', 'penalty_received'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups on foreign keys
CREATE INDEX ON ledger_entries (game_id);
CREATE INDEX ON ledger_entries (player_id);