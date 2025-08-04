// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const gameRoutes = require('./routes/games');
const sessionRoutes = require('./routes/sessions');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
// Enable Cross-Origin Resource Sharing for all routes
app.use(cors());
// Parse incoming JSON requests
app.use(express.json());

// --- API Routes ---
app.use('/api/sessions', sessionRoutes);
app.use('/api/games', gameRoutes);

// --- Root Endpoint ---
app.get('/', (req, res) => {
  res.send('Chinese Poker Board API is running...');
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});