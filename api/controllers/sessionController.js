// controllers/sessionController.js
const db = require('../db');
const crypto = require('crypto');

// Generate a simple hash for passwords (for demo purposes)
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Generate a random session code
const generateSessionCode = () => {
  return crypto.randomBytes(6).toString('hex'); // Generates 12-character hex string
};

// Create a new Chinese poker session
const createSession = async (req, res) => {
  const { sessionName, creatorName, creatorPassword } = req.body;

  if (!sessionName || !creatorName || !creatorPassword) {
    return res.status(400).json({ 
      error: 'Session name, creator name, and creator password are required' 
    });
  }

  try {
    const sessionCode = generateSessionCode();
    const passwordHash = hashPassword(creatorPassword);

    const query = `
      INSERT INTO sessions (session_name, session_code, creator_name, creator_password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, session_name, session_code, creator_name, created_at
    `;
    
    const { rows } = await db.query(query, [sessionName, sessionCode, creatorName, passwordHash]);
    const session = rows[0];

    res.status(201).json({
      session,
      shareableUrl: `/session/${sessionCode}`
    });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
};

// Get session information by session code
const getSession = async (req, res) => {
  const { sessionCode } = req.params;

  try {
    const query = `
      SELECT id, session_name, session_code, creator_name, created_at
      FROM sessions 
      WHERE session_code = $1
    `;
    
    const { rows } = await db.query(query, [sessionCode]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

// Authenticate creator (verify name + password)
const authenticateCreator = async (req, res) => {
  const { sessionCode } = req.params;
  const { creatorName, creatorPassword } = req.body;

  if (!creatorName || !creatorPassword) {
    return res.status(400).json({ 
      error: 'Creator name and password are required' 
    });
  }

  try {
    const passwordHash = hashPassword(creatorPassword);
    
    const query = `
      SELECT id, session_name, session_code, creator_name
      FROM sessions 
      WHERE session_code = $1 AND creator_name = $2 AND creator_password_hash = $3
    `;
    
    const { rows } = await db.query(query, [sessionCode, creatorName, passwordHash]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ 
      authenticated: true, 
      session: rows[0],
      role: 'creator'
    });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Reset all data for a session (creator only)
const resetSessionData = async (req, res) => {
  const { sessionCode } = req.params;
  const { creatorName, creatorPassword } = req.body;

  // Verify creator credentials first
  try {
    const passwordHash = hashPassword(creatorPassword);
    const authQuery = `
      SELECT id FROM sessions 
      WHERE session_code = $1 AND creator_name = $2 AND creator_password_hash = $3
    `;
    
    const { rows: authRows } = await db.query(authQuery, [sessionCode, creatorName, passwordHash]);
    
    if (authRows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const sessionId = authRows[0].id;

    // Delete all games and related data for this session (cascade will handle ledger_entries)
    await db.query('DELETE FROM games WHERE session_id = $1', [sessionId]);
    // Delete all players for this session
    await db.query('DELETE FROM players WHERE session_id = $1', [sessionId]);

    res.json({ message: 'Session data reset successfully' });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to reset session data' });
  }
};

module.exports = {
  createSession,
  getSession,
  authenticateCreator,
  resetSessionData
};