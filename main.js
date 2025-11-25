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
  
  // Parse the engine output for better display
  const analysisEl = document.getElementById('engineAnalysis');
  let displayText = '';
  
  // Extract depth, score, and principal variation
  const depthMatch = infoLine.match(/depth (\d+)/);
  const scoreMatch = infoLine.match(/score (cp|mate) (-?\d+)/);
  const pvMatch = infoLine.match(/pv (.+?)(?:\s|$)/);
  
  if (depthMatch) {
    displayText += `Depth: ${depthMatch[1]} `;
  }
  
  if (scoreMatch) {
    const scoreType = scoreMatch[1];
    const scoreValue = scoreMatch[2];
    if (scoreType === 'cp') {
      const pawns = (parseInt(scoreValue) / 100).toFixed(1);
      displayText += `Eval: ${pawns > 0 ? '+' : ''}${pawns} `;
    } else {
      displayText += `Mate in ${scoreValue} `;
    }
  }
  
  if (pvMatch) {
    const moves = pvMatch[1].split(' ').slice(0, 6); // Show first 6 moves
    displayText += `\nBest line: ${moves.join(' ')}`;
  }
  
  analysisEl.textContent = displayText.trim();
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

// Enhanced mobile support variables
let selectedSquare = null;
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Mobile-friendly piece selection
function onMouseDownSquare(square, piece) {
  if (!isMobile) return true; // Use default behavior on desktop
  
  // Mobile touch logic
  if (selectedSquare === null) {
    if (piece !== false && ((game.turn() === 'w' && piece.charAt(0) === 'w') || 
                            (game.turn() === 'b' && piece.charAt(0) === 'b'))) {
      selectedSquare = square;
      // Highlight selected square
      highlightSquare(square);
      return false; // Prevent default drag
    }
  } else {
    // Try to make move
    const move = game.move({
      from: selectedSquare,
      to: square,
      promotion: 'q'
    });
    
    if (move === null) {
      // Invalid move, try selecting new piece
      selectedSquare = null;
      clearHighlights();
      if (piece !== false && ((game.turn() === 'w' && piece.charAt(0) === 'w') || 
                              (game.turn() === 'b' && piece.charAt(0) === 'b'))) {
        selectedSquare = square;
        highlightSquare(square);
      }
    } else {
      // Valid move made
      selectedSquare = null;
      clearHighlights();
      board.position(game.fen());
      
      // Trigger engine move if playing vs engine
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
  }
  return false;
}

function highlightSquare(square) {
  const squareEl = document.querySelector(`[data-square="${square}"]`);
  if (squareEl) {
    squareEl.style.backgroundColor = '#a0d0ff';
    squareEl.style.boxShadow = 'inset 0 0 10px rgba(0,100,255,0.5)';
  }
}

function clearHighlights() {
  const squares = document.querySelectorAll('[data-square]');
  squares.forEach(square => {
    square.style.backgroundColor = '';
    square.style.boxShadow = '';
  });
}

window.onload = function() {
  game = new Chess();
  
  const boardConfig = {
    draggable: !isMobile, // Disable dragging on mobile
    dropOffBoard: 'snapback',
    position: 'start',
    onDrop: onDrop,
    pieceTheme: 'img/chesspieces/wikipedia/{piece}.png',
    showNotation: true,
    showErrors: false,
    sparePieces: false,
    appearSpeed: 'fast',
    trashSpeed: 'fast',
    snapSpeed: 200,
    snapbackSpeed: 400,
    moveSpeed: 200
  };
  
  // Add mobile-specific handlers
  if (isMobile) {
    boardConfig.onMouseDownSquare = onMouseDownSquare;
  }
  
  board = Chessboard('board', boardConfig);
  
  // Responsive board sizing
  function resizeBoard() {
    if (board) {
      board.resize();
    }
  }
  
  window.addEventListener('resize', resizeBoard);
  window.addEventListener('orientationchange', function() {
    setTimeout(resizeBoard, 100);
  });
  
  document.getElementById('getMoveBtn').disabled = true;
  document.getElementById('playVsEngineBtn').disabled = false;
  document.getElementById('skillLevel').disabled = false;
  document.getElementById('skillLevel').addEventListener('change', setSkillLevel);
  
  // Show mobile instructions if on mobile device
  if (isMobile) {
    const mobileInstructions = document.getElementById('mobile-instructions');
    if (mobileInstructions) {
      mobileInstructions.style.display = 'block';
    }
  }
  
  startStockfish();
};

// Note: You need to provide stockfish.js and stockfish.wasm in this folder.
// See README.md for instructions.
