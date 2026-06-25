// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
// import ChessBoard from '../Board/ChessBoard';
// import {
//   initialBoard, applyMove, getGameStatus, findKing,
//   getBestMove, getLegalMoves, colorOf, rcToAlg, toSAN, isInCheck
// } from '../../utils/chessEngine';
// import api from '../../utils/api';
// import { io } from 'socket.io-client';

// const GamePage = () => {
//   const { id: gameId } = useParams();
//   const [sp] = useSearchParams();
//   const mode = sp.get('mode') || 'vs_computer';
//   const initColor = sp.get('color') || 'white';
//   const aiDepth = parseInt(sp.get('ai') || '3');
//   const navigate = useNavigate();
//   const { user } = useAuth();

//   const [board, setBoard] = useState(initialBoard());
//   const [turn, setTurn] = useState('w');
//   const [playerColor] = useState(() => {
//     if (mode === 'local') return 'both';
//     if (initColor === 'random') return Math.random() > 0.5 ? 'white' : 'black';
//     return initColor;
//   });
//   const [enPassantTarget, setEnPassantTarget] = useState(null);
//   const [castlingRights, setCastlingRights] = useState({ K: true, Q: true, k: true, q: true });
//   const [status, setStatus] = useState('playing');
//   const [moveHistory, setMoveHistory] = useState([]);
//   const [lastMove, setLastMove] = useState(null);
//   const [checkedKing, setCheckedKing] = useState(null);
//   const [historyIndex, setHistoryIndex] = useState(-1);
//   const [boardStates, setBoardStates] = useState([]);
//   const [capturedWhite, setCapturedWhite] = useState([]);
//   const [capturedBlack, setCapturedBlack] = useState([]);
//   const [isThinking, setIsThinking] = useState(false);
//   const [gameOver, setGameOver] = useState(null);
//   const [hintSquares, setHintSquares] = useState(null);
//   const [hintUsed, setHintUsed] = useState(false);
//   const [drawOffer, setDrawOffer] = useState(false);
//   const [onlinePlayers, setOnlinePlayers] = useState({});
//   const [chat, setChat] = useState([]);
//   const [chatMsg, setChatMsg] = useState('');
//   const socketRef = useRef(null);
//   const moveListRef = useRef(null);

//   // Socket.IO for online mode
//   useEffect(() => {
//     if (mode === 'online') {
//       const socket = io({ auth: { token: localStorage.getItem('chess_token') } });
//       socketRef.current = socket;

//       const joinMode = sp.get('join') || 'quick';
//       const roomId = sp.get('roomId') || '';

//       if (joinMode === 'quick') socket.emit('find_match');
//       else if (joinMode === 'create') socket.emit('create_room', { roomId: gameId });
//       else socket.emit('join_room', { roomId });

//       socket.on('match_found', ({ white, black }) => setOnlinePlayers({ white, black }));
//       socket.on('game_start', ({ white, black }) => setOnlinePlayers({ white, black }));
//       socket.on('waiting_for_opponent', () => setStatus('waiting'));

//       socket.on('opponent_move', ({ move, fen }) => {
//         handleMove(move, false);
//       });

//       socket.on('draw_offered', () => setDrawOffer(true));
//       socket.on('draw_declined', () => alert('Opponent declined the draw offer.'));
//       socket.on('game_over', ({ result, reason }) => handleGameOver(result, reason));
//       socket.on('chat_message', (msg) => setChat(prev => [...prev, msg]));
//       socket.on('opponent_disconnected', () => {
//         setGameOver({ result: playerColor === 'white' ? 'white_wins' : 'black_wins', reason: 'opponent disconnected' });
//       });

//       return () => socket.disconnect();
//     }
//   }, [mode]);

//   const saveMove = useCallback(async (moveData) => {
//     try {
//       await api.post(`/games/${gameId}/moves`, moveData);
//     } catch (e) { /* silent fail */ }
//   }, [gameId]);

//   const handleGameOver = useCallback(async (result, reason) => {
//     setGameOver({ result, reason });
//     setStatus('over');
//     try {
//       await api.patch(`/games/${gameId}/result`, { result, result_reason: reason });
//     } catch (e) {}
//   }, [gameId]);

//   const handleMove = useCallback(async ({ from, to, promotion = null }, isOwnMove = true) => {
//     if (status !== 'playing') return;
//     if (gameOver) return;

//     const movingPiece = board[from[0]][from[1]];
//     if (!movingPiece) return;

//     const { board: newBoard, captured, enPassantTarget: newEP, castlingRights: newCR } =
//       applyMove(board, from, to, promotion, enPassantTarget, castlingRights);

//     const nextTurn = turn === 'w' ? 'b' : 'w';
//     const gameStatus = getGameStatus(newBoard, nextTurn, newEP, newCR);
//     const inCheck = isInCheck(newBoard, nextTurn);
//     const isCheckmate = gameStatus === 'checkmate';
//     const isCastle = movingPiece[1] === 'K' && Math.abs(to[1] - from[1]) === 2
//       ? (to[1] > from[1] ? 'K' : 'Q') : null;

//     const san = toSAN(board, from, to, movingPiece, captured, inCheck, isCheckmate, promotion, isCastle);

//     const moveRecord = {
//       from, to, piece: movingPiece, san, captured,
//       is_check: inCheck, is_checkmate: isCheckmate,
//       is_castle: isCastle, is_promotion: promotion,
//       fen_after: '',
//     };

//     // Save board state for history navigation
//     setBoardStates(prev => [...prev, { board: newBoard, turn: nextTurn, ep: newEP, cr: newCR }]);
//     setBoard(newBoard);
//     setTurn(nextTurn);
//     setEnPassantTarget(newEP);
//     setCastlingRights(newCR);
//     setLastMove({ from, to });
//     setHintSquares(null);
//     setHintUsed(false);
//     setHistoryIndex(-1);

//     if (captured) {
//       if (colorOf(captured) === 'w') setCapturedWhite(p => [...p, captured]);
//       else setCapturedBlack(p => [...p, captured]);
//     }

//     if (inCheck) {
//       const kingPos = findKing(newBoard, nextTurn);
//       setCheckedKing(kingPos);
//     } else {
//       setCheckedKing(null);
//     }

//     const newHistory = [...moveHistory, { ...moveRecord, number: moveHistory.length + 1 }];
//     setMoveHistory(newHistory);

//     // Save to DB
//     await saveMove({
//       move_number: newHistory.length,
//       player_color: turn === 'w' ? 'white' : 'black',
//       from_square: rcToAlg(from[0], from[1]),
//       to_square: rcToAlg(to[0], to[1]),
//       piece: movingPiece,
//       san,
//       fen_after: 'fen',
//       captured: captured || null,
//       is_check: inCheck,
//       is_checkmate: isCheckmate,
//       is_castle: isCastle,
//       is_promotion: promotion,
//     });

//     if (mode === 'online' && isOwnMove && socketRef.current) {
//       socketRef.current.emit('make_move', { roomId: gameId, move: { from, to, promotion }, fen: '' });
//     }

//     // Game over checks
//     if (isCheckmate) {
//       const result = turn === 'w' ? 'white_wins' : 'black_wins';
//       await handleGameOver(result, 'checkmate');
//     } else if (gameStatus === 'stalemate') {
//       await handleGameOver('draw', 'stalemate');
//     }

//     // AI move
//     if (mode === 'vs_computer' && !isCheckmate && gameStatus !== 'stalemate') {
//       const aiColor = playerColor === 'white' ? 'b' : 'w';
//       if (nextTurn === aiColor) {
//         setIsThinking(true);
//         setTimeout(() => {
//           const best = getBestMove(newBoard, aiColor, newEP, newCR, aiDepth);
//           if (best) handleMove({ from: best.from, to: best.to }, true);
//           setIsThinking(false);
//         }, 300);
//       }
//     }
//   }, [board, turn, enPassantTarget, castlingRights, moveHistory, mode, playerColor, aiDepth, status, gameOver, saveMove, handleGameOver, gameId]);

//   const getHint = () => {
//     if (hintUsed) return;
//     const color = turn;
//     const best = getBestMove(board, color, enPassantTarget, castlingRights, 2);
//     if (best) {
//       const legal = getLegalMoves(board, best.from[0], best.from[1], enPassantTarget, castlingRights);
//       setHintSquares(legal.slice(0, 3));
//       setHintUsed(true);
//     }
//   };

//   const sendChat = () => {
//     if (!chatMsg.trim() || !socketRef.current) return;
//     socketRef.current.emit('chat_message', { roomId: gameId, message: chatMsg });
//     setChatMsg('');
//   };

//   const pieceCounts = (pieces) => {
//     const c = {};
//     pieces.forEach(p => { c[p] = (c[p] || 0) + 1; });
//     return c;
//   };

//   const PIECE_UNICODE = {
//     wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',
//     bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟',
//   };

//   const renderCaptured = (pieces) => {
//     const counts = pieceCounts(pieces);
//     return Object.entries(counts).map(([p, n]) => (
//       <span key={p} className="captured-piece">{PIECE_UNICODE[p]}{n > 1 ? <sup>{n}</sup> : ''}</span>
//     ));
//   };

//   return (
//     <div className="game-page">
//       <div className="game-topbar">
//         <button className="btn-back" onClick={() => navigate('/')}>← Home</button>
//         <span className="game-mode-label">
//           {mode === 'vs_computer' ? `🤖 AI (Depth ${aiDepth})` : mode === 'local' ? '👥 Local' : '🌐 Online'}
//         </span>
//         {status === 'waiting' && <span className="waiting-badge">⏳ Waiting for opponent...</span>}
//       </div>

//       <div className="game-layout">
//         {/* Left: Board */}
//         <div className="board-column">
//           {/* Black player info */}
//           <div className="player-bar top">
//             <span className="player-avatar">♚</span>
//             <span className="player-name">
//               {mode === 'vs_computer' && playerColor === 'white' ? '🤖 Computer' :
//                mode === 'online' ? (onlinePlayers.black?.username || 'Opponent') :
//                mode === 'local' ? 'Black' : user?.username}
//             </span>
//             <div className="captured-pieces">{renderCaptured(capturedBlack)}</div>
//             {isThinking && turn === 'b' && <span className="thinking-dot">thinking...</span>}
//           </div>

//           <ChessBoard
//             board={board}
//             turn={turn}
//             playerColor={mode === 'local' ? 'both' : playerColor}
//             enPassantTarget={enPassantTarget}
//             castlingRights={castlingRights}
//             lastMove={lastMove}
//             checkedKing={checkedKing}
//             onMove={handleMove}
//             hints={hintSquares}
//           />

//           {/* White player info */}
//           <div className="player-bar bottom">
//             <span className="player-avatar">♔</span>
//             <span className="player-name">
//               {mode === 'vs_computer' && playerColor === 'black' ? '🤖 Computer' :
//                mode === 'online' ? (onlinePlayers.white?.username || user?.username) :
//                mode === 'local' ? 'White' : user?.username}
//             </span>
//             <div className="captured-pieces">{renderCaptured(capturedWhite)}</div>
//           </div>
//         </div>

//         {/* Right: Controls */}
//         <div className="game-sidebar">
//           {/* Turn indicator */}
//           <div className={`turn-indicator ${turn === 'w' ? 'white-turn' : 'black-turn'}`}>
//             {gameOver ? (
//               <span>Game Over</span>
//             ) : (
//               <span>{turn === 'w' ? '♔ White' : '♚ Black'} to move {isThinking ? '...' : ''}</span>
//             )}
//           </div>

//           {/* Status */}
//           {status === 'check' && !gameOver && (
//             <div className="status-banner check">⚠ Check!</div>
//           )}

//           {/* Game over overlay */}
//           {gameOver && (
//             <div className="gameover-card">
//               <div className="gameover-icon">
//                 {gameOver.result === 'draw' ? '🤝' : gameOver.result === 'white_wins' ? '♔' : '♚'}
//               </div>
//               <h3>{gameOver.result === 'draw' ? 'Draw!' :
//                    gameOver.result === 'white_wins' ? 'White Wins!' : 'Black Wins!'}</h3>
//               <p>{gameOver.reason}</p>
//               <div className="gameover-actions">
//                 <button className="btn-primary" onClick={() => navigate('/setup?mode=' + mode)}>New Game</button>
//                 <button className="btn-ghost" onClick={() => navigate('/')}>Home</button>
//               </div>
//             </div>
//           )}

//           {/* Move history */}
//           <div className="move-history" ref={moveListRef}>
//             <h4>Move History</h4>
//             <div className="moves-list">
//               {moveHistory.reduce((acc, mv, i) => {
//                 if (i % 2 === 0) {
//                   acc.push(
//                     <div key={i} className="move-pair">
//                       <span className="move-num">{Math.floor(i/2)+1}.</span>
//                       <span className="move-san white-move">{mv.san}</span>
//                       {moveHistory[i+1] && (
//                         <span className="move-san black-move">{moveHistory[i+1].san}</span>
//                       )}
//                     </div>
//                   );
//                 }
//                 return acc;
//               }, [])}
//             </div>
//           </div>

//           {/* Controls */}
//           {!gameOver && (
//             <div className="game-controls">
//               {mode !== 'online' && (
//                 <button className="ctrl-btn" onClick={getHint} disabled={hintUsed || isThinking}>
//                   💡 Hint {hintUsed ? '(used)' : ''}
//                 </button>
//               )}
//               {mode === 'online' && (
//                 <>
//                   <button className="ctrl-btn" onClick={() => socketRef.current?.emit('offer_draw', { roomId: gameId })}>
//                     🤝 Offer Draw
//                   </button>
//                   <button className="ctrl-btn danger" onClick={() => {
//                     if (confirm('Resign this game?')) socketRef.current?.emit('resign', { roomId: gameId });
//                   }}>🏳 Resign</button>
//                 </>
//               )}
//               {mode !== 'online' && (
//                 <button className="ctrl-btn danger" onClick={() => {
//                   if (confirm('Abandon this game?')) navigate('/');
//                 }}>🏳 Abandon</button>
//               )}
//             </div>
//           )}

//           {/* Draw offer */}
//           {drawOffer && (
//             <div className="draw-offer-banner">
//               <p>Opponent offers a draw</p>
//               <button className="btn-primary small" onClick={() => {
//                 socketRef.current?.emit('accept_draw', { roomId: gameId });
//                 setDrawOffer(false);
//               }}>Accept</button>
//               <button className="btn-ghost small" onClick={() => {
//                 socketRef.current?.emit('decline_draw', { roomId: gameId });
//                 setDrawOffer(false);
//               }}>Decline</button>
//             </div>
//           )}

//           {/* Online chat */}
//           {mode === 'online' && (
//             <div className="chat-box">
//               <h4>Chat</h4>
//               <div className="chat-messages">
//                 {chat.map((m, i) => (
//                   <div key={i} className="chat-msg">
//                     <strong>{m.username}:</strong> {m.message}
//                   </div>
//                 ))}
//               </div>
//               <div className="chat-input-row">
//                 <input type="text" value={chatMsg} onChange={e => setChatMsg(e.target.value)}
//                   onKeyDown={e => e.key === 'Enter' && sendChat()}
//                   placeholder="Say something..." />
//                 <button onClick={sendChat}>Send</button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default GamePage;

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ChessBoard from "../Board/ChessBoard";
import {
  initialBoard,
  applyMove,
  getGameStatus,
  findKing,
  getBestMove,
  getLegalMoves,
  colorOf,
  rcToAlg,
  toSAN,
  isInCheck,
} from "../../utils/chessEngine";
import api from "../../utils/api";
import { io } from "socket.io-client";

const GamePage = () => {
  const { id: gameId } = useParams();
  const [sp] = useSearchParams();
  const mode = sp.get("mode") || "vs_computer";
  const initColor = sp.get("color") || "white";
  const aiDepth = parseInt(sp.get("ai") || "3");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [board, setBoard] = useState(initialBoard());
  const [turn, setTurn] = useState("w");
  const [playerColor] = useState(() => {
    if (mode === "local") return "both";
    if (initColor === "random") return Math.random() > 0.5 ? "white" : "black";
    return initColor;
  });
  const [enPassantTarget, setEnPassantTarget] = useState(null);
  const [castlingRights, setCastlingRights] = useState({
    K: true,
    Q: true,
    k: true,
    q: true,
  });
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [checkedKing, setCheckedKing] = useState(null);
  const [capturedWhite, setCapturedWhite] = useState([]);
  const [capturedBlack, setCapturedBlack] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [gameOver, setGameOver] = useState(null);
  const [hintSquares, setHintSquares] = useState(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [drawOffer, setDrawOffer] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState({});
  const [chat, setChat] = useState([]);
  const [chatMsg, setChatMsg] = useState("");
  const [status, setStatus] = useState("playing");

  const socketRef = useRef(null);

  // Refs to always have latest values inside async callbacks
  const boardRef = useRef(board);
  const turnRef = useRef(turn);
  const epRef = useRef(enPassantTarget);
  const crRef = useRef(castlingRights);
  const gameOverRef = useRef(gameOver);
  const moveHistoryRef = useRef(moveHistory);

  boardRef.current = board;
  turnRef.current = turn;
  epRef.current = enPassantTarget;
  crRef.current = castlingRights;
  gameOverRef.current = gameOver;
  moveHistoryRef.current = moveHistory;

  // Socket.IO for online mode
  useEffect(() => {
    if (mode === "online") {
      const socket = io({
        auth: { token: localStorage.getItem("chess_token") },
      });
      socketRef.current = socket;
      const joinMode = sp.get("join") || "quick";
      const roomId = sp.get("roomId") || "";
      if (joinMode === "quick") socket.emit("find_match");
      else if (joinMode === "create")
        socket.emit("create_room", { roomId: gameId });
      else socket.emit("join_room", { roomId });
      socket.on("match_found", ({ white, black }) =>
        setOnlinePlayers({ white, black }),
      );
      socket.on("game_start", ({ white, black }) =>
        setOnlinePlayers({ white, black }),
      );
      socket.on("waiting_for_opponent", () => setStatus("waiting"));
      socket.on("opponent_move", ({ move }) => {
        executeMove(
          move,
          false,
          boardRef.current,
          turnRef.current,
          epRef.current,
          crRef.current,
          moveHistoryRef.current,
        );
      });
      socket.on("draw_offered", () => setDrawOffer(true));
      socket.on("draw_declined", () =>
        alert("Opponent declined the draw offer."),
      );
      socket.on("game_over", ({ result, reason }) => endGame(result, reason));
      socket.on("chat_message", (msg) => setChat((prev) => [...prev, msg]));
      socket.on("opponent_disconnected", () => {
        endGame(
          playerColor === "white" ? "white_wins" : "black_wins",
          "opponent disconnected",
        );
      });
      return () => socket.disconnect();
    }
  }, [mode]);

  const endGame = useCallback(
    async (result, reason) => {
      setGameOver({ result, reason });
      try {
        await api.patch(`/games/${gameId}/result`, {
          result,
          result_reason: reason,
        });
      } catch (e) {}
    },
    [gameId],
  );

  const executeMove = useCallback(
    async (
      { from, to, promotion = null },
      isOwnMove = true,
      brd,
      trn,
      ep,
      cr,
      hist,
    ) => {
      if (gameOverRef.current) return null;
      const movingPiece = brd[from[0]][from[1]];
      if (!movingPiece) return null;

      const {
        board: newBoard,
        captured,
        enPassantTarget: newEP,
        castlingRights: newCR,
      } = applyMove(brd, from, to, promotion, ep, cr);

      const nextTurn = trn === "w" ? "b" : "w";
      const gameStatus = getGameStatus(newBoard, nextTurn, newEP, newCR);
      const inCheck = isInCheck(newBoard, nextTurn);
      const isCheckmate = gameStatus === "checkmate";
      const isCastle =
        movingPiece[1] === "K" && Math.abs(to[1] - from[1]) === 2
          ? to[1] > from[1]
            ? "K"
            : "Q"
          : null;
      const san = toSAN(
        brd,
        from,
        to,
        movingPiece,
        captured,
        inCheck,
        isCheckmate,
        promotion,
        isCastle,
      );

      setBoard(newBoard);
      setTurn(nextTurn);
      setEnPassantTarget(newEP);
      setCastlingRights(newCR);
      setLastMove({ from, to });
      setHintSquares(null);
      setHintUsed(false);

      if (captured) {
        if (colorOf(captured) === "w")
          setCapturedWhite((p) => [...p, captured]);
        else setCapturedBlack((p) => [...p, captured]);
      }

      setCheckedKing(inCheck ? findKing(newBoard, nextTurn) : null);

      const newHistory = [
        ...hist,
        { from, to, piece: movingPiece, san, number: hist.length + 1 },
      ];
      setMoveHistory(newHistory);

      try {
        await api.post(`/games/${gameId}/moves`, {
          move_number: newHistory.length,
          player_color: trn === "w" ? "white" : "black",
          from_square: rcToAlg(from[0], from[1]),
          to_square: rcToAlg(to[0], to[1]),
          piece: movingPiece,
          san,
          fen_after: "fen",
          captured: captured || null,
          is_check: inCheck,
          is_checkmate: isCheckmate,
          is_castle: isCastle,
          is_promotion: promotion,
        });
      } catch (e) {}

      if (mode === "online" && isOwnMove && socketRef.current) {
        socketRef.current.emit("make_move", {
          roomId: gameId,
          move: { from, to, promotion },
          fen: "",
        });
      }

      if (isCheckmate) {
        endGame(trn === "w" ? "white_wins" : "black_wins", "checkmate");
        return null;
      }
      if (gameStatus === "stalemate") {
        endGame("draw", "stalemate");
        return null;
      }

      return { newBoard, nextTurn, newEP, newCR, newHistory };
    },
    [gameId, mode, endGame],
  );

  // AI move — triggered ONLY when turn changes to AI's color
  useEffect(() => {
    if (mode !== "vs_computer") return;
    if (gameOverRef.current) return;

    const aiColor = playerColor === "white" ? "b" : "w";
    if (turn !== aiColor) return;

    setIsThinking(true);

    const timer = setTimeout(() => {
      const currentBoard = boardRef.current;
      const currentEP = epRef.current;
      const currentCR = crRef.current;
      const currentHistory = moveHistoryRef.current;

      const best = getBestMove(
        currentBoard,
        aiColor,
        currentEP,
        currentCR,
        aiDepth,
      );
      if (best) {
        executeMove(
          { from: best.from, to: best.to },
          true,
          currentBoard,
          aiColor,
          currentEP,
          currentCR,
          currentHistory,
        );
      }
      setIsThinking(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [turn]); // ONLY depend on turn — this is the key fix

  // Human move handler
  const handleMove = useCallback(
    (moveData) => {
      if (gameOver) return;
      if (isThinking) return;
      const aiColor = playerColor === "white" ? "b" : "w";
      if (mode === "vs_computer" && turn === aiColor) return;

      executeMove(
        moveData,
        true,
        boardRef.current,
        turnRef.current,
        epRef.current,
        crRef.current,
        moveHistoryRef.current,
      );
    },
    [gameOver, isThinking, playerColor, mode, turn, executeMove],
  );

  const getHint = () => {
    if (hintUsed || isThinking) return;
    const best = getBestMove(board, turn, enPassantTarget, castlingRights, 2);
    if (best) {
      const legal = getLegalMoves(
        board,
        best.from[0],
        best.from[1],
        enPassantTarget,
        castlingRights,
      );
      setHintSquares(legal.slice(0, 3));
      setHintUsed(true);
    }
  };

  const sendChat = () => {
    if (!chatMsg.trim() || !socketRef.current) return;
    socketRef.current.emit("chat_message", {
      roomId: gameId,
      message: chatMsg,
    });
    setChatMsg("");
  };

  const PIECE_UNICODE = {
    wK: "♔",
    wQ: "♕",
    wR: "♖",
    wB: "♗",
    wN: "♘",
    wP: "♙",
    bK: "♚",
    bQ: "♛",
    bR: "♜",
    bB: "♝",
    bN: "♞",
    bP: "♟",
  };

  const renderCaptured = (pieces) => {
    const c = {};
    pieces.forEach((p) => {
      c[p] = (c[p] || 0) + 1;
    });
    return Object.entries(c).map(([p, n]) => (
      <span key={p} className="captured-piece">
        {PIECE_UNICODE[p]}
        {n > 1 ? <sup>{n}</sup> : ""}
      </span>
    ));
  };

  return (
    <div className="game-page">
      <div className="game-topbar">
        <button className="btn-back" onClick={() => navigate("/")}>
          ← Home
        </button>
        <span className="game-mode-label">
          {mode === "vs_computer"
            ? `🤖 AI (Depth ${aiDepth})`
            : mode === "local"
              ? "👥 Local"
              : "🌐 Online"}
        </span>
        {status === "waiting" && (
          <span className="waiting-badge">⏳ Waiting for opponent...</span>
        )}
      </div>

      <div className="game-layout">
        <div className="board-column">
          <div className="player-bar top">
            <span className="player-avatar">♚</span>
            <span className="player-name">
              {mode === "vs_computer" && playerColor === "white"
                ? "🤖 Computer"
                : mode === "online"
                  ? onlinePlayers.black?.username || "Opponent"
                  : mode === "local"
                    ? "Black"
                    : user?.username}
            </span>
            <div className="captured-pieces">
              {renderCaptured(capturedBlack)}
            </div>
            {isThinking && <span className="thinking-dot">thinking...</span>}
          </div>

          <ChessBoard
            board={board}
            turn={turn}
            playerColor={mode === "local" ? "both" : playerColor}
            enPassantTarget={enPassantTarget}
            castlingRights={castlingRights}
            lastMove={lastMove}
            checkedKing={checkedKing}
            onMove={handleMove}
            hints={hintSquares}
          />

          <div className="player-bar bottom">
            <span className="player-avatar">♔</span>
            <span className="player-name">
              {mode === "vs_computer" && playerColor === "black"
                ? "🤖 Computer"
                : mode === "online"
                  ? onlinePlayers.white?.username || user?.username
                  : mode === "local"
                    ? "White"
                    : user?.username}
            </span>
            <div className="captured-pieces">
              {renderCaptured(capturedWhite)}
            </div>
          </div>
        </div>

        <div className="game-sidebar">
          <div
            className={`turn-indicator ${turn === "w" ? "white-turn" : "black-turn"}`}>
            {gameOver ? (
              <span>Game Over</span>
            ) : isThinking ? (
              <span>🤖 Computer thinking...</span>
            ) : (
              <span>{turn === "w" ? "♔ White" : "♚ Black"} to move</span>
            )}
          </div>

          {gameOver && (
            <div className="gameover-card">
              <div className="gameover-icon">
                {gameOver.result === "draw"
                  ? "🤝"
                  : gameOver.result === "white_wins"
                    ? "♔"
                    : "♚"}
              </div>
              <h3>
                {gameOver.result === "draw"
                  ? "Draw!"
                  : gameOver.result === "white_wins"
                    ? "White Wins!"
                    : "Black Wins!"}
              </h3>
              <p>{gameOver.reason}</p>
              <div className="gameover-actions">
                <button
                  className="btn-primary"
                  onClick={() => navigate("/setup?mode=" + mode)}>
                  New Game
                </button>
                <button className="btn-ghost" onClick={() => navigate("/")}>
                  Home
                </button>
              </div>
            </div>
          )}

          <div className="move-history">
            <h4>Move History</h4>
            <div className="moves-list">
              {moveHistory.reduce((acc, mv, i) => {
                if (i % 2 === 0) {
                  acc.push(
                    <div key={i} className="move-pair">
                      <span className="move-num">{Math.floor(i / 2) + 1}.</span>
                      <span className="move-san white-move">{mv.san}</span>
                      {moveHistory[i + 1] && (
                        <span className="move-san black-move">
                          {moveHistory[i + 1].san}
                        </span>
                      )}
                    </div>,
                  );
                }
                return acc;
              }, [])}
            </div>
          </div>

          {!gameOver && (
            <div className="game-controls">
              {mode !== "online" && (
                <button
                  className="ctrl-btn"
                  onClick={getHint}
                  disabled={hintUsed || isThinking}>
                  💡 Hint {hintUsed ? "(used)" : ""}
                </button>
              )}
              {mode === "online" && (
                <>
                  <button
                    className="ctrl-btn"
                    onClick={() =>
                      socketRef.current?.emit("offer_draw", { roomId: gameId })
                    }>
                    🤝 Offer Draw
                  </button>
                  <button
                    className="ctrl-btn danger"
                    onClick={() => {
                      if (confirm("Resign this game?"))
                        socketRef.current?.emit("resign", { roomId: gameId });
                    }}>
                    🏳 Resign
                  </button>
                </>
              )}
              {mode !== "online" && (
                <button
                  className="ctrl-btn danger"
                  onClick={() => {
                    if (confirm("Abandon this game?")) navigate("/");
                  }}>
                  🏳 Abandon
                </button>
              )}
            </div>
          )}

          {drawOffer && (
            <div className="draw-offer-banner">
              <p>Opponent offers a draw</p>
              <button
                className="btn-primary small"
                onClick={() => {
                  socketRef.current?.emit("accept_draw", { roomId: gameId });
                  setDrawOffer(false);
                }}>
                Accept
              </button>
              <button
                className="btn-ghost small"
                onClick={() => {
                  socketRef.current?.emit("decline_draw", { roomId: gameId });
                  setDrawOffer(false);
                }}>
                Decline
              </button>
            </div>
          )}

          {mode === "online" && (
            <div className="chat-box">
              <h4>Chat</h4>
              <div className="chat-messages">
                {chat.map((m, i) => (
                  <div key={i} className="chat-msg">
                    <strong>{m.username}:</strong> {m.message}
                  </div>
                ))}
              </div>
              <div className="chat-input-row">
                <input
                  type="text"
                  value={chatMsg}
                  onChange={(e) => setChatMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Say something..."
                />
                <button onClick={sendChat}>Send</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePage;
