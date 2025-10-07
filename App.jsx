import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

function Cross() {
  return (
    <svg viewBox="0 0 100 100" className="mark">
      <g stroke="url(#xGrad)" strokeWidth="14" strokeLinecap="round" fill="none">
        <line x1="20" y1="20" x2="80" y2="80" />
        <line x1="80" y1="20" x2="20" y2="80" />
      </g>
      <defs>
        <linearGradient id="xGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Naught() {
  return (
    <svg viewBox="0 0 100 100" className="mark">
      <defs>
        <radialGradient id="oGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#06b6d4" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="32" fill="none" stroke="url(#oGrad)" strokeWidth="14" />
    </svg>
  );
}

function Square({ value, onClick, highlight, last, disabled }) {
  return (
    <button
      className={`square${highlight ? " highlight" : ""}${last ? " last" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {value === "X" ? <Cross /> : value === "O" ? <Naught /> : null}
    </button>
  );
}

function Board({ squares, onPlay, winningLine, xIsNext, lastMove }) {
  function handleClick(i) {
    if (squares[i] || winningLine) return;
    const next = squares.slice();
    next[i] = xIsNext ? "X" : "O";
    onPlay(next, i);
  }

  return (
    <div className={`board ${winningLine ? "win-animate" : ""}`}>
      {Array.from({ length: 9 }).map((_, i) => {
        const isWin = winningLine?.includes(i);
        const isLast = lastMove === i;
        return (
          <Square
            key={i}
            value={squares[i]}
            onClick={() => handleClick(i)}
            highlight={isWin}
            last={isLast}
            disabled={Boolean(winningLine)}
          />
        );
      })}
    </div>
  );
}

function calculateWinner(sq) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of lines) {
    if (sq[a] && sq[a] === sq[b] && sq[a] === sq[c]) return { winner: sq[a], line: [a,b,c] };
  }
  if (sq.every(Boolean)) return { winner: "draw", line: [] };
  return null;
}

function tryWin(board, player) {
  const empties = board.map((v,i)=>v?null:i).filter(i=>i!==null);
  for (const i of empties) {
    const copy = board.slice();
    copy[i] = player;
    if (calculateWinner(copy)?.winner === player) return i;
  }
  return null;
}

function pickBotMove(board) {
  let i = tryWin(board, "O");
  if (i !== null) return i;
  i = tryWin(board, "X");
  if (i !== null) return i;
  if (!board[4]) return 4;
  const corners = [0,2,6,8].filter((k)=>!board[k]);
  if (corners.length) return corners[Math.floor(Math.random()*corners.length)];
  const rest = board.map((v,idx)=>v?null:idx).filter((k)=>k!==null);
  if (rest.length) return rest[Math.floor(Math.random()*rest.length)];
  return null;
}

function Confetti({ run }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const colors = ["#34d399","#06b6d4","#8b5cf6","#f59e0b","#ef4444","#22d3ee"];
    let pieces = [];
    function spawn() {
      pieces = Array.from({length: 220}).map(() => ({
        x: Math.random()*w,
        y: -20 - Math.random()*h*0.5,
        r: 6 + Math.random()*8,
        vx: -1 + Math.random()*2,
        vy: 2 + Math.random()*3.5,
        a: Math.random()*Math.PI*2,
        color: colors[Math.floor(Math.random()*colors.length)]
      }));
    }
    function draw() {
      if (!run) { ctx.clearRect(0,0,w,h); return; }
      ctx.clearRect(0,0,w,h);
      pieces.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.a += 0.07;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.a);
        ctx.fillStyle = p.color; ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r); ctx.restore();
        if (p.y > h + 24) { p.y = -20; p.x = Math.random()*w; }
      });
      requestAnimationFrame(draw);
    }
    function onResize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; spawn(); }
    spawn(); requestAnimationFrame(draw);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [run]);
  return <canvas ref={ref} className={`confetti ${run ? "show" : ""}`} />;
}

function WinnerBanner({ text, show }) {
  if (!show) return null;
  return <div className="winner-banner">{text}</div>;
}

export default function App() {
  const [history, setHistory] = useState([{ squares: Array(9).fill(null), move: null }]);
  const [currentMove, setCurrentMove] = useState(0);
  const [lastMove, setLastMove] = useState(null);
  const [scores, setScores] = useState({ X: 0, O: 0, D: 0 });
  const [vsBot, setVsBot] = useState(false);
  const [userSide, setUserSide] = useState("X");
  const [nameX, setNameX] = useState("Player X");
  const [nameO, setNameO] = useState("Player O");
  const current = history[currentMove];
  const xIsNext = currentMove % 2 === 0;
  const result = useMemo(() => calculateWinner(current.squares), [current.squares]);
  const playingNameX = vsBot && userSide === "O" ? "Bot" : nameX || "Player X";
  const playingNameO = vsBot && userSide === "X" ? "Bot" : nameO || "Player O";
  const won = Boolean(result && result.winner && result.winner !== "draw");
  const winnerName = result?.winner === "X" ? playingNameX : playingNameO;
  const botDelayRef = useRef(null);
  const [canBotAct, setCanBotAct] = useState(false);

  function armBot(ms = 1000) {
    if (botDelayRef.current) clearTimeout(botDelayRef.current);
    setCanBotAct(false);
    botDelayRef.current = setTimeout(() => setCanBotAct(true), ms);
  }
  useEffect(() => () => clearTimeout(botDelayRef.current), []);

  useEffect(() => {
    if (result?.winner && !history.scored) {
      setScores((s) =>
        result.winner === "draw" ? { ...s, D: s.D + 1 } : { ...s, [result.winner]: s[result.winner] + 1 }
      );
      setHistory((h) => Object.assign([...h], { scored: true }));
    }
  }, [result, history]);

  useEffect(() => {
    if (!vsBot) return;
    if (!canBotAct) return;
    if (result?.winner) return;
    const board = current.squares;
    const botTurn =
      (xIsNext && userSide !== "X") ||
      (!xIsNext && userSide !== "O");
    if (!botTurn) return;
    const move = pickBotMove(board);
    if (move !== null && board[move] == null) {
      const t = setTimeout(() => {
        const next = board.slice();
        next[move] = xIsNext ? "X" : "O";
        onPlay(next, move);
      }, 320);
      return () => clearTimeout(t);
    }
  }, [vsBot, canBotAct, result, current, xIsNext, userSide]);

  function onPlay(nextSquares, movedIndex) {
    const nextHistory = history.slice(0, currentMove + 1).concat([{ squares: nextSquares, move: movedIndex }]);
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
    setLastMove(movedIndex);
  }

  function resetBoard() {
    setHistory([{ squares: Array(9).fill(null), move: null }]);
    setCurrentMove(0);
    setLastMove(null);
    armBot(900);
  }

  function resetAll() {
    resetBoard();
    setScores({ X: 0, O: 0, D: 0 });
  }

  const sideDisabled = history.length > 1 || current.squares.some(Boolean);

  return (
    <div className="page">
      <Confetti run={won} />
      <WinnerBanner text={`${winnerName} Wins!`} show={won} />
      <div className="card">
        <div className="board-section">
          <Board
            squares={current.squares}
            onPlay={onPlay}
            winningLine={result?.line}
            xIsNext={xIsNext}
            lastMove={lastMove}
          />
        </div>
        <div className="sidebar">
          <div className="panel-header">
            <h1>Tic-Tac-Toe</h1>
            <div className="stats">
              <span className="chip x">X: {scores.X}</span>
              <span className="chip o">O: {scores.O}</span>
              <span className="chip d">Draws: {scores.D}</span>
            </div>
          </div>
          <div className="panel-body">
            <section className="row-line">
              <span>Play vs Bot</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={vsBot}
                  onChange={(e) => {
                    setVsBot(e.target.checked);
                    resetBoard();
                    armBot(1200);
                  }}
                />
                <span className="slider" />
              </label>
            </section>
            <section className="grid-2">
              <div className="field">
                <label>Player X</label>
                <input
                  value={vsBot && userSide === "O" ? "Bot" : nameX}
                  onChange={(e)=>setNameX(e.target.value)}
                  disabled={vsBot && userSide === "O"}
                  placeholder="Player X name"
                />
              </div>
              <div className="field">
                <label>Player O</label>
                <input
                  value={vsBot && userSide === "X" ? "Bot" : nameO}
                  onChange={(e)=>setNameO(e.target.value)}
                  disabled={vsBot && userSide === "X"}
                  placeholder="Player O name"
                />
              </div>
            </section>
            <section className="row-line">
              <span>Choose your side</span>
              <div className="pillset">
                <label className={`pill ${userSide==="X"?"active":""}`}>
                  <input
                    type="radio"
                    name="side"
                    value="X"
                    checked={userSide==="X"}
                    onChange={()=>{ setUserSide("X"); resetBoard(); armBot(1200); }}
                    disabled={!vsBot || sideDisabled}
                  />
                  X
                </label>
                <label className={`pill ${userSide==="O"?"active":""}`}>
                  <input
                    type="radio"
                    name="side"
                    value="O"
                    checked={userSide==="O"}
                    onChange={()=>{ setUserSide("O"); resetBoard(); armBot(1200); }}
                    disabled={!vsBot || sideDisabled}
                  />
                  O
                </label>
              </div>
            </section>
            <section className="status-row">
              <span className={`status ${result?.winner ? "won" : ""}`}>
                {result?.winner === "draw"
                  ? "It’s a draw"
                  : result?.winner === "X"
                  ? `Winner: ${vsBot && userSide === "O" ? "Bot" : nameX || "Player X"}`
                  : result?.winner === "O"
                  ? `Winner: ${vsBot && userSide === "X" ? "Bot" : nameO || "Player O"}`
                  : `Next: ${currentMove % 2 === 0
                      ? (vsBot && userSide === "O" ? "Bot" : nameX || "Player X")
                      : (vsBot && userSide === "X" ? "Bot" : nameO || "Player O")}`
                }
              </span>
              <div className="actions">
                <button onClick={resetBoard}>Restart</button>
                <button className="danger" onClick={resetAll}>Reset All</button>
              </div>
            </section>
          </div>
        </div>
      </div>
      <footer className="footer">Good luck & have fun ✨</footer>
    </div>
  );
}
