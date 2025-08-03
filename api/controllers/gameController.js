// controllers/gameController.js
const db = require('../db');

const getGameHistory = async (req, res) => {
  // This advanced query uses Common Table Expressions (CTEs) for clarity and performance.
  const query = `
    WITH GamePlayers AS (
      -- Step 1: Aggregate the names of all players for each game into an array.
      SELECT
        le.game_id,
        array_agg(DISTINCT p.name) AS players
      FROM ledger_entries le
      JOIN players p ON le.player_id = p.id
      GROUP BY le.game_id
    ),
    GameWinners AS (
      -- Step 2: Identify the winner and calculate the total pot they won.
      SELECT
        le.game_id,
        p.name AS winner_name,
        SUM(le.amount) AS pot_won
      FROM ledger_entries le
      JOIN players p ON le.player_id = p.id
      WHERE le.entry_type IN ('win', 'penalty_received')
      GROUP BY le.game_id, p.name
    )
    -- Step 3: Join the aggregated data with the main games table.
    SELECT
        g.id,
        g.created_at AS date,
        g.status,
        gp.players,
        g.buy_in_amount,
        COALESCE(gw.winner_name, 'Draw Game') AS winner, -- Show 'Draw Game' if no winner
        COALESCE(gw.pot_won, g.pot_rollover + (g.buy_in_amount * array_length(gp.players, 1))) AS pot,
        g.notes
    FROM games g
    LEFT JOIN GamePlayers gp ON g.id = gp.game_id
    LEFT JOIN GameWinners gw ON g.id = gw.game_id
    WHERE g.status IN ('completed', 'draw') -- Only fetch games that are finished
    ORDER BY g.created_at DESC;
  `;

  try {
    const { rows } = await db.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'An internal server error occurred while fetching game history.' });
  }
};

// We will add createGame and finalizeGame logic here in the future.
module.exports = {
  getGameHistory,
};