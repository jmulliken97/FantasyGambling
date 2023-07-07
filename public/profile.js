async function fetchUserData() {
    try {
      const response = await fetch('https://merlunietest.com/get-user-data', {
        method: 'GET',
        credentials: 'include',
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched user data:', data); 
        displayUserData(data);
      } else {
        console.error('Error fetching user data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  function displayUserData(userData) {
    document.getElementById('display-username').innerHTML += userData.user.username;
    document.getElementById('email').innerHTML += userData.user.email;
    document.getElementById('balance').innerHTML += userData.user.balance;
  }


  async function fetchUserPicks() {
    try {
      const response = await fetch('https://merlunietest.com/user-picks', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched user picks:', data);
        displayUserPicks(data.picks);
      } else {
        console.error('Error fetching user picks:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user picks:', error);
    }
  }

  function displayUserPicks(picks) {
    const picksContainer = document.getElementById('user-picks');
    const totalPicksContainer = document.getElementById('total-picks');

    totalPicksContainer.innerHTML = "Total Picks: " + picks.length;

    if (picks.length === 0) {
      picksContainer.innerHTML = '<p>No picks found.</p>';
    } else {
      const picksTable = document.createElement('table');
      const headerRow = document.createElement('tr');
      const headers = ['Pick ID', 'Team', 'Type', 'Odds', 'Reward Amount', 'Risk Amount', 'Outcome'];
  
      headers.forEach(headerText => {
        const header = document.createElement('th');
        header.textContent = headerText;
        headerRow.appendChild(header);
      });
  
      picksTable.appendChild(headerRow);
  
      picks.forEach(pick => {
        const row = document.createElement('tr');
        const pickId = document.createElement('td');
        const team = document.createElement('td');
        const betType = document.createElement('td');
        const odds = document.createElement('td');
        const rewardAmount = document.createElement('td');
        const riskAmount = document.createElement('td');
        const outcome = document.createElement('td');
  
        pickId.textContent = pick.id;
        team.textContent = pick.team;
        betType.textContent = pick.betType;
        odds.textContent = pick.price;
        rewardAmount.textContent = pick.reward_amount;
        riskAmount.textContent = pick.riskAmount;
        outcome.textContent = pick.outcome;
  
        row.appendChild(pickId);
        row.appendChild(team);
        row.appendChild(betType);
        row.appendChild(odds);
        row.appendChild(rewardAmount);
        row.appendChild(riskAmount);
        row.appendChild(outcome);
  
        picksTable.appendChild(row);
      });
  
      picksContainer.appendChild(picksTable);
    }
  }

  async function updateProfile() {
    const newEmail = document.getElementById('newEmail').value;
    const newPassword = document.getElementById('newPassword').value;
  
    try {
      const response = await fetch('https://merlunietest.com/update-profile', {
        method: 'POST',
        body: JSON.stringify({ username: document.cookie.username, newEmail, newPassword }),
        headers: { 'Content-Type': 'application/json' },
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert(data.message);
        window.location.href = 'profile.html'; // Redirect to the profile page
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert('Error: Unable to update profile');
    }
  }

  const editDetailsButton = document.getElementById('edit-details-btn');
  if (editDetailsButton) {
    editDetailsButton.addEventListener('click', () => {
      const updateForm = document.getElementById('update-form');
      if (updateForm.style.display === 'block') {
        updateForm.style.display = 'none';
  } else {
    updateForm.style.display = 'block';
  }
});
}
const updateProfileButton = document.getElementById('update-profile-btn');
if (updateProfileButton) {
updateProfileButton.addEventListener('click', updateProfile);
}


  fetchUserData();
  fetchUserPicks(); 
;