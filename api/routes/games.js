// routes/games.js
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// GET /api/games - Fetches the entire game history
router.get('/', gameController.getGameHistory);

// Other routes like POST / and POST /:id/finalize will be added here.

module.exports = router;