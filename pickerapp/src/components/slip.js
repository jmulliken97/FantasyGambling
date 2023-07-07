import React, { useState, useEffect } from "react";
import { calculateReward } from "./rewardCalculator";
import "./slip.css";


const Slip = ({ slipItems, isOpen, toggleSlip, updateSlipItems }) => {
  const [rewards, setRewards] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('public');

  useEffect(() => {
    setRewards(slipItems.map(() => 0));
    fetch(`https://merlunietest.com/league/user-leagues`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', 
    })
    .then(response => response.json())
    .then(data => {
      if (data && data.leagues) {
        setLeagues(data.leagues);
        const firstLeagueName = data.leagues.length > 0 ? data.leagues[0].league_name : 'public';
        setSelectedLeague(firstLeagueName);
      } else {
        setLeagues([]);
        setSelectedLeague('public');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      setLeagues([]);
      setSelectedLeague('public');
    });
  }, [slipItems]);
  

  if (!isOpen) {
    return null;
  }

  const handleClose = (e) => {
    if (e.target.className === "slip-overlay") {
      toggleSlip(false);
    }
  };

  const handleRemoveItem = (index) => {
    const newSlipItems = [...slipItems];
    newSlipItems.splice(index, 1);
    updateSlipItems(newSlipItems); 
  
    const newRewards = [...rewards];
    newRewards.splice(index, 1);
    setRewards(newRewards);
  };

  const handleSubmit = async () => {
    if (isSubmitting) { 
      return; 
    }
  
    setIsSubmitting(true);
  
    const selectedLeagueName = selectedLeague !== 'public' 
  ? selectedLeague
  : 'public';
  
    const serializedSlipData = slipItems.map((item, index) => {
      const slipData = {
        gameId: item.gameId,
        team: item.team,
        betType: item.betType,
        price: item.price,
        points: item.points,
        riskAmount: parseFloat(document.getElementById(`risk-amount-${index}`).value),
        rewardAmount: rewards[index],
        leagueName: selectedLeagueName, // the league name is always included, even if it's 'public'
      };
  
      return slipData;
    });
  
    
  
    try {
      const response = await fetch('https://merlunietest.com/submit-slip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies along with the request
        body: JSON.stringify({ slipData: serializedSlipData }),
      });
  
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        toggleSlip(false);
        updateSlipItems([]);
        setRewards([]);
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsSubmitting(false); 
    }
  };
  

  const handleRiskAmountChange = (e, index) => {
    const riskAmount = parseFloat(e.target.value);
    const price = slipItems[index].price;
    const reward = calculateReward(price, riskAmount);
    const newRewards = [...rewards];
    newRewards[index] = reward;
    setRewards(newRewards);
  };

  return (
    <div className="slip-overlay" onClick={handleClose}>
      <div className="slip">
        <h2>Your Slip</h2>
        <select className="league-selector" value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)}>
          <option value="public">Public</option>
          {leagues.map((league, index) => (
            <option key={index} value={league.league_name}>{league.league_name}</option>
        ))}
  </select>
        <ul>
          {slipItems.map((item, index) => (
            <li key={index} className="slip-item">
              <span className="team-name">{item.team}</span>
              <span className="bet-type">{item.betType}</span>
              <span className="price">{item.price}</span>
              {item.points && <span className="points">{item.points}</span>}
              <label htmlFor={`risk-amount-${index}`}>Risk:</label>
              <input
                type="number"
                id={`risk-amount-${index}`}
                min="0"
                placeholder="$"
                className="risk-amount"
                onChange={(e) => handleRiskAmountChange(e, index)}
              />
              <span className="reward">Reward: ${rewards[index].toFixed(2)}</span>
              <button onClick={() => handleRemoveItem(index)} className="remove-button">X</button>
            </li>
          ))}
        </ul>
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={() => toggleSlip(false)}>Close</button>
      </div>
    </div>
  );
};

export default Slip;
