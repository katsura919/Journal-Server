require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const initWebSocket = require('./websockets');

const userModel = require('./models/userModel');
const authRoutes = require('./routes/authRoutes');
const journalRoutes = require('./routes/journalRoutes');

const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);  // Using http server to allow WebSocket connections

app.use(cors());
app.use(bodyParser.json());

app.use('/auth', authRoutes);
app.use('/api/journals', journalRoutes);

// Initialize WebSocket server, passing the Express server
initWebSocket(server);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
