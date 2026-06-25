const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chess_master',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const initDB = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'chess_master'}\``);
    await conn.query(`USE \`${process.env.DB_NAME || 'chess_master'}\``);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar VARCHAR(10) DEFAULT '♟',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS games (
        id VARCHAR(36) PRIMARY KEY,
        white_player_id INT,
        black_player_id INT,
        mode ENUM('vs_computer','local','online') NOT NULL DEFAULT 'vs_computer',
        status ENUM('waiting','active','completed','abandoned') DEFAULT 'waiting',
        result ENUM('white_wins','black_wins','draw','abandoned') DEFAULT NULL,
        result_reason VARCHAR(100) DEFAULT NULL,
        fen TEXT,
        pgn TEXT,
        ai_depth INT DEFAULT 3,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (white_player_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (black_player_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS moves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id VARCHAR(36) NOT NULL,
        move_number INT NOT NULL,
        player_color ENUM('white','black') NOT NULL,
        from_square VARCHAR(2) NOT NULL,
        to_square VARCHAR(2) NOT NULL,
        piece VARCHAR(10) NOT NULL,
        san VARCHAR(10),
        fen_after TEXT,
        captured VARCHAR(10) DEFAULT NULL,
        is_check BOOLEAN DEFAULT FALSE,
        is_checkmate BOOLEAN DEFAULT FALSE,
        is_castle VARCHAR(10) DEFAULT NULL,
        is_promotion VARCHAR(5) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_statistics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNIQUE NOT NULL,
        games_played INT DEFAULT 0,
        wins INT DEFAULT 0,
        losses INT DEFAULT 0,
        draws INT DEFAULT 0,
        games_vs_computer INT DEFAULT 0,
        games_online INT DEFAULT 0,
        elo_rating INT DEFAULT 1200,
        highest_elo INT DEFAULT 1200,
        total_moves INT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database init error:', err.message);
  } finally {
    conn.release();
  }
};

module.exports = { pool, initDB };
