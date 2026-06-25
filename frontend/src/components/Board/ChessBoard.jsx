import React, { useState, useCallback } from 'react';
import { FILES, RANKS, PIECES, getLegalMoves, rcToAlg } from '../../utils/chessEngine';

const PIECE_UNICODE = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

const ChessBoard = ({
  board,
  turn,
  playerColor,
  enPassantTarget,
  castlingRights,
  lastMove,
  checkedKing,
  onMove,
  hints,
}) => {
  const [selected, setSelected] = useState(null);
  const [legalSquares, setLegalSquares] = useState([]);
  const [promotionState, setPromotionState] = useState(null);

  const isFlipped = playerColor === 'black';

  const handleSquareClick = useCallback((row, col) => {
    const piece = board[row][col];

    // If a promotion dialog is open, ignore board clicks
    if (promotionState) return;

    if (selected) {
      const [sr, sc] = selected;
      const isLegal = legalSquares.some(([lr, lc]) => lr === row && lc === col);

      if (isLegal) {
        // Check pawn promotion
        const movingPiece = board[sr][sc];
        if (movingPiece && movingPiece[1] === 'P') {
          const promRow = movingPiece[0] === 'w' ? 0 : 7;
          if (row === promRow) {
            setPromotionState({ from: [sr, sc], to: [row, col], color: movingPiece[0] });
            setSelected(null);
            setLegalSquares([]);
            return;
          }
        }
        onMove({ from: [sr, sc], to: [row, col] });
        setSelected(null);
        setLegalSquares([]);
      } else if (piece && piece[0] === turn[0]) {
        // Select a different own piece
        setSelected([row, col]);
        setLegalSquares(getLegalMoves(board, row, col, enPassantTarget, castlingRights));
      } else {
        setSelected(null);
        setLegalSquares([]);
      }
    } else {
      if (piece && piece[0] === turn[0] && (playerColor === 'both' || piece[0] === playerColor[0])) {
        setSelected([row, col]);
        setLegalSquares(getLegalMoves(board, row, col, enPassantTarget, castlingRights));
      }
    }
  }, [board, selected, legalSquares, turn, playerColor, enPassantTarget, castlingRights, onMove, promotionState]);

  const handlePromotion = (piece) => {
    if (!promotionState) return;
    onMove({ from: promotionState.from, to: promotionState.to, promotion: piece });
    setPromotionState(null);
  };

  const renderBoard = () => {
    const cells = [];
    const rowOrder = isFlipped ? [0,1,2,3,4,5,6,7] : [0,1,2,3,4,5,6,7];
    const colOrder = isFlipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

    for (const r of rowOrder) {
      for (const c of colOrder) {
        const piece = board[r][c];
        const isLight = (r + c) % 2 === 0;
        const isSelected = selected && selected[0] === r && selected[1] === c;
        const isLegal = legalSquares.some(([lr, lc]) => lr === r && lc === c);
        const isLastFrom = lastMove && lastMove.from[0] === r && lastMove.from[1] === c;
        const isLastTo = lastMove && lastMove.to[0] === r && lastMove.to[1] === c;
        const isCheck = checkedKing && checkedKing[0] === r && checkedKing[1] === c;
        const isHint = hints && hints.some(([hr, hc]) => hr === r && hc === c);

        const sqClass = [
          'square',
          isLight ? 'sq-light' : 'sq-dark',
          isSelected ? 'sq-selected' : '',
          isLastFrom || isLastTo ? 'sq-last' : '',
          isCheck ? 'sq-check' : '',
        ].filter(Boolean).join(' ');

        cells.push(
          <div key={`${r}-${c}`} className={sqClass} onClick={() => handleSquareClick(r, c)}
            data-sq={rcToAlg(r, c)}>
            {/* Rank label on leftmost col */}
            {(isFlipped ? c === 7 : c === 0) && (
              <span className="rank-label">{RANKS[7 - r]}</span>
            )}
            {/* File label on bottom row */}
            {(isFlipped ? r === 0 : r === 7) && (
              <span className="file-label">{FILES[c]}</span>
            )}
            {isLegal && (
              <div className={`legal-dot ${piece ? 'legal-capture' : ''}`} />
            )}
            {isHint && !isLegal && (
              <div className="hint-dot" />
            )}
            {piece && (
              <span className={`piece ${piece[0] === 'w' ? 'piece-white' : 'piece-black'} ${isSelected ? 'piece-lifted' : ''}`}>
                {PIECE_UNICODE[piece]}
              </span>
            )}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="board-wrapper">
      <div className={`chess-board ${isFlipped ? 'flipped' : ''}`}>
        {renderBoard()}
      </div>

      {promotionState && (
        <div className="promotion-overlay">
          <div className="promotion-dialog">
            <p>Promote pawn to:</p>
            <div className="promotion-choices">
              {['Q', 'R', 'B', 'N'].map(p => (
                <button key={p} className="promo-btn" onClick={() => handlePromotion(p)}>
                  <span className="promo-piece">{PIECE_UNICODE[promotionState.color + p]}</span>
                  <span className="promo-name">{{ Q:'Queen', R:'Rook', B:'Bishop', N:'Knight' }[p]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessBoard;
