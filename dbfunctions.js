const { db, picksDb } = require('./database');

async function getPickLimitByLeagueName(leagueName) {
  const [rows] = await picksDb.query('SELECT picklimits FROM leagues WHERE league_name = ?', [leagueName]);
  return rows.length > 0 ? rows[0].picklimits : null;
}

async function getNumberOfPicks(username, leagueName) {
  const [rows] = await picksDb.query('SELECT COUNT(*) as count FROM picks WHERE username = ? AND league_name = ?', [username, leagueName]);
  return rows.length > 0 ? rows[0].count : 0;
}

module.exports = {
  getPickLimitByLeagueName,
  getNumberOfPicks
};
