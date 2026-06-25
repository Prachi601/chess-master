import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';

const SetupPage = () => {
  const [params] = useSearchParams();
  const mode = params.get('mode') || 'vs_computer';
  const [color, setColor] = useState('white');
  const [aiDepth, setAiDepth] = useState(3);
  const [roomId, setRoomId] = useState('');
  const [joinMode, setJoinMode] = useState('create');
  const navigate = useNavigate();

  const difficultyLabels = { 1: 'Beginner', 2: 'Easy', 3: 'Medium', 4: 'Hard', 5: 'Expert' };

  const startGame = async () => {
    try {
      const res = await api.post('/games', {
        mode,
        color: mode === 'local' ? 'white' : color,
        ai_depth: aiDepth,
      });
      const queryStr = mode === 'online'
        ? `?mode=online&color=${color}&join=${joinMode}&roomId=${roomId}`
        : `?mode=${mode}&color=${color}&ai=${aiDepth}`;
      navigate(`/game/${res.data.gameId}${queryStr}`);
    } catch (err) {
      alert('Failed to start game. Is the backend running?');
    }
  };

  return (
    <div className="setup-page">
      <button className="btn-back" onClick={() => navigate('/')}>← Back</button>
      <div className="setup-card">
        <h2 className="setup-title">
          {mode === 'vs_computer' ? '🤖 vs Computer' : mode === 'local' ? '👥 Local Match' : '🌐 Online Play'}
        </h2>

        {mode !== 'local' && (
          <div className="setup-section">
            <h3>Choose Your Color</h3>
            <div className="color-choice">
              {['white','black','random'].map(c => (
                <button key={c} className={`color-btn ${color===c?'selected':''}`}
                  onClick={() => setColor(c)}>
                  {c === 'white' ? '♔ White' : c === 'black' ? '♚ Black' : '🎲 Random'}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'vs_computer' && (
          <div className="setup-section">
            <h3>AI Difficulty: <strong>{difficultyLabels[aiDepth]}</strong></h3>
            <input type="range" min="1" max="5" value={aiDepth}
              onChange={e => setAiDepth(Number(e.target.value))}
              className="diff-slider" />
            <div className="diff-labels">
              {Object.entries(difficultyLabels).map(([d, l]) => (
                <span key={d} className={aiDepth == d ? 'active' : ''}>{l}</span>
              ))}
            </div>
          </div>
        )}

        {mode === 'online' && (
          <div className="setup-section">
            <h3>Matchmaking</h3>
            <div className="online-tabs">
              <button className={joinMode==='quick'?'active':''} onClick={() => setJoinMode('quick')}>Quick Match</button>
              <button className={joinMode==='create'?'active':''} onClick={() => setJoinMode('create')}>Create Room</button>
              <button className={joinMode==='join'?'active':''} onClick={() => setJoinMode('join')}>Join Room</button>
            </div>
            {joinMode === 'join' && (
              <input type="text" placeholder="Enter Room ID" value={roomId}
                onChange={e => setRoomId(e.target.value)} className="room-input" />
            )}
          </div>
        )}

        <button className="btn-start" onClick={startGame}>
          {mode === 'vs_computer' ? '⚔ Start Game' : mode === 'local' ? '⚔ Start Local Game' : '🌐 Connect & Play'}
        </button>
      </div>
    </div>
  );
};

export default SetupPage;
