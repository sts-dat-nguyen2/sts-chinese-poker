// routes/sessions.js
const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// POST /api/sessions - Create a new Chinese poker session
router.post('/', sessionController.createSession);

// GET /api/sessions/:sessionCode - Get session information
router.get('/:sessionCode', sessionController.getSession);

// POST /api/sessions/:sessionCode/auth - Authenticate creator
router.post('/:sessionCode/auth', sessionController.authenticateCreator);

// DELETE /api/sessions/:sessionCode/data - Reset all session data (creator only)
router.delete('/:sessionCode/data', sessionController.resetSessionData);

module.exports = router;