import React, { useState } from 'react';
import axios from 'axios';

const JoinLeagueForm = () => {
  const [joinCode, setJoinCode] = useState('');

  const handleJoinCodeChange = (event) => {
    setJoinCode(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const confirmJoin = window.confirm(`Are you sure you want to join the league with join code ${joinCode}?`);

    if (confirmJoin) {
      axios.post('https://merlunietest.com/league/joinLeague', { join_code: joinCode }) 
        .then(response => {
          if(response.data.message) {
            alert(response.data.message);
          }
        })
        .catch(error => {
          if (error.response) {
            
            console.error('Error:', error.response.data.message);
          } else if (error.request) {
            
            console.error('Error:', error.message);
          } else {
            
            console.error('Error:', error.message);
          }
        });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="join-league-form">
      <label className="league-label">
        <h3>Join a League with a Join Code</h3>
        <input 
          type="text"
          name="join_code"
          value={joinCode}
          onChange={handleJoinCodeChange}
          placeholder="Join Code"
          className="league-input"
        />
      </label>
      <button type="submit" className="league-button">Join League</button>
    </form>
  );
};

export default JoinLeagueForm;

