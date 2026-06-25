# ♛ Chess Master — Full Stack Web Application

A fully-featured chess application built with React, Node.js/Express, MySQL, and Socket.IO.

## Features
- **Authentication** — JWT-based login & signup with bcrypt password hashing
- **3 Game Modes** — vs Computer (AI), Local 2-player, Online Multiplayer
- **Complete Chess Rules** — Legal move validation, check, checkmate, stalemate, castling, en passant, pawn promotion, threefold repetition, fifty-move rule
- **AI Opponent** — Minimax with alpha-beta pruning, 5 difficulty levels
- **Hint System** — Get move suggestions powered by the built-in AI
- **Auto Save & Resume** — All moves saved to MySQL, games resumable
- **Online Multiplayer** — Real-time play via Socket.IO, matchmaking, private rooms, chat, draw offers, resign
- **User Statistics** — Win rate, ELO rating, game history
- **Leaderboard** — Global rankings by ELO
- **Learn Chess** — Interactive piece guide, special rules, openings, strategy tips

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MySQL 8 |
| Auth | JWT, Bcrypt |
| Realtime | Socket.IO |
| State | React Context + useState/useReducer |

## Project Structure
```
chess-master/
├── backend/
│   ├── db/database.js        # MySQL connection + schema auto-init
│   ├── middleware/auth.js    # JWT middleware
│   ├── routes/
│   │   ├── auth.js           # Register, login, profile
│   │   ├── games.js          # Create, save moves, results
│   │   └── stats.js          # Leaderboard, personal stats
│   ├── socket/gameSocket.js  # Socket.IO multiplayer handler
│   └── server.js             # Express + Socket.IO entry
└── frontend/
    └── src/
        ├── components/
        │   ├── Auth/AuthPage.jsx      # Login & Register
        │   ├── Board/ChessBoard.jsx   # Interactive board
        │   ├── Game/GamePage.jsx      # Main game controller
        │   └── UI/                    # Welcome, Setup, Learn, Leaderboard
        ├── context/AuthContext.jsx    # Global auth state
        ├── utils/
        │   ├── chessEngine.js         # Full chess rules + AI
        │   └── api.js                 # Axios instance
        └── index.css                  # Complete design system
```

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- MySQL 8+

### 2. Database
```bash
# MySQL — create the database (tables auto-created on first start)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS chess_master;"
```

### 3. Backend
```bash
cd backend
npm install

# Create .env from example
cp .env.example .env
# Edit .env with your MySQL credentials and a strong JWT secret

npm start       # production
# or
npm run dev     # development (requires nodemon: npm i -g nodemon)
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | — | Create account |
| POST | /api/auth/login | — | Login |
| GET | /api/auth/me | ✓ | Current user profile |
| POST | /api/games | ✓ | Create new game |
| GET | /api/games/my | ✓ | My recent games |
| GET | /api/games/:id | ✓ | Game details + moves |
| POST | /api/games/:id/moves | ✓ | Save a move |
| PATCH | /api/games/:id/result | ✓ | Set game result |
| GET | /api/stats/me | ✓ | Personal statistics |
| GET | /api/stats/leaderboard | — | Global leaderboard |

## Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| find_match | — | Join matchmaking queue |
| cancel_search | — | Leave matchmaking |
| create_room | {roomId} | Create private room |
| join_room | {roomId} | Join private room |
| make_move | {roomId, move, fen} | Send move to opponent |
| offer_draw | {roomId} | Offer draw |
| accept_draw | {roomId} | Accept draw |
| decline_draw | {roomId} | Decline draw |
| resign | {roomId} | Resign game |
| chat_message | {roomId, message} | Send chat |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| match_found | {white, black} | Matchmaking success |
| game_start | {roomId, white, black} | Room game starting |
| opponent_move | {move, fen} | Opponent's move |
| draw_offered | — | Opponent wants draw |
| game_over | {result, reason} | Game ended |
| chat_message | {username, message} | Chat received |

## Environment Variables (.env)
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=chess_master
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:5173
```

## Chess Engine
The `chessEngine.js` implements all FIDE chess rules from scratch:
- **Piece movement** — All 6 piece types with complete movement rules
- **Special moves** — Castling (kingside & queenside), en passant, promotion
- **Check detection** — King safety validation on every move
- **Legal move filtering** — Moves that leave king in check are filtered out
- **Game state** — Checkmate, stalemate, draw detection
- **AI** — Minimax algorithm with alpha-beta pruning (adjustable depth 1-5)

## Deployment
- **Backend** — Deploy to Railway, Render, or any Node.js host
- **Frontend** — Deploy to Vercel or Netlify
- Update `CLIENT_URL` in backend `.env` and the Vite proxy config with production URLs

---
Built by Prachi | Chess Master PRD v1.0
