import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LeagueCreationForm from './leaguecreation';
import JoinLeagueForm from './joinleagueform';
import LeagueCard from './leaguecard';
import './App.css';


const LeagueList = () => {
  const [leagues, setLeagues] = useState([]);

  useEffect(() => {
    axios.get('https://merlunietest.com/league/allleagues')
      .then(res => {
        if (Array.isArray(res.data)) {
          setLeagues(res.data);
        } else {
          console.error('Data from API is not an array:', res.data);
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="league-list-container">
      <h2>Existing Leagues</h2>
      {leagues.map(league => <LeagueCard key={league.id} league={league} />)}
    </div>
  );
};

const UserLeagues = () => {
  const [userLeagues, setUserLeagues] = useState([]);

  useEffect(() => {
    axios.get('https://merlunietest.com/league/user-leagues')
      .then(res => {
        if (Array.isArray(res.data.leagues)) {
          setUserLeagues(res.data.leagues);
        } else {
          console.error('Data from API is not an array:', res.data.leagues);
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="league-list-container">
      <h2>Your Leagues</h2>
      <p>You are currently in {userLeagues.length} leagues.</p>
      {userLeagues.map(league => <LeagueCard key={league.id} league={league} />)}
    </div>
  );
};


const App = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Leagues</h1>
      </header>
      <div className="content">
        <div className="league-form-container">
          <LeagueCreationForm />
          <JoinLeagueForm />       
          <LeagueList />
          <UserLeagues />
        </div>
      </div>
    </div>
  );
};

export default App;


