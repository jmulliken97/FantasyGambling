require('dotenv').config({ path: './connections.env' });
if (!process.env.SESSION_SECRET) {
  console.error('FATAL ERROR: SESSION_SECRET is not defined.');
  process.exit(1);
}
const express = require('express');
const session = require('express-session');
const redis = require('redis');
const connectRedis = require('connect-redis');
const RedisStore = require("connect-redis").default;
const { createClient } = require('redis');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const cron = require('node-cron');
const { fetchGameResults } = require('./gameResults');
const { updateOutcomes, updatePaidStatus } = require('./updateOutcomes');
const { fetchSportsOdds } = require('./fetchodds');
const { updateLeagueStatus } = require('./leaguestatus');

const cookieSecret = process.env.SESSION_SECRET;

const app = express();
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", 'https://merlunietest.com', 'http://merlunietest.com'],
      scriptSrc: ["'self'", 'https://unpkg.com/react@17/umd/react.production.min.js', 'https://unpkg.com/react-dom@17/umd/react-dom.production.min.js'],
      styleSrc: ["'self'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      imgSrc: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com', 'data:', 'https://www.slant.co'],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"],
      scriptSrcAttr: ["'none'"],
      upgradeInsecureRequests: []
    },
  },
  frameguard: {
    action: 'sameorigin',
  },
  noSniff: true,
  referrerPolicy: { policy: 'no-referrer' },  
}));

app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "geolocation=(), midi=(), sync-xhr=(), microphone=(), camera=(), magnetometer=(), gyroscope=(), fullscreen=(self)");
  next();
});



const routes = require('./routes');
const leagueRoutes = require('./league');
const adminRoutes = require('./admin');

app.use(cookieParser(cookieSecret));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: ['https://merlunietest.com', 'https://www.merlunietest.com', 'http://merlunietest.com', 'http://www.merlunietest.com'], credentials: true }));
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 3000;

const redisClient = createClient({
  host: 'localhost', 
  port: 6379, 
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

(async () => {
  await redisClient.connect();
  console.log('Redis is ready');
})();


app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 4 * 60 * 60 * 1000 }, // 4 hours
  })
);

async function fetchAndUpdateResults() {
  try {
    const daysFrom = 1; // Change to change days
    const gameResults = await fetchGameResults(['basketball_nba', 'baseball_mlb', 'icehockey_nhl'], daysFrom);
    await updateOutcomes(gameResults);
    await updatePaidStatus();
    console.log('Outcomes updated successfully');
  } catch (error) {
    console.error('Error updating outcomes:', error);
  }
}

async function fetchAndUpdateOdds() {
  try {
    await fetchSportsOdds();
    console.log('Odds updated successfully');
  } catch (error) {
    console.error('Error updating odds:', error);
  }
}

// Schedule tasks
cron.schedule('0 * * * *', fetchAndUpdateResults, { timezone: "America/Chicago" }); // Run at the start of every hour
cron.schedule('0 2-12 * * *', fetchAndUpdateOdds, { timezone: "America/Chicago" }); // Run at the start of every hour from 2 AM to 12 PM
cron.schedule('*/15 12-23 * * *', fetchAndUpdateOdds, { timezone: "America/Chicago" }); // Run every 15 minutes from 12 PM to 11 PM
cron.schedule('0 0 * * *', updateLeagueStatus, { timezone: "America/Chicago" }); // Run at midnight every day

wss.on('connection', (ws) => {
  console.log('A new WebSocket connection has been established.');

  // Handle incoming messages
  ws.on('message', (message) => {
    console.log('Received message:', message);
    
    // Process the incoming message and send a response
    const response = `Server received: ${message}`;
    ws.send(response);
  });

  // Handle connection close
  ws.on('close', () => {
    console.log('WebSocket connection closed.');
  });

  // Handle connection errors
  ws.on('error', (error) => {
    console.error('WebSocket connection error:', error);
  });
});

app.use('/', routes);
app.use('/league', leagueRoutes);
app.use('/admin', adminRoutes);

const command = process.argv[2];
if (command === 'fetch-results' || command === '--fetch-results') {
  fetchAndUpdateResults();
} else if (command === 'fetch-odds' || command === '--fetch-odds') {
  fetchAndUpdateOdds();
} else if (command === 'leagueupdate' || command === '--leagueupdate') {
  updateLeagueStatus();
} else {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports.wss = wss;



