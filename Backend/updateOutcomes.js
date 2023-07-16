const mysql = require('mysql2/promise');
const { db, picksDb } = require('./database');


async function updatePaidStatus() {
  try {
    const [picksToUpdate] = await picksDb.execute(
      'SELECT * FROM picks WHERE (outcome = "win" OR outcome = "loss" OR outcome = "push") AND Paid = "no"'
    );

    for (const pick of picksToUpdate) {
      const picksDbConnection = await picksDb.getConnection();
      const dbConnection = await db.getConnection();

      let amountGainedOrLost = 0;

      try {
        await picksDbConnection.beginTransaction();
        await dbConnection.beginTransaction();

        if (pick.outcome === 'loss') {
          amountGainedOrLost = -pick.riskAmount;
        } else if (pick.outcome === 'win') {
          amountGainedOrLost = pick.reward_amount;
        } else if (pick.outcome === 'push') {
          amountGainedOrLost = pick.riskAmount; 
        }

        await picksDbConnection.execute(
          'UPDATE picks SET Paid = "yes" WHERE id = ?',
          [pick.id]
        );

        if (pick.league_name.toLowerCase() !== 'public') {
          await picksDbConnection.execute(
            'UPDATE LeagueUsers SET balance = balance + ? WHERE username = ? AND league_name = ?',
            [parseFloat(amountGainedOrLost), pick.username, pick.league_name]
          );
        } else {
          await dbConnection.execute(
            'UPDATE accounts SET balance = balance + ? WHERE username = ?',
            [parseFloat(amountGainedOrLost), pick.username]
          );
        }

        const [lastResult] = await picksDbConnection.execute(
          'SELECT * FROM results WHERE username = ? ORDER BY created_at DESC LIMIT 1',
          [pick.username]
        );

        const totalGainOrLoss = lastResult ? parseFloat(lastResult[0].total_gain_or_loss) + parseFloat(amountGainedOrLost) : parseFloat(amountGainedOrLost);
        // Insert data into the results table
        await picksDbConnection.execute(
          'INSERT INTO results (username, amount_risked, amount_gained_or_lost, total_gain_or_loss) VALUES (?, ?, ?, ?)',
          [pick.username, pick.riskAmount, amountGainedOrLost, totalGainOrLoss]
        );

        await picksDbConnection.commit();
        await dbConnection.commit();
      } catch (error) {
        console.error('Error in transaction, rolling back:', error);
        await picksDbConnection.rollback();
        await dbConnection.rollback();
      } finally {
        picksDbConnection.release();
        dbConnection.release();
      }
    }
  } catch (error) {
    console.error('Error updating paid status:', error);
  }
}


// Function to update the outcomes in the "picks" table based on the game results
async function updateOutcomes(gameResults) {
  try {
    if (typeof gameResults !== 'object' || gameResults === null) {
      throw new TypeError('gameResults must be an object');
    }

    console.log('Game results:', gameResults);

    for (const sport of Object.keys(gameResults)) {
      const games = gameResults[sport];

      console.log(`Processing sport: ${sport}`, games);

      for (const gameResult of games) {
        const { game_id, status, team1_score, team2_score } = gameResult;

        console.log(`Processing game: ${game_id}`);

        if (status !== 'finished') {
          console.log(`Skipping unfinished game: ${game_id}`);
          continue;
        }

      const team1Score = parseInt(team1_score, 10);
      const team2Score = parseInt(team2_score, 10);

      const [picks] = await picksDb.execute(
        'SELECT * FROM picks WHERE gameId = ? AND outcome = "upcoming"',
        [game_id]
      );

      console.log('Picks data:', picks);

      for (const pick of picks) {
        let outcome = 'push';

        const pointsDifference = Math.abs(team1Score - team2Score);
        const totalPoints = team1Score + team2Score;

        if (pick.betType === 'ML') {
          if (pick.team === gameResult.home_team && team1Score > team2Score) {
            outcome = 'win';
          } else if (pick.team === gameResult.home_team && team1Score < team2Score) {
            outcome = 'loss';
          } else if (pick.team === gameResult.away_team && team1Score < team2Score) {
            outcome = 'win';
          } else if (pick.team === gameResult.away_team && team1Score > team2Score) {
            outcome = 'loss';
          } else {
            outcome = 'push';
          }
        } else if (pick.betType === 'Spread') {
          const spread = parseFloat(pick.points);

          if (pick.team === gameResult.home_team) {
            if (team1Score + spread > team2Score) {
              outcome = 'win';
            } else if (team1Score + spread < team2Score) {
              outcome = 'loss';
            } else {
              outcome = 'push';
            }
          } else if (pick.team === gameResult.away_team) {
            if (team2Score + spread > team1Score) {
              outcome = 'win';
            } else if (team2Score + spread < team1Score) {
              outcome = 'loss';
            } else {
              outcome = 'push';
            }
          }
        } else if (pick.betType == 'Total Over') {
          const targetPoints = parseFloat(pick.points);

          if (totalPoints > targetPoints) {
            outcome = 'win';
          } else if (totalPoints < targetPoints) {
            outcome = 'loss';
          } else {
            outcome = 'push';
          }
        } else if (pick.betType == 'Total Under') {
          const targetPoints = parseFloat(pick.points);

          if (totalPoints < targetPoints) {
            outcome = 'win';
          } else if (totalPoints > targetPoints) {
            outcome = 'loss';
          } else {
            outcome = 'push';
          }
        }

        await picksDb.execute(
          'UPDATE picks SET outcome = ? WHERE id = ?',
          [outcome, pick.id]
        );
      }
    }
  }
  } catch (error) {
    console.error('Error updating outcomes:', error);
  }
}

module.exports = {
  updateOutcomes,
  updatePaidStatus,
};
  