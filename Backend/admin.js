const express = require('express');
const router = express.Router();
const { fetchGameResults } = require('./gameResults');
const { updateOutcomes, updatePaidStatus } = require('./updateOutcomes');
const { fetchSportsOdds } = require('./fetchodds');
const { updateLeagueStatus } = require('./leaguestatus');
const { db, picksDb } = require('./database');

async function fetchAndUpdateResults() {
    const daysFrom = 1; // Change to change days
    const gameResults = await fetchGameResults(['basketball_nba', 'baseball_mlb', 'icehockey_nhl'], daysFrom);
    await updateOutcomes(gameResults);
    await updatePaidStatus();
  }

// Endpoint for force odds update
router.post('/forceOddsUpdate', async (req, res) => {
    try {
        await fetchSportsOdds();
        res.json({ success: true, message: 'Odds updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating odds', error: err.message });
    }
});

// Endpoint for fetch results
router.post('/updateResults', async (req, res) => {
    try {
        await fetchAndUpdateResults();
        res.json({ success: true, message: 'Results updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating results', error: err.message });
    }
});

// Endpoint for update league status
router.put('/updateLeagueStatus', async (req, res) => {
    try {
        await updateLeagueStatus();
        res.json({ success: true, message: 'League status updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating league status', error: err.message });
    }
});

router.put('/leagueusers/:id', async (req, res) => {
    const id = req.params.id;
    const newBalance = req.body.newBalance;
    try {
        await picksDb.execute('UPDATE LeagueUsers SET balance = ? WHERE id = ?', [newBalance, id]);
        res.json({ success: true, message: 'Balance updated successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating balance.', error: err.message });
    }
});

// Update balances in Db accounts table
router.put('/accounts/:id', async (req, res) => {
    const id = req.params.id;
    const newBalance = req.body.newBalance;
    try {
        await db.execute('UPDATE accounts SET balance = ? WHERE id = ?', [newBalance, id]);
        res.json({ success: true, message: 'Balance updated successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating balance.', error: err.message });
    }
});

// Update outcomes in the picks table
router.put('/picks/:id', async (req, res) => {
    const id = req.params.id;
    const newOutcome = req.body.newOutcome;
    try {
        await picksDb.execute('UPDATE picks SET outcome = ? WHERE id = ?', [newOutcome, id]);
        res.json({ success: true, message: 'Outcome updated successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating outcome.', error: err.message });
    }
});

module.exports = router;
