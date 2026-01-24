// ===== MySQL connection =====
require('dotenv').config({ override: true });
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'projectweb'
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err.message);
    return;
  }
  console.log('MySQL connected');
});

// promise wrapper
const dbPromise = db.promise();

module.exports = { db, dbPromise };
