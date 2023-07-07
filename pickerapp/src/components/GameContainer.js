import React from "react";
import "./GameContainer.css";

function formatPrice(price) {
  return price >= 0 ? `+${price}` : `${price}`;
}

function convertTime(commence_time) {
  
  let date = new Date(commence_time);

  
  const options = { month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
  const formattedDate = date.toLocaleString('en-US', options);

  return formattedDate;
}


function GameContainer({ game, handleAddToSlip, currentRisk, setCurrentRisk, gameIndex }) {
  const handleSelectOutcome = (team, betType, price, points) => {
    if (betType === "Total Over" || betType === "Total Under") {
      team = `${game.home_team.slice(0, 3).toUpperCase()}/${game.away_team.slice(0, 3).toUpperCase()}`;
    }

    handleAddToSlip(game.id, betType, price, points, team, gameIndex); 
  };

  return (
    <div className="game-container">
      <h3>
        {game.home_team} vs. {game.away_team}
      </h3>
      <p>Commence Time: {convertTime(game.commence_time)}</p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {game.h2h_home_price && (
          <li className="game-option">
            <div className="button-container">
              <button onClick={() => handleSelectOutcome(game.home_team, "ML", game.h2h_home_price, null)}>
                ({formatPrice(game.h2h_home_price)})
              </button>
              <span> vs. </span>
              <button onClick={() => handleSelectOutcome(game.away_team, "ML", game.h2h_away_price, null)}>
                ({formatPrice(game.h2h_away_price)})
              </button>
            </div>
          </li>
        )}
        {game.spread_home_price && (
          <li className="game-option">
            <div className="button-container">
              <button onClick={() => handleSelectOutcome(game.home_team, "Spread", game.spread_home_price, game.spread_home_point)}>
                {formatPrice(game.spread_home_point)} ({formatPrice(game.spread_home_price)})
              </button>
              <span> vs. </span>
              <button onClick={() => handleSelectOutcome(game.away_team, "Spread", game.spread_away_price, game.spread_away_point)}>
                {formatPrice(game.spread_away_point)} ({formatPrice(game.spread_away_price)})
              </button>
            </div>
          </li>
        )}
        {game.over_price && (
          <li className="game-option">
            <div className="button-container">
              <button onClick={() => handleSelectOutcome("Over", "Total Over", game.over_price, game.over_point)}>
                Over {game.over_point} ({formatPrice(game.over_price)})
              </button>
              <span>vs.</span>
              <button onClick={() => handleSelectOutcome("Under", "Total Under", game.under_price, game.under_point)}>
                Under {game.under_point} ({formatPrice(game.under_price)})
              </button>
            </div>
          </li>
        )}
      </ul>
    </div>
  );
  }
  
  export default GameContainer;

