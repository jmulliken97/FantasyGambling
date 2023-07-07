const cron = require('node-cron');
const mysql = require('mysql2/promise');
const { db, picksDb } = require('./database');

async function queryDb(query, params) {
  console.log('Running query:', query, 'with params:', params);
  const [rows] = await picksDb.execute(query, params);
  console.log('Query result:', rows);
  return rows;
}

async function getLeaguesToClose() {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);  // Ignoring time part, focusing on date only
  
  const query = `
    SELECT league_id, league_name 
    FROM leagues 
    WHERE isActive = true AND DATE(end_date) <= ?
  `;
  
  const rows = await queryDb(query, [currentDate]);
  return rows;
};

async function closeLeagues(leagues) {
  if (leagues.length === 0) {
    console.log('No leagues to close');
    return;
  }

  const leagueIds = leagues.map(league => league.league_id);
  
  console.log('Closing leagues:', leagueIds);

  const placeholders = leagueIds.map(_ => '?').join(',');

  // Update LeagueUsers
  const queryUsers = `
    UPDATE LeagueUsers 
    SET isActive = false 
    WHERE league_id IN (${placeholders})
  `;

  await queryDb(queryUsers, leagueIds);
  
  // Update leagues
  const queryLeagues = `
    UPDATE leagues 
    SET isActive = false 
    WHERE league_id IN (${placeholders})
  `;

  await queryDb(queryLeagues, leagueIds);
};




const updateLeagueStatus = async () => {
  try {
    console.log('Starting to update league status...');
    const leaguesToClose = await getLeaguesToClose();
    await closeLeagues(leaguesToClose);
    console.log('Leagues status updated successfully');
  } catch (error) {
    console.error('Error updating league status:', error);
  }
};

module.exports = {
  updateLeagueStatus,
};








