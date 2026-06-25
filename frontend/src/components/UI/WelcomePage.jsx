import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const WelcomePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentGames, setRecentGames] = useState([]);

  useEffect(() => {
    if (user) {
      api.get('/stats/me').then(r => setStats(r.data)).catch(() => {});
      api.get('/games/my').then(r => setRecentGames(r.data)).catch(() => {});
    }
  }, [user]);

  return (
    <div className="welcome-page">
      <header className="top-bar">
        <div className="brand">♛ Chess Master</div>
        <div className="top-bar-right">
          <span className="user-chip">{user?.avatar || '♟'} {user?.username}</span>
          <span className="elo-badge">ELO {stats?.elo_rating || 1200}</span>
          <button className="btn-ghost" onClick={() => navigate('/leaderboard')}>🏆 Leaderboard</button>
          <button className="btn-ghost" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="welcome-main">
        <section className="hero-section">
          <h1 className="hero-title">Ready to Play?</h1>
          <p className="hero-sub">Choose your battle, {user?.username?.split(' ')[0] || 'Player'}</p>

          <div className="mode-grid">
            <div className="mode-card" onClick={() => navigate('/setup?mode=vs_computer')}>
              <div className="mode-icon">🤖</div>
              <h3>vs Computer</h3>
              <p>Challenge the AI at your skill level</p>
              <span className="mode-tag">Solo</span>
            </div>
            <div className="mode-card" onClick={() => navigate('/setup?mode=local')}>
              <div className="mode-icon">👥</div>
              <h3>Local Match</h3>
              <p>Play with a friend on same device</p>
              <span className="mode-tag">2 Players</span>
            </div>
            <div className="mode-card featured" onClick={() => navigate('/setup?mode=online')}>
              <div className="mode-icon">🌐</div>
              <h3>Play Online</h3>
              <p>Match with players worldwide</p>
              <span className="mode-tag">Live</span>
            </div>
          </div>

          <button className="btn-learn" onClick={() => navigate('/learn')}>
            📖 Learn Chess — Rules & Strategies
          </button>
        </section>

        {stats && (
          <section className="stats-section">
            <h2>Your Stats</h2>
            <div className="stats-grid">
              <div className="stat-card"><span className="stat-val">{stats.games_played}</span><span className="stat-lbl">Games</span></div>
              <div className="stat-card green"><span className="stat-val">{stats.wins}</span><span className="stat-lbl">Wins</span></div>
              <div className="stat-card red"><span className="stat-val">{stats.losses}</span><span className="stat-lbl">Losses</span></div>
              <div className="stat-card yellow"><span className="stat-val">{stats.draws}</span><span className="stat-lbl">Draws</span></div>
              <div className="stat-card blue"><span className="stat-val">{stats.win_rate}%</span><span className="stat-lbl">Win Rate</span></div>
              <div className="stat-card purple"><span className="stat-val">#{stats.rank || '—'}</span><span className="stat-lbl">Rank</span></div>
            </div>
          </section>
        )}

        {recentGames.length > 0 && (
          <section className="recent-section">
            <h2>Recent Games</h2>
            <div className="games-list">
              {recentGames.slice(0, 5).map(g => (
                <div key={g.id} className="game-row" onClick={() => navigate(`/game/${g.id}`)}>
                  <span className="game-mode-badge">{g.mode === 'vs_computer' ? '🤖' : g.mode === 'online' ? '🌐' : '👥'}</span>
                  <span className="game-players">
                    {g.white_username || 'White'} vs {g.black_username || 'Black'}
                  </span>
                  <span className={`game-result ${g.result}`}>{g.result?.replace('_', ' ') || g.status}</span>
                  <span className="game-moves">{g.move_count} moves</span>
                  <button className="btn-tiny" onClick={e => { e.stopPropagation(); navigate(`/game/${g.id}`); }}>
                    {g.status === 'active' ? 'Resume ▶' : 'Review'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default WelcomePage;
