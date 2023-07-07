const mysql = require('mysql2/promise');
require('dotenv').config({ path: './connections.env' });

const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const picksDb = mysql.createPool({
  connectionLimit: 10,
  host: process.env.PICKS_DB_HOST,
  user: process.env.PICKS_DB_USER,
  password: process.env.PICKS_DB_PASSWORD,
  database: process.env.PICKS_DB_NAME
});

// Check connection to the first database
db.query('SELECT 1')
  .then(() => {
    console.log('Connected to the first database');
  })
  .catch((err) => {
    console.error('Error connecting to the first database:', err);
  });

// Check connection to the second database
picksDb.query('SELECT 1')
  .then(() => {
    console.log('Connected to the second database');
  })
  .catch((err) => {
    console.error('Error connecting to the second database:', err);
  });

module.exports = { db, picksDb };

