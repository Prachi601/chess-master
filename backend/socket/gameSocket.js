const jwt = require('jsonwebtoken');

const rooms = new Map(); // roomId -> { white, black, spectators, fen }
const waitingQueue = []; // users waiting for a match

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        socket.user = decoded;
      } catch (e) {
        socket.user = { id: 'guest_' + socket.id, username: 'Guest' };
      }
    } else {
      socket.user = { id: 'guest_' + socket.id, username: 'Guest' };
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.username} (${socket.id})`);

    // --- Matchmaking ---
    socket.on('find_match', () => {
      if (waitingQueue.length > 0) {
        const opponent = waitingQueue.shift();
        const roomId = `room_${Date.now()}`;

        rooms.set(roomId, {
          white: opponent,
          black: socket,
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          moves: [],
        });

        opponent.join(roomId);
        socket.join(roomId);
        opponent.roomId = roomId;
        socket.roomId = roomId;

        io.to(roomId).emit('match_found', {
          roomId,
          white: { username: opponent.user.username, id: opponent.user.id },
          black: { username: socket.user.username, id: socket.user.id },
        });
      } else {
        waitingQueue.push(socket);
        socket.emit('waiting_for_opponent');
      }
    });

    socket.on('cancel_search', () => {
      const idx = waitingQueue.indexOf(socket);
      if (idx !== -1) waitingQueue.splice(idx, 1);
      socket.emit('search_cancelled');
    });

    // --- Room join (private game) ---
    socket.on('create_room', ({ roomId }) => {
      const id = roomId || `room_${socket.user.id}_${Date.now()}`;
      rooms.set(id, {
        white: socket,
        black: null,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moves: [],
      });
      socket.join(id);
      socket.roomId = id;
      socket.emit('room_created', { roomId: id });
    });

    socket.on('join_room', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return socket.emit('error', { message: 'Room not found' });
      if (room.black) return socket.emit('error', { message: 'Room is full' });

      room.black = socket;
      socket.join(roomId);
      socket.roomId = roomId;

      io.to(roomId).emit('game_start', {
        roomId,
        white: { username: room.white.user.username, id: room.white.user.id },
        black: { username: socket.user.username, id: socket.user.id },
      });
    });

    // --- Move ---
    socket.on('make_move', ({ roomId, move, fen }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      room.fen = fen;
      room.moves.push(move);
      socket.to(roomId).emit('opponent_move', { move, fen });
    });

    // --- Draw offer ---
    socket.on('offer_draw', ({ roomId }) => {
      socket.to(roomId).emit('draw_offered');
    });

    socket.on('accept_draw', ({ roomId }) => {
      io.to(roomId).emit('game_over', { result: 'draw', reason: 'agreement' });
      rooms.delete(roomId);
    });

    socket.on('decline_draw', ({ roomId }) => {
      socket.to(roomId).emit('draw_declined');
    });

    // --- Resign ---
    socket.on('resign', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const isWhite = room.white?.id === socket.id;
      const result = isWhite ? 'black_wins' : 'white_wins';
      io.to(roomId).emit('game_over', { result, reason: 'resignation' });
      rooms.delete(roomId);
    });

    // --- Chat ---
    socket.on('chat_message', ({ roomId, message }) => {
      io.to(roomId).emit('chat_message', {
        username: socket.user.username,
        message,
        timestamp: Date.now(),
      });
    });

    // --- Disconnect ---
    socket.on('disconnect', () => {
      const idx = waitingQueue.indexOf(socket);
      if (idx !== -1) waitingQueue.splice(idx, 1);

      if (socket.roomId) {
        const room = rooms.get(socket.roomId);
        if (room) {
          socket.to(socket.roomId).emit('opponent_disconnected');
          rooms.delete(socket.roomId);
        }
      }
      console.log(`🔌 Disconnected: ${socket.user.username}`);
    });
  });
};
