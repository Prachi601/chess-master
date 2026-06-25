import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const pieces = [
  { symbol: '♔', name: 'King', value: '∞', color: 'gold',
    rule: 'Moves one square in any direction. The most important piece — protect it at all costs! Supports castling with the Rook.',
    tip: 'Keep your King safe behind pawns in the opening and middlegame. Use it actively in the endgame.' },
  { symbol: '♕', name: 'Queen', value: 9, color: '#c084fc',
    rule: 'Moves any number of squares horizontally, vertically, or diagonally. The most powerful piece on the board.',
    tip: "Don't develop the Queen too early — it can be attacked and forced to retreat, wasting tempo." },
  { symbol: '♖', name: 'Rook', value: 5, color: '#60a5fa',
    rule: 'Moves any number of squares horizontally or vertically. Pairs with the King for castling.',
    tip: 'Double your Rooks on open files or the 7th rank for maximum power.' },
  { symbol: '♗', name: 'Bishop', value: 3, color: '#34d399',
    rule: 'Moves any number of squares diagonally. Each Bishop stays on its starting color.',
    tip: 'Two Bishops together are very powerful. Open the center to unleash their diagonals.' },
  { symbol: '♘', name: 'Knight', value: 3, color: '#fb923c',
    rule: 'Moves in an L-shape: 2 squares in one direction, then 1 perpendicular. The only piece that can jump over others.',
    tip: 'Knights are best in closed positions and near the center. A Knight on the 6th rank can be devastating.' },
  { symbol: '♙', name: 'Pawn', value: 1, color: '#94a3b8',
    rule: 'Moves forward one square (or two from starting position). Captures diagonally. Supports en passant and promotion.',
    tip: 'Pawn structure determines your strategy. Passed pawns in the endgame can be decisive.' },
];

const specialRules = [
  { icon: '🏰', name: 'Castling', desc: 'King moves 2 squares toward a Rook; the Rook jumps to the other side. Only allowed if neither piece has moved, no pieces between them, and the King is not in check.' },
  { icon: '⚡', name: 'En Passant', desc: 'If a pawn advances 2 squares from its starting position, an opposing pawn on the 5th rank can capture it "in passing" — as if it had only moved 1 square.' },
  { icon: '👑', name: 'Promotion', desc: 'When a pawn reaches the opposite back rank, it must be promoted to a Queen, Rook, Bishop, or Knight — your choice.' },
  { icon: '⚠', name: 'Check', desc: 'Your King is under direct attack. You must immediately resolve the check by moving the King, blocking, or capturing the attacker.' },
  { icon: '🔒', name: 'Checkmate', desc: 'The King is in check and has no legal move to escape. The game ends — the player whose King is mated loses.' },
  { icon: '🤝', name: 'Draw Conditions', desc: 'Stalemate, threefold repetition, 50-move rule, insufficient material, or agreement between players.' },
];

const openings = [
  { name: "King's Pawn Opening", moves: "1. e4 e5", icon: '♟', desc: 'The most popular opening, leading to open, tactical positions.' },
  { name: "Queen's Gambit", moves: "1. d4 d5 2. c4", icon: '♙', desc: 'White offers a pawn to gain central control. Classic and strategic.' },
  { name: 'Sicilian Defense', moves: "1. e4 c5", icon: '♟', desc: "Black's most ambitious response to e4. Asymmetrical, complex battles." },
  { name: "Ruy López", moves: "1. e4 e5 2. Nf3 Nc6 3. Bb5", icon: '♗', desc: 'Pins the knight to pressure the e5 pawn. One of the oldest openings.' },
];

const LearnPage = () => {
  const [tab, setTab] = useState('pieces');
  const [activePiece, setActivePiece] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="learn-page">
      <div className="learn-header">
        <button className="btn-back" onClick={() => navigate('/')}>← Back</button>
        <h1>♟ Learn Chess</h1>
        <p>Master the rules, understand the pieces, and discover key strategies</p>
      </div>

      <div className="learn-tabs">
        {[['pieces','Chess Pieces'],['rules','Special Rules'],['openings','Openings'],['tips','Strategy Tips']].map(([t, l]) => (
          <button key={t} className={`learn-tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      {tab === 'pieces' && (
        <div className="learn-section">
          <h2>The Pieces</h2>
          <p className="learn-intro">Click any piece to learn more about it.</p>
          <div className="pieces-grid">
            {pieces.map(p => (
              <div key={p.name} className={`piece-card ${activePiece === p.name ? 'expanded' : ''}`}
                onClick={() => setActivePiece(activePiece === p.name ? null : p.name)}
                style={{ borderColor: p.color }}>
                <div className="piece-card-top">
                  <span className="piece-display" style={{ color: p.color }}>{p.symbol}</span>
                  <div>
                    <h3>{p.name}</h3>
                    <span className="piece-value-badge" style={{ background: p.color + '33', color: p.color }}>
                      Value: {p.value}
                    </span>
                  </div>
                </div>
                {activePiece === p.name && (
                  <div className="piece-card-detail">
                    <p><strong>Movement:</strong> {p.rule}</p>
                    <div className="piece-tip">💡 <em>{p.tip}</em></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'rules' && (
        <div className="learn-section">
          <h2>Special Rules</h2>
          <div className="rules-grid">
            {specialRules.map(r => (
              <div key={r.name} className="rule-card">
                <span className="rule-icon">{r.icon}</span>
                <h3>{r.name}</h3>
                <p>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'openings' && (
        <div className="learn-section">
          <h2>Popular Openings</h2>
          <div className="openings-grid">
            {openings.map(o => (
              <div key={o.name} className="opening-card">
                <div className="opening-icon">{o.icon}</div>
                <h3>{o.name}</h3>
                <code className="opening-moves">{o.moves}</code>
                <p>{o.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'tips' && (
        <div className="learn-section">
          <h2>Key Strategy Tips</h2>
          <div className="tips-list">
            {[
              { n: '1', t: 'Control the Center', d: 'Place pawns and pieces to control the central squares (d4, d5, e4, e5). Central control gives your pieces maximum mobility.' },
              { n: '2', t: 'Develop Your Pieces', d: 'Move each piece once before moving any piece twice. Aim to have all minor pieces and rooks active before the middlegame.' },
              { n: '3', t: 'Castle Early', d: 'Castling tucks your King to safety and connects your Rooks. Aim to castle within the first 10 moves.' },
              { n: '4', t: 'Connect Your Rooks', d: 'Clear pieces from between your Rooks so they support each other along the back rank or an open file.' },
              { n: '5', t: 'Think Before You Move', d: "Ask: What does my opponent's last move threaten? What will my move accomplish? Are there any tactics I'm missing?" },
              { n: '6', t: 'Trade Wisely', d: 'Only trade pieces if you gain material, improve position, or remove a dangerous attacker. Avoid trading your active pieces for passive ones.' },
            ].map(tip => (
              <div key={tip.n} className="tip-card">
                <span className="tip-number">{tip.n}</span>
                <div>
                  <h3>{tip.t}</h3>
                  <p>{tip.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="learn-cta">
        <button className="btn-primary large" onClick={() => navigate('/setup?mode=vs_computer')}>
          ⚔ Practice vs Computer
        </button>
      </div>
    </div>
  );
};

export default LearnPage;
