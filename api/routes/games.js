// routes/games.js
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// GET /api/games/:sessionCode/history - Fetches game history for a session
router.get('/:sessionCode/history', gameController.getGameHistory);

// GET /api/games/:sessionCode/state - Gets current session state (current game + ledger)
router.get('/:sessionCode/state', gameController.getSessionState);

// POST /api/games/:sessionCode - Creates a new game in a session
router.post('/:sessionCode', gameController.createGame);

// PUT /api/games/:sessionCode/:gameId/finalize - Finalizes a game with outcome
router.put('/:sessionCode/:gameId/finalize', gameController.finalizeGame);

// DELETE /api/games/:sessionCode/:gameId - Reverts/deletes a game and its transactions
router.delete('/:sessionCode/:gameId', gameController.revertGame);

// POST /api/games/:sessionCode/tip - Creates a tip from one player to another
router.post('/:sessionCode/tip', gameController.createTip);

// GET /api/games/:sessionCode/tips - Get tip history for a session
router.get('/:sessionCode/tips', gameController.getTipHistory);

module.exports = router;