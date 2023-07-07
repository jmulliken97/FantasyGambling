import React, { useState } from 'react';

const LeagueCreationForm = () => {
  const [formState, setFormState] = useState({
    league_name: '',
    league_type: '',
    max_participants: 1,
    starting_balance: '',
    start_date: '',
    end_date: ''
  });

  const handleInputChange = (event) => {
    setFormState({
      ...formState,
      [event.target.name]: event.target.type === 'number' ? parseInt(event.target.value) : event.target.value
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    fetch('https://merlunietest.com/league/createleague', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formState)
    })
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.error('Error:', error));
  };

  return (
    <form onSubmit={handleSubmit} className="league-form">
      <h3>Make a League</h3>
      <label className="league-label">
        League Name
        <input 
          type="text"
          name="league_name"
          value={formState.league_name}
          onChange={handleInputChange}
          placeholder="League Name"
          className="league-input"
        />
      </label>
      
      <label className="league-label">
        League Type
        <select
          className="league-select"
          name="league_type"
          value={formState.league_type}
          onChange={handleInputChange}
        >
          <option value="">--Select League Type--</option>
          <option value="type1">Type 1</option>
          <option value="type2">Type 2</option>
          <option value="type3">Type 3</option>
          <option value="type4">Type 4</option>
        </select>
      </label>

      <label className="league-label">
        Max Participants: {formState.max_participants}
        <input 
          className="league-range"
          type="range"
          name="max_participants"
          min="1"
          max="20"
          value={formState.max_participants}
          onChange={handleInputChange}
        />
      </label>
      
      <label className="league-label">
        Starting Balance
        <input 
          type="text"
          name="starting_balance"
          value={formState.starting_balance}
          onChange={handleInputChange}
          placeholder="Starting Balance"
          className="league-input"
        />
      </label>
      
      <label className="league-label">
        Start Date
        <input 
          type="date"
          name="start_date"
          value={formState.start_date}
          onChange={handleInputChange}
          className="league-input"
        />
      </label>

      <label className="league-label">
        End Date
        <input 
          type="date"
          name="end_date"
          value={formState.end_date}
          onChange={handleInputChange}
          className="league-input"
        />
      </label>
      
      <button type="submit" className="league-button">Create League</button>
    </form>
  );
};

export default LeagueCreationForm;


