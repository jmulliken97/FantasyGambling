const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const bodyParser = require('body-parser');
const { picksDb } = require('./database');
const mysql = require('mysql2/promise');

const app = express();
app.use(bodyParser.json());

function isAuthenticated(req, res, next) {
  if (req.session && req.session.username) {
    next();
  } else {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

router.get('/allleagues', async (req, res) => {
  try {
    const [rows] = await picksDb.query('SELECT * FROM leagues WHERE isActive = ?', [true]);
    console.log(rows);
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error: Unable to fetch leagues' });
  }
});


router.post('/createleague', isAuthenticated, async (req, res) => {

  const { league_name, league_type, max_participants, start_date, end_date, starting_balance } = req.body;
  const username = req.cookies.username || req.session.username;

  let join_code = crypto.randomBytes(3).toString('hex').toUpperCase();
  join_code = join_code.slice(0, 5);
  console.log(`Generated join code: ${join_code}`);

  let conn;
  try {
    conn = await picksDb.getConnection();
    
    const [existingLeague] = await conn.query('SELECT * FROM leagues WHERE league_name = ?', [league_name]);
    if (existingLeague.length > 0) {
      return res.status(400).json({ message: 'A league with this name already exists' });
    }

    await conn.beginTransaction();
    console.log('Transaction started');

    let leagueInsert = 'INSERT INTO leagues (league_name, league_type, max_participants, created_by, join_code, start_date, end_date, starting_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const [rows] = await conn.query(leagueInsert, [league_name, league_type, max_participants, username, join_code, start_date, end_date, starting_balance]);
    const leagueId = rows.insertId;
    console.log(`Inserted league with id: ${leagueId}`);
    
    await conn.commit();
    res.status(200).json({ message: 'League created successfully', leagueId });
  } catch (err) {
    if (conn) await conn.rollback();
    console.log('Transaction rolled back due to an error');
    console.error('Error:', err);
    res.status(500).json({ message: 'Error: Unable to create the league' });
  } finally {
    if (conn) conn.release();
  }
});


router.get('/allleagues/:leagueName', async (req, res) => {
  const { leagueName } = req.params;
  try {
    const [rows] = await picksDb.query('SELECT * FROM leagues WHERE league_name = ?', [leagueName]);
    if (rows.length > 0) {
      res.status(200).json({ league: rows[0] });
    } else {
      res.status(404).json({ message: 'League not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error: Unable to fetch league' });
  }
});

router.get('/user-leagues', async (req, res) => {
  const username = req.session.username;

  try {
    const [rows] = await picksDb.query('SELECT league_name FROM LeagueUsers WHERE isActive = ? AND username = ?', [true, username]);
    if (rows.length > 0) {
      res.status(200).json({ leagues: rows });
    } else {
      res.status(404).json({ message: 'No active leagues found for the user' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error: Unable to fetch user active leagues' });
  }
});


router.post('/joinLeague', isAuthenticated, async (req, res) => {
  const join_code = req.body;
  const username = req.session.username;
  let conn;
  try {
    conn = await picksDb.getConnection();
    await conn.beginTransaction();

    // Get the league details and league_id
    const [leagueRows] = await conn.query('SELECT league_id, league_name, max_participants, starting_balance FROM leagues WHERE join_code = ?', [join_code]);
    
    if (leagueRows.length === 0) {
      return res.status(404).json({ message: 'League not found' });
    }

    const { league_id, league_name, max_participants, starting_balance } = leagueRows[0];

    // Check if the username already exists in the league
    const [userRows] = await conn.query(`SELECT * FROM LeagueUsers WHERE username = ? AND league_name = ?`, [username, league_name]);
    
    if (userRows.length > 0) {
      return res.status(403).json({ message: 'You are already in this league' });
    }

    // Get the current number of participants
    const [participantRows] = await conn.query('SELECT COUNT(*) AS count FROM LeagueUsers WHERE league_name = ?', [league_name]);
    const currentParticipants = participantRows[0].count;

    // Check if league is full
    if (currentParticipants >= max_participants) {
      res.status(403).json({ message: 'League is full' });
    } else {
      // Insert the user into the league
      const insertUser = `INSERT INTO LeagueUsers (username, league_name, balance, league_id) VALUES (?, ?, ?, ?)`;
      await conn.query(insertUser, [username, league_name, starting_balance, league_id]);
      
      await conn.commit();
      res.status(200).json({ message: 'Joined the league successfully' });
    }

  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Error: Unable to join the league' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;