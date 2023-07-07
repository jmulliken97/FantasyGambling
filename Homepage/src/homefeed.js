import React, { useState, useEffect, createContext } from 'react';
import axios from 'axios';
import PicksColumn from './components/PickColumn';
import CommentColumn from './components/CommentColumn';
import LeaderboardColumn from './components/LeaderboardColumn';
import './App.css';

export const WindowSizeContext = createContext();

function App() {
  const [selectedPick, setSelectedPick] = useState(null);
  const [picks, setPicks] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const fetchPicks = async () => {
      try {
        const response = await axios.get('https://merlunietest.com/picks');
        const upcomingPicks = response.data.filter(pick => pick.outcome === 'upcoming');
        setPicks(upcomingPicks);
      } catch (error) {
        console.error('Error fetching picks:', error);
      }
    };

    fetchPicks();
  }, []);

  useEffect(() => {
    const handleWindowResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  const handlePickSelected = (pickId) => {
    const selected = picks.find(pick => pick.id === pickId);
    setSelectedPick(selected);
    if (windowWidth <= 750) {
      setShowOverlay(true); 
    }
  };

  return (
    <WindowSizeContext.Provider value={{ windowWidth, showOverlay, setShowOverlay }}>
      <div className="App">
        <header className="App-header">
          {/* Insert your header and nav bar here */}
        </header>
        <div className="container">
          <PicksColumn picks={picks} onPickSelected={handlePickSelected} />
          <CommentColumn selectedPick={selectedPick} />
          <LeaderboardColumn />
        </div>
      </div>
    </WindowSizeContext.Provider>
  );
}

export default App;




