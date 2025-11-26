// Modern Stockfish Lite 17.1 Mobile Chess Engine
class ChessEngine {
  constructor() {
    this.game = new Chess();
    this.board = null;
    this.stockfish = null;
    this.engineReady = false;
    this.gameMode = 'play';
    this.playerColor = 'white';
    this.isPlayerTurn = true;
    this.selectedSquare = null;
    this.isMobile = this.detectMobile();
    
    this.initializeUI();
    this.initializeStockfish();
  }
  
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
  }
  
  initializeUI() {
    // Initialize chessboard
    const boardConfig = {
      draggable: !this.isMobile,
      position: 'start',
      onDrop: this.onDrop.bind(this),
      onMouseDownSquare: this.onSquareClick.bind(this),
      pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
      showNotation: !this.isMobile
    };
    
    this.board = Chessboard('chessboard', boardConfig);
    
    // Bind event listeners
    this.bindEvents();
    
    // Update initial status
    this.updateGameStatus('Ready to play!');
  }
  
  bindEvents() {
    document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
    document.getElementById('flipBoardBtn').addEventListener('click', () => this.board.flip());
    document.getElementById('skillLevel').addEventListener('change', () => this.setSkillLevel());
    document.getElementById('gameMode').addEventListener('change', (e) => {
      this.gameMode = e.target.value;
      this.updateGameStatus(`Switched to ${e.target.value} mode`);
    });
  }
  
  initializeStockfish() {
    try {
      this.stockfish = new Worker('stockfish.js');
      this.stockfish.onmessage = this.handleEngineMessage.bind(this);
      this.stockfish.postMessage('uci');
      this.updateEngineStatus('Initializing...', false);
    } catch (error) {
      console.error('Failed to load Stockfish:', error);
      this.updateEngineStatus('Engine failed to load', false);
      this.updateEvaluation('⚠️ Stockfish engine not available.\n\nPlease ensure stockfish.js and stockfish.wasm are in the same directory as this page.\n\n📥 Download from: https://github.com/official-stockfish/Stockfish\n\n🎮 You can still play in two-player mode!');
    }
  }
  
  handleEngineMessage(event) {
    const message = event.data;
    
    if (message === 'uciok') {
      this.engineReady = true;
      this.updateEngineStatus('Ready', true);
      this.setSkillLevel();
      this.stockfish.postMessage('ucinewgame');
    } else if (message.startsWith('bestmove')) {
      const move = message.split(' ')[1];
      if (move && move !== '(none)' && !this.isPlayerTurn) {
        this.makeEngineMove(move);
      }
    } else if (message.startsWith('info') && message.includes('pv')) {
      this.updateAnalysis(message);
    }
  }
  
  setSkillLevel() {
    if (!this.engineReady || !this.stockfish) return;
    
    const level = document.getElementById('skillLevel').value;
    this.stockfish.postMessage(`setoption name Skill Level value ${level}`);
    this.stockfish.postMessage('setoption name MultiPV value 1');
  }
  
  newGame() {
    this.game.reset();
    this.board.position('start');
    this.isPlayerTurn = true;
    this.selectedSquare = null;
    this.playerColor = 'white';
    
    if (this.engineReady) {
      this.stockfish.postMessage('ucinewgame');
    }
    
    this.updateGameStatus('New game started! White to move.');
    this.updateEvaluation('Game started. Make your first move!');
  }
  
  onDrop(source, target) {
    if (!this.isPlayerTurn) return 'snapback';
    
    const move = this.game.move({
      from: source,
      to: target,
      promotion: 'q'
    });
    
    if (move === null) return 'snapback';
    
    this.handlePlayerMove();
    return 'keep';
  }
  
  onSquareClick(square, piece) {
    // Mobile touch handling
    if (!this.isMobile) return;
    
    if (!this.isPlayerTurn) return;
    
    if (this.selectedSquare === null) {
      // Select piece
      if (piece && this.isPieceOwnedByPlayer(piece)) {
        this.selectedSquare = square;
        this.highlightSquare(square);
        this.updateGameStatus(`Selected ${piece}. Tap destination square.`);
      }
    } else {
      // Try to move
      const move = this.game.move({
        from: this.selectedSquare,
        to: square,
        promotion: 'q'
      });
      
      this.clearHighlights();
      
      if (move === null) {
        // Invalid move, try selecting new piece
        this.selectedSquare = null;
        if (piece && this.isPieceOwnedByPlayer(piece)) {
          this.selectedSquare = square;
          this.highlightSquare(square);
          this.updateGameStatus(`Selected ${piece}. Tap destination square.`);
        } else {
          this.updateGameStatus('Invalid move. Select a piece to move.');
        }
      } else {
        // Valid move
        this.selectedSquare = null;
        this.board.position(this.game.fen());
        this.handlePlayerMove();
      }
    }
  }
  
  isPieceOwnedByPlayer(piece) {
    const isWhitePiece = piece.charAt(0) === 'w';
    const isPlayerWhite = this.playerColor === 'white';
    const isPlayerTurn = this.game.turn() === (isPlayerWhite ? 'w' : 'b');
    
    return (isWhitePiece === isPlayerWhite) && isPlayerTurn;
  }
  
  handlePlayerMove() {
    this.isPlayerTurn = false;
    
    // Check game status
    if (this.game.game_over()) {
      this.handleGameOver();
      return;
    }
    
    this.updateGameStatus('Engine is thinking...');
    
    if (this.gameMode === 'play' && this.engineReady) {
      // Get engine move
      setTimeout(() => {
        this.requestEngineMove();
      }, 500);
    } else {
      // Analysis mode or engine not ready
      this.isPlayerTurn = true;
      this.updateGameStatus('Your turn');
    }
  }
  
  requestEngineMove() {
    if (!this.engineReady) return;
    
    const fen = this.game.fen();
    this.stockfish.postMessage(`position fen ${fen}`);
    
    const skillLevel = parseInt(document.getElementById('skillLevel').value);
    const depth = Math.max(3, Math.min(15, skillLevel));
    
    this.stockfish.postMessage(`go depth ${depth}`);
  }
  
  makeEngineMove(uciMove) {
    if (uciMove === '(none)') {
      this.handleGameOver();
      return;
    }
    
    const from = uciMove.substring(0, 2);
    const to = uciMove.substring(2, 4);
    const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
    
    const moveObj = { from, to };
    if (promotion) moveObj.promotion = promotion;
    
    const move = this.game.move(moveObj);
    if (move) {
      this.board.position(this.game.fen());
      
      if (this.game.game_over()) {
        this.handleGameOver();
      } else {
        this.isPlayerTurn = true;
        this.updateGameStatus('Your turn');
      }
    }
  }
  
  handleGameOver() {
    let status = '';
    
    if (this.game.in_checkmate()) {
      const winner = this.game.turn() === 'w' ? 'Black' : 'White';
      status = `🏁 Game Over - ${winner} wins by checkmate!`;
    } else if (this.game.in_stalemate()) {
      status = '🤝 Game Over - Draw by stalemate';
    } else if (this.game.in_threefold_repetition()) {
      status = '🤝 Game Over - Draw by repetition';
    } else if (this.game.insufficient_material()) {
      status = '🤝 Game Over - Draw by insufficient material';
    } else if (this.game.in_draw()) {
      status = '🤝 Game Over - Draw';
    }
    
    this.updateGameStatus(status);
    this.isPlayerTurn = false;
  }
  
  updateAnalysis(infoLine) {
    const depthMatch = infoLine.match(/depth (\d+)/);
    const scoreMatch = infoLine.match(/score (cp|mate) (-?\d+)/);
    const pvMatch = infoLine.match(/pv ([\w\s]+)/);
    
    if (!pvMatch) return;
    
    let analysisText = '';
    
    if (depthMatch) {
      analysisText += `📊 Depth: ${depthMatch[1]}\n`;
    }
    
    if (scoreMatch) {
      const [, scoreType, scoreValue] = scoreMatch;
      if (scoreType === 'cp') {
        const pawns = (parseInt(scoreValue) / 100).toFixed(1);
        const advantage = pawns > 0 ? 'White' : 'Black';
        analysisText += `⚖️ Evaluation: ${pawns > 0 ? '+' : ''}${pawns} (${advantage})\n`;
      } else {
        analysisText += `🏁 Mate in ${Math.abs(scoreValue)}\n`;
      }
    }
    
    if (pvMatch) {
      const moves = pvMatch[1].trim().split(' ').slice(0, 8);
      analysisText += `🎯 Best line: ${moves.join(' ')}`;
    }
    
    this.updateEvaluation(analysisText || 'Analyzing position...');
  }
  
  highlightSquare(square) {
    const squareEl = document.querySelector(`[data-square="${square}"]`);
    if (squareEl) {
      squareEl.style.backgroundColor = '#667eea';
      squareEl.style.boxShadow = 'inset 0 0 15px rgba(102, 126, 234, 0.5)';
    }
  }
  
  clearHighlights() {
    const squares = document.querySelectorAll('[data-square]');
    squares.forEach(square => {
      square.style.backgroundColor = '';
      square.style.boxShadow = '';
    });
  }
  
  updateGameStatus(message) {
    document.getElementById('gameStatus').textContent = message;
  }
  
  updateEngineStatus(message, ready) {
    document.getElementById('engineStatusText').textContent = message;
    document.getElementById('engineIndicator').className = 
      `status-indicator ${ready ? 'ready' : ''}`;
  }
  
  updateEvaluation(text) {
    document.getElementById('engineEvaluation').textContent = text;
  }
  
  // Responsive board sizing
  resizeBoard() {
    if (this.board) {
      this.board.resize();
    }
  }
}

// Initialize the chess engine when the page loads
document.addEventListener('DOMContentLoaded', function() {
  const chessEngine = new ChessEngine();
  
  // Handle window resize and orientation change
  window.addEventListener('resize', () => {
    setTimeout(() => chessEngine.resizeBoard(), 100);
  });
  
  window.addEventListener('orientationchange', () => {
    setTimeout(() => chessEngine.resizeBoard(), 300);
  });
});
