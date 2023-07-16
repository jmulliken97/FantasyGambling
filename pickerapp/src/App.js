import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import GameContainer from "./components/GameContainer";
import Slip from "./components/slip";

function App() {
  const [data, setData] = useState([]);
  const [slipItems, setSlipItems] = useState([]);
  const [slipRisk, setSlipRisk] = useState([]);
  const [currentRisk, setCurrentRisk] = useState("");
  const [slipOpen, setSlipOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState("MLB");

  const getData = useCallback(() => {
    console.log("Fetching data...");
    let sportFile;
    switch (selectedSport) {
      case "MLB":
        sportFile = "processed_baseball_mlb.json";
        break;
      case "NBA":
        sportFile = "processed_basketball_nba.json";
        break;
      case "NHL":
        sportFile = "processed_icehockey_nhl.json";
        break;
      case "NFL":
        sportFile = "processed_football_nfl.json";
        break;
      default:
        break;
    }
    fetch(sportFile, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: 'include', // Send cookies along with the request
    })
      .then(function (response) {
        console.log("Data fetched successfully");
        return response.json();
      })
      .then(function (myJson) {
        console.log(myJson);
        setData(myJson);
      });
  }, [selectedSport]);

  const updateSlipItems = (newSlipItems) => {
    setSlipItems(newSlipItems);
  };

  const handleAddToSlip = (gameId, betType, price, points, team, gameIndex) => {
    console.log(gameId, betType, price, points, team, gameIndex);
    let items = [...slipItems];
    let risks = [...slipRisk];

    items.push({
      gameId,
      betType,
      price,
      points,
      team,
    });

    risks[gameIndex] = currentRisk;

    setSlipItems(items);
    setSlipRisk(risks);
  };

  const toggleSlip = (isOpen) => {
    setSlipOpen(isOpen);
  };
  const handleSportChange = (sport) => {
    setSelectedSport(sport);
  };

  useEffect(() => {
    getData();
  }, [getData]);

  return (
    <div id="container">
      <div className="sport-tabs">
        <button onClick={() => handleSportChange("MLB")}>MLB</button>
        <button onClick={() => handleSportChange("NBA")}>NBA</button>
        <button onClick={() => handleSportChange("NHL")}>NHL</button>
        <button onClick={() => handleSportChange("NFL")}>NFL</button>
      </div>
      <button className="show-slip-btn" onClick={() => toggleSlip(true)}>
        Show Slip
      </button>
      <div className="games-container">
        {data.length > 0 ? (
          data.map((game, index) => (
            <GameContainer
              key={index}
              game={game}
              currentRisk={currentRisk}
              setCurrentRisk={setCurrentRisk}
              gameIndex={index}
              handleAddToSlip={handleAddToSlip}
            />
          ))
        ) : (
          <p>No games available for this sport at the moment.</p> // Placeholder when no data is available
        )}
      </div>
      <Slip slipItems={slipItems} isOpen={slipOpen} toggleSlip={toggleSlip} updateSlipItems={updateSlipItems} />
    </div>
  );
}

export default App;
