/**
 * MySQL connection pool using mysql2/promise.
 * Exposes the pool and a verifyConnection() health-check function.
 */
const mysql = require('mysql2/promise');
const config = require('./env');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  // Return JS Date objects instead of strings for TIMESTAMP columns
  dateStrings: false,
});

/**
 * Verify DB connectivity by acquiring a connection and pinging.
 * Throws if MySQL is unreachable — lets server.js fail fast at startup.
 */
async function verifyConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    console.log('✅  MySQL connection verified');
  } finally {
    conn.release();
  }
}

module.exports = { pool, verifyConnection };
