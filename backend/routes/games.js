const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/games - Create new game
router.post('/', authMiddleware, async (req, res) => {
  const { mode, color, ai_depth } = req.body;
  const gameId = uuidv4();
  const userId = req.user.id;

  try {
    const whiteId = color === 'white' ? userId : null;
    const blackId = color === 'black' ? userId : null;

    await pool.query(
      'INSERT INTO games (id, white_player_id, black_player_id, mode, status, ai_depth, fen) VALUES (?, ?, ?, ?, "active", ?, ?)',
      [gameId, whiteId, blackId, mode || 'vs_computer', ai_depth || 3,
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1']
    );

    res.status(201).json({ gameId, mode, color });
  } catch (err) {
    console.error('Create game error:', err);
    res.status(500).json({ message: 'Failed to create game' });
  }
});

// GET /api/games/my - Get user's recent games
router.get('/my', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const [games] = await pool.query(`
      SELECT g.*, 
        wu.username AS white_username, bu.username AS black_username,
        (SELECT COUNT(*) FROM moves m WHERE m.game_id = g.id) AS move_count
      FROM games g
      LEFT JOIN users wu ON g.white_player_id = wu.id
      LEFT JOIN users bu ON g.black_player_id = bu.id
      WHERE g.white_player_id = ? OR g.black_player_id = ?
      ORDER BY g.updated_at DESC LIMIT 10
    `, [userId, userId]);
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/games/:id - Get game by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [games] = await pool.query(`
      SELECT g.*, wu.username AS white_username, bu.username AS black_username
      FROM games g
      LEFT JOIN users wu ON g.white_player_id = wu.id
      LEFT JOIN users bu ON g.black_player_id = bu.id
      WHERE g.id = ?
    `, [req.params.id]);

    if (games.length === 0) return res.status(404).json({ message: 'Game not found' });

    const [moves] = await pool.query(
      'SELECT * FROM moves WHERE game_id = ? ORDER BY move_number ASC',
      [req.params.id]
    );

    res.json({ ...games[0], moves });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/games/:id/moves - Save a move
router.post('/:id/moves', authMiddleware, async (req, res) => {
  const { move_number, player_color, from_square, to_square, piece, san, fen_after,
    captured, is_check, is_checkmate, is_castle, is_promotion } = req.body;

  try {
    await pool.query(
      `INSERT INTO moves 
        (game_id, move_number, player_color, from_square, to_square, piece, san, fen_after, captured, is_check, is_checkmate, is_castle, is_promotion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, move_number, player_color, from_square, to_square, piece,
        san, fen_after, captured || null, is_check || false, is_checkmate || false,
        is_castle || null, is_promotion || null]
    );

    await pool.query(
      'UPDATE games SET fen = ?, pgn = CONCAT(IFNULL(pgn,""), ?), updated_at = NOW() WHERE id = ?',
      [fen_after, ` ${san}`, req.params.id]
    );

    res.status(201).json({ message: 'Move saved' });
  } catch (err) {
    console.error('Save move error:', err);
    res.status(500).json({ message: 'Failed to save move' });
  }
});

// PATCH /api/games/:id/result - End game
router.patch('/:id/result', authMiddleware, async (req, res) => {
  const { result, result_reason } = req.body;
  const userId = req.user.id;

  try {
    await pool.query(
      'UPDATE games SET status = "completed", result = ?, result_reason = ? WHERE id = ?',
      [result, result_reason, req.params.id]
    );

    // Update statistics
    const [games] = await pool.query('SELECT * FROM games WHERE id = ?', [req.params.id]);
    const game = games[0];

    const updateStats = async (playerId, outcome) => {
      if (!playerId) return;
      await pool.query(`
        UPDATE user_statistics SET 
          games_played = games_played + 1,
          wins = wins + ?,
          losses = losses + ?,
          draws = draws + ?,
          games_vs_computer = games_vs_computer + ?,
          games_online = games_online + ?
        WHERE user_id = ?
      `, [
        outcome === 'win' ? 1 : 0,
        outcome === 'loss' ? 1 : 0,
        outcome === 'draw' ? 1 : 0,
        game.mode === 'vs_computer' ? 1 : 0,
        game.mode === 'online' ? 1 : 0,
        playerId
      ]);
    };

    if (result === 'white_wins') {
      await updateStats(game.white_player_id, 'win');
      await updateStats(game.black_player_id, 'loss');
    } else if (result === 'black_wins') {
      await updateStats(game.white_player_id, 'loss');
      await updateStats(game.black_player_id, 'win');
    } else if (result === 'draw') {
      await updateStats(game.white_player_id, 'draw');
      await updateStats(game.black_player_id, 'draw');
    }

    res.json({ message: 'Game result saved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
