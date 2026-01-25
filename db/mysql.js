// ===== MySQL connection =====
require('dotenv').config({ override: true });
const mysql = require('mysql2');

const db = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'projectweb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

db.on('error', (err) => {
  console.error('MySQL pool error:', err.message);
});

// promise wrapper
const dbPromise = db.promise();

module.exports = { db, dbPromise };
