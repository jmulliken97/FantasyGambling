const axios = require('axios');

async function fetchGameResults(sports = ['basketball_nba', 'baseball_mlb', 'icehockey_nhl'], daysFrom) {
  try {
    const apiKey = process.env.SPORTS_API_KEY;
    const dateFormat = 'iso';

    // Fetch results for each sport
    const allResults = await Promise.allSettled(
      sports.map(async (sport) => {
        try {
          const response = await axios.get(
            `https://api.the-odds-api.com/v4/sports/${sport}/scores/?apiKey=${apiKey}&daysFrom=${daysFrom}&dateFormat=${dateFormat}`
          );

          if (response.status === 200) {
            return { sport, data: response.data };
          } else {
            console.error('Error fetching game results:', response.status);
            return { sport, data: [] };
          }
        } catch (error) {
          console.error(`Error fetching game results for ${sport}:`, error);
          return { sport, data: [] };
        }
      })
    );

    // Combine and format results
    const combinedResults = allResults.reduce((acc, curr) => {
      if (curr.status === 'fulfilled') {
        acc[curr.value.sport] = formatGameResults(curr.value.data);
      }
      return acc;
    }, {});

    return combinedResults;
  } catch (error) {
    console.error('Error fetching game results:', error);
    return {};
  }
}

function formatGameResults(apiResults) {
  return apiResults.map(game => {
    const { id: game_id, completed, home_team, away_team, scores } = game;

    let status = completed ? 'finished' : 'not_started';
    let home_score_obj = scores && scores.length > 0 ? scores.find(s => s.name === home_team) : null;
    let away_score_obj = scores && scores.length > 0 ? scores.find(s => s.name === away_team) : null;

    let team1_score = home_score_obj ? home_score_obj.score : null;
    let team2_score = away_score_obj ? away_score_obj.score : null;

    return { game_id, status, home_team, away_team, team1_score, team2_score };
  });
}

module.exports = {
  fetchGameResults,
};
