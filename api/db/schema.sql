-- Drop tables if they exist to ensure a clean setup
DROP TABLE IF EXISTS ledger_entries;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS sessions;

-- sessions: Stores Chinese poker game sessions that can be shared via URL
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    session_name VARCHAR(255) NOT NULL,
    session_code VARCHAR(50) UNIQUE NOT NULL, -- Used in shareable URLs
    creator_name VARCHAR(255) NOT NULL,
    creator_password_hash VARCHAR(255) NOT NULL, -- Hashed password for creator access
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- players: Stores a unique entry for each player name per session.
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, name) -- Unique within each session, but can repeat across sessions
);

-- games: Represents a single game within a session.
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    buy_in_amount NUMERIC(10, 2) NOT NULL,
    pot_rollover NUMERIC(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'in_progress' NOT NULL, -- e.g., 'in_progress', 'completed', 'draw'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ledger_entries: The core financial transaction log for every monetary movement.
-- game_id can be NULL for non-game transactions like tips
CREATE TABLE ledger_entries (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    entry_type VARCHAR(50) NOT NULL, -- e.g., 'buy_in', 'win', 'penalty_paid', 'penalty_received', 'tip_sent', 'tip_received'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups on foreign keys
CREATE INDEX idx_players_session ON players (session_id);
CREATE INDEX idx_games_session ON games (session_id);
CREATE INDEX idx_ledger_entries_game ON ledger_entries (game_id);
CREATE INDEX idx_ledger_entries_player ON ledger_entries (player_id);
CREATE INDEX idx_sessions_code ON sessions (session_code); -- For URL lookups
