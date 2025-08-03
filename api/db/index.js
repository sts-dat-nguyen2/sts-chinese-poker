// db/index.js
const { Pool } = require('pg');
require('dotenv').config(); // Use environment variables for security

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Example: postgres://user:password@host:port/database
});

// Export a query function to be used throughout the application
module.exports = {
  query: (text, params) => pool.query(text, params),
};