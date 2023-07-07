import React from 'react';

const LeagueCard = ({ league }) => {
  return (
    <div className="league-card">
      <h3>{league.league_name}</h3>
      <p>Participants: {league.max_participants}</p>
      <p>Starting balance: {league.starting_balance}</p>
    </div>
  );
};

export default LeagueCard;