// controllers/gameController.js
const db = require('../db');

const getGameHistory = async (req, res) => {
  const { sessionCode } = req.params;

  try {
    // First get the session ID
    const sessionQuery = 'SELECT id FROM sessions WHERE session_code = $1';
    const { rows: sessionRows } = await db.query(sessionQuery, [sessionCode]);

    if (sessionRows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionId = sessionRows[0].id;

  // This advanced query uses Common Table Expressions (CTEs) for clarity and performance.
  const query = `
    WITH GamePlayers AS (
      -- Step 1: Aggregate the names of all players for each game into an array.
      SELECT
        le.game_id,
        array_agg(DISTINCT p.name) AS players
      FROM ledger_entries le
      JOIN players p ON le.player_id = p.id
      JOIN games g ON le.game_id = g.id
      WHERE g.session_id = $1
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
    ),
    PenaltyDetails AS (
        -- Step 3: Aggregate the names of all penalized players for each game.
        SELECT
            le.game_id,
            array_agg(p.name) as penalized_players
        FROM ledger_entries le
        JOIN players p ON le.player_id = p.id
        WHERE le.entry_type = 'penalty_paid'
        GROUP BY le.game_id
    ),
    GameOutcomes AS (
        -- Step 4: Calculate the net outcome for each player in each game.
        SELECT
            le.game_id,
            p.name,
            SUM(le.amount) as net_amount
        FROM ledger_entries le
        JOIN players p ON le.player_id = p.id
        GROUP BY le.game_id, p.name
    )
    -- Step 5: Join all the aggregated data with the main games table.
    SELECT
        g.id,
        g.created_at AS "createdAt",
        g.status,
        gp.players,
        g.buy_in_amount AS "buyInAmount",
        g.pot_rollover AS "potRollover",
        COALESCE(gw.winner_name, 'Draw Game') AS winner,
        COALESCE(gw.pot_won, g.pot_rollover + (g.buy_in_amount * array_length(gp.players, 1))) AS pot,
        g.notes,
        pd.penalized_players AS "penalizedPlayers",
        (
            SELECT json_agg(
                json_build_object('name', go.name, 'amount', go.net_amount)
            )
            FROM GameOutcomes go
            WHERE go.game_id = g.id
        ) as outcomes
    FROM games g
    LEFT JOIN GamePlayers gp ON g.id = gp.game_id
    LEFT JOIN GameWinners gw ON g.id = gw.game_id
    LEFT JOIN PenaltyDetails pd ON g.id = pd.game_id
    WHERE g.session_id = $1 AND g.status IN ('completed', 'draw')
    ORDER BY g.created_at DESC;
  `;

    const { rows } = await db.query(query, [sessionId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'An internal server error occurred while fetching game history.' });
  }
};

// Create a new game within a session
const createGame = async (req, res) => {
  const { sessionCode } = req.params;
  const { players, buyInAmount, potRollover = 0 } = req.body;

  if (!players || !Array.isArray(players) || players.length < 2 || !buyInAmount) {
    return res.status(400).json({
      error: 'Players array (min 2) and buy-in amount are required'
    });
  }

  try {
    // Get session ID
    const sessionQuery = 'SELECT id FROM sessions WHERE session_code = $1';
    const { rows: sessionRows } = await db.query(sessionQuery, [sessionCode]);

    if (sessionRows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionId = sessionRows[0].id;

    // Start transaction
    await db.query('BEGIN');

    // Create the game
    const gameQuery = `
      INSERT INTO games (session_id, buy_in_amount, pot_rollover, status)
      VALUES ($1, $2, $3, 'in_progress')
      RETURNING id, session_id, buy_in_amount, pot_rollover, status, created_at
    `;
    const { rows: gameRows } = await db.query(gameQuery, [sessionId, buyInAmount, potRollover]);
    const game = gameRows[0];

    // Create/get players and add buy-in ledger entries
    const playerIds = [];
    for (const playerName of players) {
      // Insert or get player
      const playerQuery = `
        INSERT INTO players (session_id, name)
        VALUES ($1, $2)
        ON CONFLICT (session_id, name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `;
      const { rows: playerRows } = await db.query(playerQuery, [sessionId, playerName]);
      const playerId = playerRows[0].id;
      playerIds.push(playerId);

      // Add buy-in ledger entry (negative amount)
      const ledgerQuery = `
        INSERT INTO ledger_entries (game_id, player_id, amount, entry_type)
        VALUES ($1, $2, $3, 'buy_in')
      `;
      await db.query(ledgerQuery, [game.id, playerId, -buyInAmount]);
    }

    await db.query('COMMIT');

    res.status(201).json({
      ...game,
      players: players
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
};

// Finalize a game with outcome
const finalizeGame = async (req, res) => {
  const { sessionCode, gameId } = req.params;
  const { status, winner, penalizedPlayers = [], notes = '' } = req.body;

  if (!status || !['completed', 'draw'].includes(status)) {
    return res.status(400).json({
      error: 'Status must be either "completed" or "draw"'
    });
  }

  if (status === 'completed' && !winner) {
    return res.status(400).json({
      error: 'Winner is required for completed games'
    });
  }

  try {
    // Verify session and game exist
    const gameQuery = `
      SELECT g.*, s.id as session_id
      FROM games g
      JOIN sessions s ON g.session_id = s.id
      WHERE g.id = $1 AND s.session_code = $2 AND g.status = 'in_progress'
    `;
    const { rows: gameRows } = await db.query(gameQuery, [gameId, sessionCode]);

    if (gameRows.length === 0) {
      return res.status(404).json({ error: 'Game not found or already finalized' });
    }

    const game = gameRows[0];
    const sessionId = game.session_id;

    await db.query('BEGIN');

    // If a game is won, we clear out any previous "draw" games because their
    // pot is being rolled into this one and paid out.
    if (status === 'completed') {
      await db.query(
        "UPDATE games SET status = 'completed' WHERE session_id = $1 AND status = 'draw'",
        [sessionId]
      );
    }

    // Update game status
    await db.query(
      'UPDATE games SET status = $1, notes = $2 WHERE id = $3',
      [status, notes, gameId]
    );

    if (status === 'completed' && winner) {
      // Calculate pot: buy-ins + rollover
      const potQuery = `
        SELECT COUNT(*) as player_count, SUM(ABS(amount)) as total_buy_ins
        FROM ledger_entries
        WHERE game_id = $1 AND entry_type = 'buy_in'
      `;
      const { rows: potRows } = await db.query(potQuery, [gameId]);
      const totalPot = parseFloat(potRows[0].total_buy_ins) + parseFloat(game.pot_rollover);

      // Get winner player ID
      const winnerQuery = `
        SELECT id FROM players
        WHERE session_id = $1 AND name = $2
      `;
      const { rows: winnerRows } = await db.query(winnerQuery, [sessionId, winner]);

      if (winnerRows.length === 0) {
        throw new Error('Winner not found in this session');
      }

      const winnerId = winnerRows[0].id;
      let winnerAmount = totalPot;

      // Handle penalties
      if (penalizedPlayers.length > 0) {
        const penaltyAmount = parseFloat(game.buy_in_amount) * 0.5;

        for (const penalizedPlayerName of penalizedPlayers) {
          const penalizedQuery = `
            SELECT id FROM players
            WHERE session_id = $1 AND name = $2
          `;
          const { rows: penalizedRows } = await db.query(penalizedQuery, [sessionId, penalizedPlayerName]);

          if (penalizedRows.length > 0) {
            const penalizedId = penalizedRows[0].id;

            // Penalty paid by penalized player
            await db.query(
              'INSERT INTO ledger_entries (game_id, player_id, amount, entry_type) VALUES ($1, $2, $3, $4)',
              [gameId, penalizedId, -penaltyAmount, 'penalty_paid']
            );

            // Penalty received by winner
            await db.query(
              'INSERT INTO ledger_entries (game_id, player_id, amount, entry_type) VALUES ($1, $2, $3, $4)',
              [gameId, winnerId, penaltyAmount, 'penalty_received']
            );

            winnerAmount += penaltyAmount;
          }
        }
      }

      // Winner receives the pot
      await db.query(
        'INSERT INTO ledger_entries (game_id, player_id, amount, entry_type) VALUES ($1, $2, $3, $4)',
        [gameId, winnerId, totalPot, 'win']
      );
    }

    await db.query('COMMIT');

    res.json({
      message: 'Game finalized successfully',
      gameId: gameId,
      status: status
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to finalize game' });
  }
};

// Get current game state and player ledger for a session
const getSessionState = async (req, res) => {
  const { sessionCode } = req.params;

  try {
    // Get session ID
    const sessionQuery = 'SELECT id FROM sessions WHERE session_code = $1';
    const { rows: sessionRows } = await db.query(sessionQuery, [sessionCode]);

    if (sessionRows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionId = sessionRows[0].id;

    // Get current game in progress
    const currentGameQuery = `
      SELECT g.*, array_agg(DISTINCT p.name) as players
      FROM games g
      LEFT JOIN ledger_entries le ON g.id = le.game_id AND le.entry_type = 'buy_in'
      LEFT JOIN players p ON le.player_id = p.id
      WHERE g.session_id = $1 AND g.status = 'in_progress'
      GROUP BY g.id
      ORDER BY g.created_at DESC
      LIMIT 1
    `;
    const { rows: currentGameRows } = await db.query(currentGameQuery, [sessionId]);

    // Calculate player ledger (including both game-based and tip transactions)
    const ledgerQuery = `
      SELECT
        p.name,
        SUM(le.amount) as total
      FROM players p
      LEFT JOIN ledger_entries le ON p.id = le.player_id
      LEFT JOIN games g ON le.game_id = g.id
      WHERE p.session_id = $1
        AND (g.status IN ('completed', 'draw') OR le.game_id IS NULL)
      GROUP BY p.name
      ORDER BY total DESC
    `;
    const { rows: ledgerRows } = await db.query(ledgerQuery, [sessionId]);

    // Calculate pot rollover.
    // This query now correctly sums only the buy-ins from all 'draw' games.
    // It avoids double-counting by ignoring the g.pot_rollover field, which
    // was the source of the previous bug.
    const rolloverQuery = `
      SELECT
        SUM(g.buy_in_amount * player_counts.count) as rollover
      FROM games g
      JOIN (
        SELECT
          game_id,
          COUNT(DISTINCT player_id) as count
        FROM ledger_entries
        WHERE entry_type = 'buy_in'
        GROUP BY game_id
      ) player_counts ON g.id = player_counts.game_id
      WHERE g.session_id = $1 AND g.status = 'draw'
    `;
    const { rows: rolloverRows } = await db.query(rolloverQuery, [sessionId]);

    const potRollover = rolloverRows[0]?.rollover || 0;

    res.json({
      currentGame: currentGameRows[0] || null,
      playerLedger: ledgerRows.reduce((acc, row) => {
        acc[row.name] = parseFloat(row.total);
        return acc;
      }, {}),
      potRollover: parseFloat(potRollover)
    });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to fetch session state' });
  }
};

// Revert/delete a game and all its ledger entries
const revertGame = async (req, res) => {
  const { sessionCode, gameId } = req.params;

  try {
    // Verify session and game exist
    const gameQuery = `
      SELECT g.*, s.id as session_id
      FROM games g
      JOIN sessions s ON g.session_id = s.id
      WHERE g.id = $1 AND s.session_code = $2
    `;
    const { rows: gameRows } = await db.query(gameQuery, [gameId, sessionCode]);

    if (gameRows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    await db.query('BEGIN');

    // Delete the game (CASCADE will automatically delete all ledger_entries)
    await db.query('DELETE FROM games WHERE id = $1', [gameId]);

    await db.query('COMMIT');

    res.json({
      message: 'Game reverted successfully',
      gameId: gameId
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to revert game' });
  }
};

// Create a tip from one player to another
const createTip = async (req, res) => {
  const { sessionCode } = req.params;
  const { fromPlayer, toPlayer, amount } = req.body;

  if (!fromPlayer || !toPlayer || !amount) {
    return res.status(400).json({
      error: 'fromPlayer, toPlayer, and amount are required'
    });
  }

  if (fromPlayer === toPlayer) {
    return res.status(400).json({
      error: 'Cannot tip yourself'
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      error: 'Amount must be greater than zero'
    });
  }

  try {
    // Get session ID
    const sessionQuery = 'SELECT id FROM sessions WHERE session_code = $1';
    const { rows: sessionRows } = await db.query(sessionQuery, [sessionCode]);

    if (sessionRows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionId = sessionRows[0].id;

    await db.query('BEGIN');

    // Get or create fromPlayer
    const fromPlayerQuery = `
      INSERT INTO players (session_id, name)
      VALUES ($1, $2)
      ON CONFLICT (session_id, name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;
    const { rows: fromPlayerRows } = await db.query(fromPlayerQuery, [sessionId, fromPlayer]);
    const fromPlayerId = fromPlayerRows[0].id;

    // Get or create toPlayer
    const toPlayerQuery = `
      INSERT INTO players (session_id, name)
      VALUES ($1, $2)
      ON CONFLICT (session_id, name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;
    const { rows: toPlayerRows } = await db.query(toPlayerQuery, [sessionId, toPlayer]);
    const toPlayerId = toPlayerRows[0].id;

    // Create tip_sent entry (negative amount for sender)
    await db.query(
      'INSERT INTO ledger_entries (game_id, player_id, amount, entry_type) VALUES ($1, $2, $3, $4)',
      [null, fromPlayerId, -amount, 'tip_sent']
    );

    // Create tip_received entry (positive amount for receiver)
    await db.query(
      'INSERT INTO ledger_entries (game_id, player_id, amount, entry_type) VALUES ($1, $2, $3, $4)',
      [null, toPlayerId, amount, 'tip_received']
    );

    await db.query('COMMIT');

    res.status(201).json({
      message: 'Tip created successfully',
      fromPlayer,
      toPlayer,
      amount
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to create tip' });
  }
};

// Get tip history for a session
const getTipHistory = async (req, res) => {
  const { sessionCode } = req.params;

  try {
    // Get session ID
    const sessionQuery = 'SELECT id FROM sessions WHERE session_code = $1';
    const { rows: sessionRows } = await db.query(sessionQuery, [sessionCode]);

    if (sessionRows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionId = sessionRows[0].id;

    // Get all tips (ledger entries with NULL game_id)
    const query = `
      SELECT
        le_from.created_at,
        p_from.name as from_player,
        p_to.name as to_player,
        le_to.amount
      FROM ledger_entries le_from
      JOIN players p_from ON le_from.player_id = p_from.id
      JOIN ledger_entries le_to ON le_from.created_at = le_to.created_at
        AND le_from.amount = -le_to.amount
        AND le_from.entry_type = 'tip_sent'
        AND le_to.entry_type = 'tip_received'
      JOIN players p_to ON le_to.player_id = p_to.id
      WHERE p_from.session_id = $1
        AND le_from.game_id IS NULL
        AND le_to.game_id IS NULL
      ORDER BY le_from.created_at DESC
    `;

    const { rows } = await db.query(query, [sessionId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to fetch tip history' });
  }
};

module.exports = {
  getGameHistory,
  createGame,
  finalizeGame,
  getSessionState,
  revertGame,
  createTip,
  getTipHistory
};
