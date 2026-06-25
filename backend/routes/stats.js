const express = require('express');
const { pool } = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/stats/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.username, u.avatar,
        s.games_played, s.wins, s.losses, s.draws, s.elo_rating,
        ROUND(IF(s.games_played > 0, (s.wins / s.games_played) * 100, 0), 1) AS win_rate
      FROM users u
      JOIN user_statistics s ON u.id = s.user_id
      WHERE s.games_played > 0
      ORDER BY s.elo_rating DESC, s.wins DESC
      LIMIT 20
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/stats/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, 
        ROUND(IF(s.games_played > 0, (s.wins / s.games_played) * 100, 0), 1) AS win_rate,
        (SELECT COUNT(*)+1 FROM user_statistics s2 WHERE s2.elo_rating > s.elo_rating) AS rank
      FROM user_statistics s WHERE s.user_id = ?
    `, [req.user.id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Stats not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
