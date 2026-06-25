// Full Chess Engine - Legal moves, check, checkmate, castling, en passant, promotion

export const FILES = ['a','b','c','d','e','f','g','h'];
export const RANKS = ['1','2','3','4','5','6','7','8'];

export const PIECES = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

export const initialBoard = () => {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  // Black pieces
  board[0] = ['bR','bN','bB','bQ','bK','bB','bN','bR'];
  board[1] = Array(8).fill('bP');
  // White pieces
  board[6] = Array(8).fill('wP');
  board[7] = ['wR','wN','wB','wQ','wK','wB','wN','wR'];
  return board;
};

export const colorOf = (piece) => piece ? piece[0] : null;
export const typeOf = (piece) => piece ? piece[1] : null;
export const isWhite = (piece) => colorOf(piece) === 'w';
export const isBlack = (piece) => colorOf(piece) === 'b';
export const enemy = (color) => color === 'w' ? 'b' : 'w';

// Convert algebraic to row/col
export const algToRC = (alg) => {
  const file = FILES.indexOf(alg[0]);
  const rank = parseInt(alg[1]) - 1;
  return [7 - rank, file];
};

export const rcToAlg = (row, col) => FILES[col] + RANKS[7 - row];

// Get all pseudo-legal moves for a piece (before check filtering)
export const getPseudoMoves = (board, row, col, enPassantTarget, castlingRights) => {
  const piece = board[row][col];
  if (!piece) return [];
  const color = colorOf(piece);
  const type = typeOf(piece);
  const moves = [];

  const addIfValid = (r, c) => {
    if (r < 0 || r > 7 || c < 0 || c > 7) return false;
    const target = board[r][c];
    if (target && colorOf(target) === color) return false;
    moves.push([r, c]);
    return !target; // can continue sliding if empty
  };

  const slide = (dirs) => {
    for (const [dr, dc] of dirs) {
      let r = row + dr, c = col + dc;
      while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
        const target = board[r][c];
        if (target) {
          if (colorOf(target) !== color) moves.push([r, c]);
          break;
        }
        moves.push([r, c]);
        r += dr; c += dc;
      }
    }
  };

  switch (type) {
    case 'P': {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      // Forward
      if (row + dir >= 0 && row + dir <= 7 && !board[row + dir][col]) {
        moves.push([row + dir, col]);
        if (row === startRow && !board[row + 2 * dir][col]) {
          moves.push([row + 2 * dir, col]);
        }
      }
      // Captures
      for (const dc of [-1, 1]) {
        const r = row + dir, c = col + dc;
        if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
          if (board[r][c] && colorOf(board[r][c]) !== color) moves.push([r, c]);
          // En passant
          if (enPassantTarget) {
            const [epR, epC] = algToRC(enPassantTarget);
            if (r === epR && c === epC) moves.push([r, c]);
          }
        }
      }
      break;
    }
    case 'N':
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])
        addIfValid(row + dr, col + dc);
      break;
    case 'B':
      slide([[-1,-1],[-1,1],[1,-1],[1,1]]);
      break;
    case 'R':
      slide([[-1,0],[1,0],[0,-1],[0,1]]);
      break;
    case 'Q':
      slide([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
      break;
    case 'K': {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]])
        addIfValid(row + dr, col + dc);
      // Castling
      if (castlingRights) {
        const kingRow = color === 'w' ? 7 : 0;
        if (row === kingRow && col === 4) {
          if (castlingRights[color === 'w' ? 'K' : 'k'] &&
              !board[kingRow][5] && !board[kingRow][6] &&
              board[kingRow][7] === color + 'R')
            moves.push([kingRow, 6]);
          if (castlingRights[color === 'w' ? 'Q' : 'q'] &&
              !board[kingRow][3] && !board[kingRow][2] && !board[kingRow][1] &&
              board[kingRow][0] === color + 'R')
            moves.push([kingRow, 2]);
        }
      }
      break;
    }
  }
  return moves;
};

// Apply move to board (returns new board + meta)
export const applyMove = (board, from, to, promotion = null, enPassantTarget = null, castlingRights = null) => {
  const newBoard = board.map(r => [...r]);
  const [fr, fc] = from;
  const [tr, tc] = to;
  const piece = newBoard[fr][fc];
  const color = colorOf(piece);
  const type = typeOf(piece);
  let captured = newBoard[tr][tc];
  let newEP = null;
  let newCR = castlingRights ? { ...castlingRights } : { K: true, Q: true, k: true, q: true };

  // En passant capture
  if (type === 'P' && enPassantTarget) {
    const [epR, epC] = algToRC(enPassantTarget);
    if (tr === epR && tc === epC) {
      const captureRow = color === 'w' ? epR + 1 : epR - 1;
      captured = newBoard[captureRow][epC];
      newBoard[captureRow][epC] = null;
    }
  }

  // Set en passant target
  if (type === 'P' && Math.abs(tr - fr) === 2) {
    newEP = rcToAlg((fr + tr) / 2, fc);
  }

  // Castling
  if (type === 'K') {
    if (tc - fc === 2) { // Kingside
      newBoard[tr][5] = newBoard[tr][7];
      newBoard[tr][7] = null;
    } else if (fc - tc === 2) { // Queenside
      newBoard[tr][3] = newBoard[tr][0];
      newBoard[tr][0] = null;
    }
    if (color === 'w') { newCR.K = false; newCR.Q = false; }
    else { newCR.k = false; newCR.q = false; }
  }

  // Rook moves invalidate castling
  if (type === 'R') {
    if (fr === 7 && fc === 7) newCR.K = false;
    if (fr === 7 && fc === 0) newCR.Q = false;
    if (fr === 0 && fc === 7) newCR.k = false;
    if (fr === 0 && fc === 0) newCR.q = false;
  }

  // Move piece
  newBoard[fr][fc] = null;
  newBoard[tr][tc] = promotion ? color + promotion : piece;

  return { board: newBoard, captured, enPassantTarget: newEP, castlingRights: newCR };
};

// Find king position
export const findKing = (board, color) => {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c] === color + 'K') return [r, c];
  return null;
};

// Is the given color's king in check?
export const isInCheck = (board, color) => {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const opp = enemy(color);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (colorOf(board[r][c]) === opp) {
        const attacks = getPseudoMoves(board, r, c, null, null);
        if (attacks.some(([ar, ac]) => ar === kingPos[0] && ac === kingPos[1]))
          return true;
      }
    }
  }
  return false;
};

// Get legal moves (filtered for check)
export const getLegalMoves = (board, row, col, enPassantTarget, castlingRights) => {
  const piece = board[row][col];
  if (!piece) return [];
  const color = colorOf(piece);
  const pseudo = getPseudoMoves(board, row, col, enPassantTarget, castlingRights);
  const legal = [];

  for (const [tr, tc] of pseudo) {
    const type = typeOf(piece);

    // Castling check: cannot castle through/into check
    if (type === 'K' && Math.abs(tc - col) === 2) {
      const dir = tc > col ? 1 : -1;
      let throughCheck = false;
      for (let c = col; c !== tc + dir; c += dir) {
        const { board: tmp } = applyMove(board, [row, col], [row, c], null, enPassantTarget, castlingRights);
        if (isInCheck(tmp, color)) { throughCheck = true; break; }
      }
      if (throughCheck) continue;
    }

    const { board: newBoard } = applyMove(board, [row, col], [tr, tc], null, enPassantTarget, castlingRights);
    if (!isInCheck(newBoard, color)) legal.push([tr, tc]);
  }
  return legal;
};

// Check if the current player has any legal moves
export const hasAnyLegalMoves = (board, color, enPassantTarget, castlingRights) => {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (colorOf(board[r][c]) === color)
        if (getLegalMoves(board, r, c, enPassantTarget, castlingRights).length > 0)
          return true;
  return false;
};

// Game status after a move
export const getGameStatus = (board, currentTurn, enPassantTarget, castlingRights) => {
  const inCheck = isInCheck(board, currentTurn);
  const hasLegal = hasAnyLegalMoves(board, currentTurn, enPassantTarget, castlingRights);

  if (inCheck && !hasLegal) return 'checkmate';
  if (!inCheck && !hasLegal) return 'stalemate';
  if (inCheck) return 'check';
  return 'playing';
};

// Move to SAN notation (simplified)
export const toSAN = (board, from, to, piece, captured, isCheck, isCheckmate, promotion, castled) => {
  const [fr, fc] = from;
  const [tr, tc] = to;
  const type = typeOf(piece);
  const toAlg = rcToAlg(tr, tc);

  if (castled === 'K') return isCheckmate ? 'O-O#' : isCheck ? 'O-O+' : 'O-O';
  if (castled === 'Q') return isCheckmate ? 'O-O-O#' : isCheck ? 'O-O-O+' : 'O-O-O';

  let san = '';
  if (type === 'P') {
    if (captured) san = FILES[fc] + 'x' + toAlg;
    else san = toAlg;
    if (promotion) san += '=' + promotion;
  } else {
    san = type + (captured ? 'x' : '') + toAlg;
  }
  if (isCheckmate) san += '#';
  else if (isCheck) san += '+';
  return san;
};

// Simple AI - minimax with alpha-beta (depth 3)
const pieceValues = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 1000 };

const evalBoard = (board) => {
  let score = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const val = pieceValues[typeOf(p)] || 0;
      score += colorOf(p) === 'w' ? val : -val;
    }
  return score;
};

const getAllMoves = (board, color, ep, cr) => {
  const moves = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (colorOf(board[r][c]) === color) {
        const legal = getLegalMoves(board, r, c, ep, cr);
        for (const [tr, tc] of legal)
          moves.push({ from: [r, c], to: [tr, tc] });
      }
  return moves;
};

const minimax = (board, depth, alpha, beta, maximizing, ep, cr) => {
  if (depth === 0) return evalBoard(board);
  const color = maximizing ? 'w' : 'b';
  const moves = getAllMoves(board, color, ep, cr);
  if (moves.length === 0) return maximizing ? -9999 : 9999;

  if (maximizing) {
    let best = -Infinity;
    for (const { from, to } of moves) {
      const { board: nb, enPassantTarget: nep, castlingRights: ncr } = applyMove(board, from, to, null, ep, cr);
      best = Math.max(best, minimax(nb, depth - 1, alpha, beta, false, nep, ncr));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const { from, to } of moves) {
      const { board: nb, enPassantTarget: nep, castlingRights: ncr } = applyMove(board, from, to, null, ep, cr);
      best = Math.min(best, minimax(nb, depth - 1, alpha, beta, true, nep, ncr));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
};

export const getBestMove = (board, color, ep, cr, depth = 3) => {
  const moves = getAllMoves(board, color, ep, cr);
  if (moves.length === 0) return null;

  let bestMove = null;
  let bestVal = color === 'b' ? Infinity : -Infinity;

  for (const move of moves) {
    const { board: nb, enPassantTarget: nep, castlingRights: ncr } = applyMove(board, move.from, move.to, null, ep, cr);
    const val = minimax(nb, depth - 1, -Infinity, Infinity, color === 'w', nep, ncr);
    if (color === 'b' ? val < bestVal : val > bestVal) {
      bestVal = val;
      bestMove = move;
    }
  }
  return bestMove;
};
