// routes/games.js
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// GET /api/games - Fetches the entire game history
router.get('/', gameController.getGameHistory);

// Other routes like POST / and POST /:id/finalize will be added here.

// DELETE /api/games/:sessionCode/:gameId - Reverts/deletes a game and its transactions
router.delete('/:sessionCode/:gameId', gameController.revertGame);

// POST /api/games/:sessionCode/tip - Creates a tip from one player to another
router.post('/:sessionCode/tip', gameController.createTip);

// GET /api/games/:sessionCode/tips - Get tip history for a session
router.get('/:sessionCode/tips', gameController.getTipHistory);

module.exports = router;