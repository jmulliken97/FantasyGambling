import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './components.css';

const LeaderboardColumn = () => {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get('http://merlunietest.com/leaderboard');
        
        const userMap = new Map();
        response.data.forEach(user => {
          userMap.set(user.username, user);
        });
  
        const uniqueUsers = Array.from(userMap.values());
  
        setLeaderboard(uniqueUsers);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };
  
    fetchLeaderboard();
  }, []);

  const sortedLeaderboard = leaderboard.sort((a, b) => b.total_gain_or_loss - a.total_gain_or_loss);
    
  return (
    <div className="leaderboard">
      <h3>Leaderboard</h3>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Total Gain/Loss</th>
          </tr>
        </thead>
        <tbody>
          {sortedLeaderboard.map((user, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{user.username}</td>
              <td>{user.total_gain_or_loss}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardColumn;

