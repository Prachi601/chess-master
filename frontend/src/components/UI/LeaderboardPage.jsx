import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const LeaderboardPage = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/stats/leaderboard').then(r => setLeaders(r.data)).finally(() => setLoading(false));
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="leaderboard-page">
      <div className="lb-header">
        <button className="btn-back" onClick={() => navigate('/')}>← Back</button>
        <h1>🏆 Leaderboard</h1>
        <p>Top players ranked by ELO rating</p>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading rankings...</div>
      ) : leaders.length === 0 ? (
        <div className="empty-state">
          <p>No ranked players yet. Play some games to appear here!</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Play Now</button>
        </div>
      ) : (
        <div className="lb-table-wrap">
          <table className="lb-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>ELO</th>
                <th>W</th>
                <th>L</th>
                <th>D</th>
                <th>Games</th>
                <th>Win %</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((p, i) => (
                <tr key={p.id} className={i < 3 ? 'top-row' : ''}>
                  <td className="rank-cell">
                    {medals[i] || `#${i+1}`}
                  </td>
                  <td className="player-cell">
                    <span className="player-avatar">{p.avatar || '♟'}</span>
                    <strong>{p.username}</strong>
                  </td>
                  <td><span className="elo-val">{p.elo_rating}</span></td>
                  <td className="wins">{p.wins}</td>
                  <td className="losses">{p.losses}</td>
                  <td className="draws">{p.draws}</td>
                  <td>{p.games_played}</td>
                  <td>
                    <div className="winrate-bar-wrap">
                      <div className="winrate-bar" style={{ width: p.win_rate + '%' }} />
                      <span>{p.win_rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
