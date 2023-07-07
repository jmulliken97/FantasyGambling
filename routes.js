const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
const util = require('util');
const fs = require('fs');
const { wss } = require('./backend');
const WebSocket = require('ws');
const { db, picksDb } = require('./database');
const { getPickLimitByLeagueName, getNumberOfPicks } = require('./dbfunctions');

require('dotenv').config({ path: './connections.env' });

const balanceUpdateLocks = {};

async function queryDb(db, query, values) {
  try {
    const [result] = await db.query(query, values);
    return result;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function isAuthenticated(req, res, next) {
  const username = req.session.username;
  console.log('Session username:', username);

  if (username) {
    const user = await queryDb(db, 'SELECT username FROM accounts WHERE username = ?', [username]);
    console.log('DB user query result:', user);
    if (user.length > 0) {
      next();
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

router.post('/submit-slip', isAuthenticated, async (req, res) => {
  console.log('Submit slip request body:', req.body);
  const slipData = req.body.slipData;
  const username = req.session.username;

  const slipDataWithUsernameAndTime = slipData.map(item => {
    const { rewardAmount, riskAmount, leagueName, ...otherProps } = item;
    return {
      ...otherProps,
      username,
      created_at: new Date(),
      league_name: leagueName,
      points: item.points || null,
      reward_amount: rewardAmount,
      riskAmount: riskAmount
    };
  });

  const totalRiskAmount = slipData.reduce((sum, item) => sum + (item.riskAmount || 0), 0);

  if (balanceUpdateLocks[username]) {
    return res.status(429).json({ message: 'Another balance update is in progress. Please try again later.' });
  }
  
  balanceUpdateLocks[username] = true;

  try {
    for (const item of slipDataWithUsernameAndTime) {
      let userBalance;
      let leagueName = item.league_name;
      let leagueType = 'Type 1';

      if (leagueName.toLowerCase() !== 'public') {
        const query = 'SELECT league_type FROM leagues WHERE league_name = ?';
        const leagueTypeResult = await picksDb.query(query, [leagueName]);

        if (leagueTypeResult.length === 0) {
          return res.status(404).json({ message: 'League not found' });
        }

        leagueType = leagueTypeResult[0].league_type;
      }

      if (item.league_name.toLowerCase() === 'public') {
        const userBalanceResult = await db.query('SELECT balance FROM accounts WHERE username = ?', [username]);
        if(userBalanceResult.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }
        userBalance = userBalanceResult[0].balance;
      } else {
        const userBalanceResult = await picksDb.query('SELECT balance FROM LeagueUsers WHERE username = ? AND league_name = ?', [username, item.league_name]);
        if(userBalanceResult.length === 0) {
          return res.status(404).json({ message: 'User not found in the league' });
        }
        userBalance = userBalanceResult[0].balance;
      }

      // Checking if user balance is less than the risk amount
      if(userBalance < item.riskAmount) {
        throw new Error('Balance too low');
      }

      switch (leagueType) {
        case 'type4':
          const pickLimit = await getPickLimitByLeagueName(leagueName);
          if (pickLimit !== null) {
            const numberOfPicks = await getNumberOfPicks(username, leagueName);
            if (numberOfPicks >= pickLimit) {
              throw new Error("You've exceeded the betting limit in this league.");
            }
          }
          break;
      }

      await picksDb.query('INSERT INTO picks SET ?', item);

      console.log(`Attempting to update account with username: ${username}, league_name: ${leagueName}, totalRiskAmount: ${totalRiskAmount}`);

      if (leagueName.toLowerCase() === 'public') {
        const [result] = await db.query('UPDATE accounts SET balance = balance - ? WHERE username = ?', [totalRiskAmount, username]);
        console.log(`Updated ${result.changedRows} rows in the accounts table.`);
      } else {
        const [result] = await picksDb.query('UPDATE LeagueUsers SET balance = balance - ? WHERE username = ? AND league_name = ?', [totalRiskAmount, username, leagueName]);
        console.log(`Updated ${result.changedRows} rows in the LeagueUsers table.`);
      }
    }
    
    res.status(200).json({ message: 'Slip submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Error: Unable to submit the slip' });
  } finally {
    balanceUpdateLocks[username] = false;
  }
});


router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.execute('SELECT * FROM accounts WHERE username = ?', [username]);
    if (rows.length > 0) {
      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        req.session.username = username;
        req.session.save(err => {
          if (err) {
            console.error(err);
            res.status(500).json({ message: 'Error: Unable to login' });
          } else {
            console.log("Session username:", req.session.username);
            res.cookie('username', username, { maxAge: 900000, httpOnly: true, secure: false, sameSite: 'lax' });
            res.status(200).json({ message: 'Login successful', redirectTo: '/play' });
          }
        });
      } else {
        res.status(401).json({ message: 'Incorrect username or password' });
      }
    } else {
      res.status(401).json({ message: 'Incorrect username or password' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error: Unable to login' });
  }
});

  
  
  router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
  });
  
  router.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
  
    try {
      // Check if the email is already used
      const emailQuery = 'SELECT * FROM accounts WHERE email = ?';
      const [emailRows] = await db.execute(emailQuery, [email]);
  
      if (emailRows.length > 0) {
        res.status(409).json({ message: 'Error: Email already in use' });
      } else {
        // Hash the password with a salt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
  
        // Insert the user into the 'accounts' table
        const insertQuery = 'INSERT INTO accounts (username, password, email) VALUES (?, ?, ?)';
        await db.execute(insertQuery, [username, hashedPassword, email]);
  
        res.status(200).json({ message: 'User registered successfully' });
      }
    } catch (error) {
      console.error('Error in /register route:', error);
      res.status(500).send('Error occurred while processing your request.');
    }
  });
  

  router.post('/update-profile', async (req, res) => {
    const { username, newEmail, newPassword } = req.body;
  
    try {
      // Update the user's email
      const updateEmailQuery = 'UPDATE accounts SET email = ? WHERE username = ?';
      db.query(updateEmailQuery, [newEmail, username], async (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ message: 'Error: Unable to update email' });
        } else {
          // Hash the new password with a salt
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(newPassword, salt);
  
          // Update the user's password
          const updatePasswordQuery = 'UPDATE accounts SET password = ? WHERE username = ?';
          db.query(updatePasswordQuery, [hashedPassword, username], (err, result) => {
            if (err) {
              console.error(err);
              res.status(500).json({ message: 'Error: Unable to update password' });
            } else {
              res.status(200).json({ message: 'Profile updated successfully' });
            }
          });
        }
      });
    } catch (error) {
      console.error('Error in /update-profile route:', error);
      res.status(500).send('Error occurred while processing your request.');
    }
  });
  
  router.get('/picks', async (req, res) => {
    let conn;
    try {
      conn = await picksDb.getConnection();
      const [result] = await conn.query('SELECT * FROM picks');
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error: Unable to fetch picks' });
    } finally {
      if (conn) conn.release();
    }
  });
  
  router.post('/comment', isAuthenticated, async (req, res) => {
    const { pick_id, comment } = req.body;
    const username = req.session.username;
  
    const newComment = {
      username,
      comment,
      pick_id,
      created_at: new Date()
    };
  
    try {
      await picksDb.query('INSERT INTO comments SET ?', [newComment]);
  
      if (wss && wss.clients) {
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(newComment));
          }
        });
      }
  
      res.status(200).json({ message: 'Comment added successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error: Unable to add the comment' });
    }
  });
  

  router.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
  });

  router.get('/development', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'development.html'));
  });
  
  router.get('/leaderboard', async (req, res) => {
    try {
      const [result] = await picksDb.query(`
        SELECT r.username, r.total_gain_or_loss
        FROM results AS r
        INNER JOIN (
          SELECT username, MAX(created_at) AS latest_created_at
          FROM results
          GROUP BY username
        ) AS latest ON r.username = latest.username AND r.created_at = latest.latest_created_at
        ORDER BY r.total_gain_or_loss DESC
        LIMIT 10;
      `);
  
      const leaderboardData = result.map((row) => {
        return {
          username: row.username,
          total_gain_or_loss: row.total_gain_or_loss,
        };
      });
  
      res.status(200).json(leaderboardData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error: Unable to fetch leaderboard data' });
    }
  });
  
  router.get('/comments/:pickId', async (req, res) => {
    const { pickId } = req.params;
  
    try {
      const [result] = await picksDb.query(`SELECT pick_id, username, comment, created_at FROM comments WHERE pick_id = ?`, [pickId]);
  
      const comments = result.map(item => ({ user: item.username, text: item.comment }));
  
      res.status(200).json({ comments });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error: Unable to fetch comments' });
    }
  });
  
  router.get('/get-user-data', isAuthenticated, async (req, res) => {
    const username = req.session.username;
  
    if (!username) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    try {
      const [result] = await db.query('SELECT * FROM accounts WHERE username = ?', [username]);
      if (result.length > 0) {
        const user = result[0];
        res.status(200).json({ user });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error: Unable to fetch user data' });
    }
  });
  
  router.get('/user-picks', isAuthenticated, async (req, res) => {
    const username = req.session.username;
  
    if (!username) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    try {
      const [result] = await picksDb.query('SELECT * FROM picks WHERE username = ? ORDER BY created_at DESC', [username]);
      if (result.length > 0) {
        res.status(200).json({ picks: result });
      } else {
        res.status(404).json({ message: 'No picks found for the user' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error: Unable to fetch user picks' });
    }
  });

  const serveStaticOptions = {
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    }
  };

  router.use('/play', express.static(path.join(__dirname, '..', 'pickerapp', 'build'), serveStaticOptions));

  router.get('/play/*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'pickerapp', 'build', 'index.html'));
});

  router.use('/', express.static(path.join(__dirname, '..', 'homepage-feed', 'build'), serveStaticOptions));

  router.get(['/', '/home'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'homepage-feed', 'build', 'index.html'));
});

  router.use('/leagues', express.static(path.join(__dirname, '..', 'leaguecreation', 'build'), serveStaticOptions));
  
  router.get(['/leagues'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'leaguecreation', 'build', 'index.html'));
});


function getMimeType(filePath) {
  if (filePath.endsWith('.css')) {
    return 'text/css';
  } else if (filePath.endsWith('.js')) {
    return 'application/javascript';
  } else if (filePath.endsWith('.png')) {
    return 'image/png';
  } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
    return 'image/jpeg';
  } else if (filePath.endsWith('.gif')) {
    return 'image/gif';
  } else if (filePath.endsWith('.html')) {
    return 'text/html';
  } else if (filePath.endsWith('.json')) {
    return 'application/json';
  }
  
  // Add more file types here as needed
}

router.get('/:file', (req, res, next) => {
  const { file } = req.params;
  const mimeType = getMimeType(file);

  if (mimeType) {
    const filePath = path.join(__dirname, 'public', file);
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(err);
        res.status(404).send('File not found');
      } else {
        res.setHeader('Content-Type', mimeType);
        res.sendFile(filePath);
      }
    });
  } else {
    res.status(404).send('File not found');
  }
});

router.get('/session', (req, res) => {
  if (req.session && req.session.username) {
    res.status(200).json({ username: req.session.username });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});
  
  module.exports = router;
  