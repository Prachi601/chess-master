const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { initDB } = require('./db/database');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const statsRoutes = require('./routes/stats');
const setupSocket = require('./socket/gameSocket');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'Chess Master API running ♟' }));

// Socket.IO
setupSocket(io);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await initDB();
  server.listen(PORT, () => {
    console.log(`♟ Chess Master Backend running on port ${PORT}`);
  });
};

start();
