const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);

const API_KEY = process.env.SPORTS_API_KEY;
const REGIONS = 'us';
const MARKETS = 'h2h,spreads,totals';
const ODDS_FORMAT = 'american';
const DATE_FORMAT = 'iso';

async function extractEventInfo(event) {
    let result = {
        'id': event['id'],
        'commence_time': event['commence_time'],
        'home_team': event['home_team'],
        'away_team': event['away_team'],
        'h2h_home_price': null,
        'h2h_away_price': null,
        'spread_home_price': null,
        'spread_home_point': null,
        'spread_away_price': null,
        'spread_away_point': null,
        'over_price': null,
        'over_point': null,
        'under_price': null,
        'under_point': null,
    };

    for (let bookmaker of event['bookmakers']) {
        for (let market of bookmaker['markets']) {
            if (market['key'] === 'h2h') {
                for (let outcome of market['outcomes']) {
                    if (outcome['name'] === event['home_team']) {
                        result['h2h_home_price'] = outcome['price'];
                    } else if (outcome['name'] === event['away_team']) {
                        result['h2h_away_price'] = outcome['price'];
                    }
                }
            } else if (market['key'] === "spreads") {
                for (let outcome of market['outcomes']) {
                    if (outcome['name'] === event['home_team']) {
                        result['spread_home_price'] = outcome['price'];
                        result['spread_home_point'] = outcome['point'];
                    } else if (outcome['name'] === event['away_team']) {
                        result['spread_away_price'] = outcome['price'];
                        result['spread_away_point'] = outcome['point'];
                    }
                }
            } else if (market['key'] === 'totals') {
                for (let outcome of market['outcomes']) {
                    if (outcome['name'] === 'Over') {
                        result['over_price'] = outcome['price'];
                        result['over_point'] = outcome['point'];
                    } else if (outcome['name'] === 'Under') {
                        result['under_price'] = outcome['price'];
                        result['under_point'] = outcome['point'];
                    }
                }
            }
        }
    }
    return result;
}

async function getSportOdds(sport) {
    try {
      const oddsResponse = await axios.get(
        `https://api.the-odds-api.com/v4/sports/${sport}/odds`,
        {
          params: {
            api_key: API_KEY,
            regions: REGIONS,
            markets: MARKETS,
            oddsFormat: ODDS_FORMAT,
            dateFormat: DATE_FORMAT,
          },
        }
      );
  
      if (oddsResponse.status !== 200) {
        console.log(
          `Failed to get odds: status_code ${oddsResponse.status}, response body ${oddsResponse.data}`
        );
        return;
      }
  
      const oddsJson = oddsResponse.data;
      console.log('Number of events:', oddsJson.length);
      console.log(oddsJson);
  
      console.log(
        'Remaining requests',
        oddsResponse.headers['x-requests-remaining']
      );
      console.log('Used requests', oddsResponse.headers['x-requests-used']);
  
      let processedData = [];
      for (let event of oddsJson) {
        try {
          let result = await extractEventInfo(event);
          processedData.push(result);
          console.log(`Processed game ID ${result['id']}`);
        } catch (e) {
          console.log(`Error processing game ID ${event['id']}: ${e}`);
        }
      }
  
      // Move "id" field to the beginning of each dictionary
      processedData = processedData.map((event) => {
        if ('id' in event) {
          const { id, ...rest } = event;
          return { id, ...rest };
        }
        return event;
      });
  
      const outputDir = path.join(__dirname, '..', 'pickerapp', 'build');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
  
      const outputFile = path.join(outputDir, `processed_${sport}.json`);
      try {
        await writeFile(outputFile, JSON.stringify(processedData, null, 2));
        console.log('Output file successfully updated.');
      } catch (e) {
        console.log(`Error updating output file: ${e}`);
      }
    } catch (error) {
      console.error(`Error fetching odds for ${sport}: ${error}`);
    }
  }
  
  async function fetchSportsOdds() {
    const sports = ['baseball_mlb', 'basketball_nba', 'icehockey_nhl'];
    const promises = sports.map((sport) => getSportOdds(sport));
    await Promise.all(promises);
  }
  
  module.exports = { fetchSportsOdds };