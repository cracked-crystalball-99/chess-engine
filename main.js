// main.js - Cleaned up for robust Stockfish browser integration
let board = null;
let game = null;
let stockfish = null;
let stockfishReady = false;
let playVsEngineActive = false;
let userColor = 'w';

function startStockfish() {
  if (stockfish) return;
  stockfish = new Worker('stockfish.js');
  stockfish.onmessage = function(event) {
    document.getElementById('output').textContent += event.data + '\n';
    if (event.data.startsWith('info')) {
      updateEngineAnalysis(event.data);
    }
    if (event.data.startsWith('bestmove')) {
      const move = event.data.split(' ')[1];
      if (move && playVsEngineActive) {
        makeEngineMove(move);
      }
    }
    if (event.data === 'uciok') {
      stockfishReady = true;
      document.getElementById('getMoveBtn').disabled = false;
      setSkillLevel();
    }
  };
  stockfish.postMessage('uci');
}

function setSkillLevel() {
  const skill = document.getElementById('skillLevel').value;
  if (stockfishReady && stockfish) {
    stockfish.postMessage('setoption name Skill Level value ' + skill);
  }
}

function updateEngineAnalysis(infoLine) {
  if (!infoLine.includes(' pv ')) return;
  document.getElementById('engineAnalysis').textContent = infoLine;
}

function playVsEngine() {
  if (!stockfishReady) {
    startStockfish();
    const waitForEngine = setInterval(() => {
      if (stockfishReady) {
        clearInterval(waitForEngine);
        startPlayVsEngine();
      }
    }, 100);
  } else {
    startPlayVsEngine();
  }
}

function startPlayVsEngine() {
  playVsEngineActive = true;
  document.getElementById('playVsEngineBtn').disabled = true;
  document.getElementById('skillLevel').disabled = true;
  userColor = prompt('Play as White or Black? (w/b)', 'w').toLowerCase() === 'b' ? 'b' : 'w';
  game.reset();
  board.position(game.fen());
  if (userColor === 'b') {
    setTimeout(() => {
      const fen = game.fen();
      stockfish.postMessage('position fen ' + fen);
      stockfish.postMessage('go depth 15');
    }, 250);
  }
}

function onDrop(source, target) {
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q'
  });
  if (move === null) return 'snapback';
  if (playVsEngineActive) {
    const turn = game.turn();
    if ((userColor === 'w' && turn === 'b') || (userColor === 'b' && turn === 'w')) {
      setTimeout(() => {
        const fen = game.fen();
        stockfish.postMessage('position fen ' + fen);
        stockfish.postMessage('go depth 15');
      }, 250);
    }
  }
}

function makeEngineMove(uciMove) {
  const from = uciMove.substring(0,2);
  const to = uciMove.substring(2,4);
  const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
  const moveObj = { from, to };
  if (promotion) moveObj.promotion = promotion;
  const move = game.move(moveObj);
  if (move) {
    board.position(game.fen());
  }
}

function getBestMove() {
  if (!stockfishReady) {
    alert('Stockfish not ready!');
    return;
  }
  if (!board) {
    alert('Chessboard not initialized!');
    return;
  }
  const fen = board.fen();
  stockfish.postMessage('position fen ' + fen);
  stockfish.postMessage('go depth 15');
}

window.onload = function() {
  game = new Chess();
  board = Chessboard('board', {
    draggable: true,
    dropOffBoard: 'snapback',
    position: 'start',
    onDrop: onDrop,
  });
  document.getElementById('getMoveBtn').disabled = true;
  document.getElementById('playVsEngineBtn').disabled = false;
  document.getElementById('skillLevel').disabled = false;
  document.getElementById('skillLevel').addEventListener('change', setSkillLevel);
  startStockfish();

  // Mobile touch: prevent scroll and improve drag
  const boardEl = document.getElementById('board');
  if (boardEl) {
    let touchStartY = 0;
    let touchStartX = 0;
    boardEl.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
      }
    }, { passive: false });
    boardEl.addEventListener('touchmove', function(e) {
      if (e.touches.length === 1) {
        e.preventDefault();
        // Optionally, you can add custom drag logic here
      }
    }, { passive: false });
    boardEl.addEventListener('touchend', function(e) {
      // Optionally, handle touch end for custom piece drop
    }, { passive: false });
  }
};

// Note: You need to provide stockfish.js and stockfish.wasm in this folder.
// See README.md for instructions.
