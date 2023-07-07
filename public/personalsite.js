function myFunction() {
  var topnav = document.getElementById("Topnav");
  var dropdownMenu = document.getElementsByClassName("dropdown-menu")[0];
  if (topnav.className === "topnav") {
    topnav.className += " responsive";
  } else if (topnav.className === "topnav responsive") {
    topnav.className = "topnav";
  }
};

window.addEventListener('resize', myFunction);

  document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const updateForm = document.getElementById('update-form');

  
  
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
  
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
  
        try {
          const response = await fetch('https://merlunietest.com/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
  
          const data = await response.json();

          if (response.ok) {
            alert(data.message);
            window.location.href = data.redirectTo; // Redirect to the React app's homepage
          } else {
            alert(data.message);
        }
      } catch (error) {
        console.error(error);
        alert('Error: Unable to login');
    }
  });
}
  
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
  
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const email = document.getElementById('email').value;
  
        try {
          const response = await fetch('https://merlunietest.com/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, email }),
            headers: { 'Content-Type': 'application/json' },
          });
  
          const data = await response.json();
          const messageDiv = document.getElementById('message');

          if (response.status === 200) {
          messageDiv.textContent = data.message;
          messageDiv.style.color = 'green';
        } else {
          messageDiv.textContent = data.message;
          messageDiv.style.color = 'red';
        }
      } catch (error) {
        console.error('Error:', error);
      }
    });
    }

    
  });