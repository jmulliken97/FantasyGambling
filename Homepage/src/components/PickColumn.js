import React from 'react';
import './components.css';

const PicksColumn = ({ picks, onPickSelected }) => {
  const handlePickClick = (pickId) => {
    onPickSelected(pickId);
  };

  return (
    <div className="picks-grid">
      {picks
        .sort((a, b) => b.id - a.id)
        .map(pick => (
          <div key={pick.id} className="card mb-3" onClick={() => handlePickClick(pick.id)}>
            <div className="card-header">
              <div className="header-content">
                <h2>{pick.team} {pick.points} @ {pick.price}</h2>
                <span className="pick-id">#{pick.id}</span>
              </div>
            </div>
            <div className="card-body">
              <p><strong>Placed by:</strong> {pick.username}</p>
              {pick.league_name !== 'public' && <p><strong>League:</strong> {pick.league_name}</p>}
              <p><strong>Risk Amount:</strong> {pick.riskAmount}</p>
              <p><strong>Bet Type:</strong> {pick.betType}</p>
              <p><strong>Placed:</strong> {new Date(pick.created_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
    </div>
  );
};

export default PicksColumn;
