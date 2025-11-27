// Modern Stockfish Lite 17.1 Mobile Chess Engine
class ChessEngine {
  constructor() {
    // Check if required libraries are loaded
    if (typeof $ === 'undefined') {
      console.error('jQuery library not loaded');
      const gameStatus = document.getElementById('gameStatus');
      if (gameStatus) gameStatus.textContent = 'Error: jQuery library failed to load';
      return;
    }
    
    if (typeof Chess === 'undefined') {
      console.error('Chess.js library not loaded');
      const gameStatus = document.getElementById('gameStatus');
      if (gameStatus) gameStatus.textContent = 'Error: Chess.js library failed to load';
      return;
    }
    
    if (typeof Chessboard === 'undefined') {
      console.error('Chessboard.js library not loaded');
      const gameStatus = document.getElementById('gameStatus');
      if (gameStatus) gameStatus.textContent = 'Error: Chessboard.js library failed to load';
      return;
    }
    
    this.game = new Chess();
    this.board = null;
    this.stockfish = null;
    this.engineReady = false;
    this.gameMode = 'play';
    this.playerColor = 'white';
    this.isPlayerTurn = true;
    this.selectedSquare = null;
    this.isMobile = this.detectMobile();
    
    // Clock properties
    this.timeControl = 5 * 60; // Default 5 minutes in seconds
    this.increment = 0; // Default no increment
    this.whiteTime = this.timeControl;
    this.blackTime = this.timeControl;
    this.clockTimer = null;
    this.gameStarted = false;
    
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
      draggable: true, // Enable dragging for desktop
      position: 'start',
      onDrop: this.onDrop.bind(this),
      onMouseDownSquare: this.isMobile ? this.onSquareClick.bind(this) : undefined,
      pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
      showNotation: !this.isMobile,
      moveSpeed: 'fast',
      snapSpeed: 200,
      snapbackSpeed: 400
    };
    
    this.board = Chessboard('chessboard', boardConfig);
    
    // Ensure board is properly sized
    setTimeout(() => {
      if (this.board) {
        this.board.resize();
      }
    }, 100);
    
    // Bind event listeners
    this.bindEvents();
    
    // Initialize clock display with current settings
    const timeControlEl = document.getElementById('timeControl');
    const timeIncrementEl = document.getElementById('timeIncrement');
    
    if (timeControlEl) {
      this.timeControl = parseInt(timeControlEl.value) * 60;
      this.whiteTime = this.timeControl;
      this.blackTime = this.timeControl;
    }
    if (timeIncrementEl) {
      this.increment = parseInt(timeIncrementEl.value);
    }
    
    this.updateClockDisplay();
    this.updateClockHighlight();
    
    // Update initial status
    this.updateGameStatus('🎮 Ready to play! Make your move or start vs engine.');
  }
  
  bindEvents() {
    const newGameBtn = document.getElementById('newGameBtn');
    const flipBoardBtn = document.getElementById('flipBoardBtn');
    const skillLevel = document.getElementById('skillLevel');
    const gameMode = document.getElementById('gameMode');
    const timeControl = document.getElementById('timeControl');
    const timeIncrement = document.getElementById('timeIncrement');
    
    if (newGameBtn) newGameBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.newGame();
    });
    if (flipBoardBtn) flipBoardBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.flipBoard();
    });
    if (skillLevel) skillLevel.addEventListener('change', () => this.setSkillLevel());
    if (timeControl) timeControl.addEventListener('change', (e) => {
      this.timeControl = parseInt(e.target.value) * 60; // Convert minutes to seconds
      this.whiteTime = this.timeControl;
      this.blackTime = this.timeControl;
      this.updateClockDisplay();
    });
    if (timeIncrement) timeIncrement.addEventListener('change', (e) => {
      this.increment = parseInt(e.target.value);
    });
    if (gameMode) gameMode.addEventListener('change', (e) => {
      this.gameMode = e.target.value;
      const mode = e.target.value === 'play' ? 'Play vs Engine' : 'Analysis Mode';
      this.updateGameStatus(`🔄 Switched to ${mode}`);
      
      if (e.target.value === 'analysis') {
        this.isPlayerTurn = true; // Allow free play in analysis mode
      }
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
      this.updateEngineStatus('Engine not available', false);
      
      // Check if it's a local file issue
      if (window.location.protocol === 'file:') {
        this.updateEvaluation('⚠️ Local file detected!\n\nFor full functionality:\n• Serve via HTTP server (python -m http.server)\n• Or deploy to GitHub Pages\n\n🎮 Two-player mode available!');
      } else {
        this.updateEvaluation('⚠️ Stockfish engine not available.\n\nPlease ensure stockfish.js and stockfish.wasm are in the same directory.\n\n🎮 You can still play in two-player mode!');
      }
    }
  }
  
  handleEngineMessage(event) {
    const message = event.data;
    
    if (message === 'uciok') {
      this.engineReady = true;
      this.updateEngineStatus('Ready', true);
      this.setSkillLevel();
      this.stockfish.postMessage('ucinewgame');
      console.log('🤖 Engine initialized and ready');
    } else if (message.startsWith('bestmove')) {
      const move = message.split(' ')[1];
      console.log('🤖 Engine suggested move:', move, 'isPlayerTurn:', this.isPlayerTurn);
      if (move && move !== '(none)' && !this.isPlayerTurn) {
        this.makeEngineMove(move);
      } else if (move === '(none)') {
        console.log('🤖 Engine has no moves - game over');
        this.handleGameOver();
      }
    } else if (message.startsWith('info') && message.includes('pv')) {
      this.updateAnalysis(message);
    }
  }
  
  setSkillLevel() {
    if (!this.engineReady || !this.stockfish) return;
    
    const skillLevelEl = document.getElementById('skillLevel');
    if (!skillLevelEl) return;
    
    const level = skillLevelEl.value;
    this.stockfish.postMessage(`setoption name Skill Level value ${level}`);
    this.stockfish.postMessage('setoption name MultiPV value 1');
  }
  
  // Clock functionality
  updateClockDisplay() {
    const whiteTimeEl = document.getElementById('whiteTime');
    const blackTimeEl = document.getElementById('blackTime');
    
    if (whiteTimeEl) {
      whiteTimeEl.textContent = this.formatTime(this.whiteTime);
      if (this.increment > 0) {
        whiteTimeEl.textContent += ` (+${this.increment})`;
      }
    }
    if (blackTimeEl) {
      blackTimeEl.textContent = this.formatTime(this.blackTime);
      if (this.increment > 0) {
        blackTimeEl.textContent += ` (+${this.increment})`;
      }
    }
  }
  
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  
  startClock() {
    if (this.clockTimer) clearInterval(this.clockTimer);
    
    this.clockTimer = setInterval(() => {
      if (!this.gameStarted || this.game.game_over()) {
        this.stopClock();
        return;
      }
      
      const currentTurn = this.game.turn();
      
      if (currentTurn === 'w') {
        this.whiteTime--;
        if (this.whiteTime <= 0) {
          this.whiteTime = 0;
          this.handleTimeOut('white');
          return;
        }
      } else {
        this.blackTime--;
        if (this.blackTime <= 0) {
          this.blackTime = 0;
          this.handleTimeOut('black');
          return;
        }
      }
      
      this.updateClockDisplay();
      this.updateClockHighlight();
    }, 1000);
  }
  
  stopClock() {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
  }
  
  addIncrement(color) {
    if (this.increment > 0) {
      if (color === 'white') {
        this.whiteTime += this.increment;
      } else {
        this.blackTime += this.increment;
      }
      this.updateClockDisplay();
    }
  }
  
  updateClockHighlight() {
    const whiteClockEl = document.getElementById('whiteClock');
    const blackClockEl = document.getElementById('blackClock');
    
    if (!whiteClockEl || !blackClockEl) return;
    
    const currentTurn = this.game.turn();
    
    // Remove all classes
    whiteClockEl.classList.remove('active', 'low-time');
    blackClockEl.classList.remove('active', 'low-time');
    
    // Add active class to current player
    if (currentTurn === 'w') {
      whiteClockEl.classList.add('active');
      if (this.whiteTime <= 30) whiteClockEl.classList.add('low-time');
    } else {
      blackClockEl.classList.add('active');
      if (this.blackTime <= 30) blackClockEl.classList.add('low-time');
    }
  }
  
  handleTimeOut(color) {
    this.stopClock();
    const winner = color === 'white' ? 'Black' : 'White';
    this.updateGameStatus(`⏰ Time's up! ${winner} wins on time!`);
    this.gameStarted = false;
  }
  
  resetClock() {
    this.stopClock();
    this.whiteTime = this.timeControl;
    this.blackTime = this.timeControl;
    this.gameStarted = false;
    this.updateClockDisplay();
    this.updateClockHighlight();
  }

  flipBoard() {
    this.board.flip();
    
    // Toggle player color
    this.playerColor = this.playerColor === 'white' ? 'black' : 'white';
    
    // Update clock highlight to reflect new perspective
    this.updateClockHighlight();
    
    // Update game status
    const colorText = this.playerColor === 'white' ? 'White' : 'Black';
    this.updateGameStatus(`🔄 Playing as ${colorText}`);
    
    // Debug logging
    console.log('🔄 FLIP DEBUG:', {
      playerColor: this.playerColor,
      currentTurn: this.game.turn(),
      gameMode: this.gameMode,
      engineReady: this.engineReady,
      gameStarted: this.gameStarted
    });
    
    // If we're now playing as black and it's a new game (white's turn), engine should move first
    if (this.playerColor === 'black' && this.game.turn() === 'w' && this.gameMode === 'play' && this.engineReady) {
      this.isPlayerTurn = false;
      this.updateGameStatus('🤖 Engine (White) is thinking...');
      
      // Start the clock if not already started
      if (!this.gameStarted) {
        this.gameStarted = true;
        this.startClock();
      }
      
      setTimeout(() => {
        console.log('🤖 Requesting engine move after flip...');
        this.requestEngineMove();
      }, 500);
    } else if (this.playerColor === 'white' && this.game.turn() === 'w') {
      this.isPlayerTurn = true;
      this.updateGameStatus('Your turn (White)');
    }
  }
  
  newGame() {
    this.game.reset();
    this.board.position('start');
    this.selectedSquare = null;
    
    // Get current time control and increment settings
    const timeControlEl = document.getElementById('timeControl');
    const timeIncrementEl = document.getElementById('timeIncrement');
    
    if (timeControlEl) {
      this.timeControl = parseInt(timeControlEl.value) * 60;
    }
    if (timeIncrementEl) {
      this.increment = parseInt(timeIncrementEl.value);
    }
    
    this.gameStarted = true;
    
    // Reset and start clock
    this.resetClock();
    this.startClock();
    
    if (this.engineReady) {
      this.stockfish.postMessage('ucinewgame');
    }
    
    // Set up turn logic based on player color
    if (this.playerColor === 'white') {
      this.isPlayerTurn = true;
      const mode = this.gameMode === 'play' ? 'vs Engine' : 'Two-Player';
      this.updateGameStatus(`🆕 New ${mode} game started! Your turn (White).`);
      this.updateEvaluation('Game started. Make your first move!');
    } else {
      // Playing as black, engine moves first
      this.isPlayerTurn = false;
      const mode = this.gameMode === 'play' ? 'vs Engine' : 'Two-Player';
      this.updateGameStatus(`🆕 New ${mode} game started! Engine (White) to move.`);
      this.updateEvaluation('Game started. Engine will move first.');
      
      if (this.gameMode === 'play' && this.engineReady) {
        setTimeout(() => {
          this.requestEngineMove();
        }, 1000);
      }
    }
  }
  
  onDrop(source, target) {
    // In two-player mode, allow all moves. In vs engine mode, only allow player moves
    if (this.gameMode === 'play' && !this.isPlayerTurn) {
      return 'snapback';
    }
    
    // Check if it's the player's turn based on color
    const currentTurn = this.game.turn();
    const playerTurn = this.playerColor === 'white' ? 'w' : 'b';
    
    if (this.gameMode === 'play' && currentTurn !== playerTurn) {
      return 'snapback';
    }
    
    const move = this.game.move({
      from: source,
      to: target,
      promotion: 'q'
    });
    
    if (move === null) return 'snapback';
    
    // Start clock on first move if not started
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.startClock();
    }
    
    this.handlePlayerMove();
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
        
        // Start clock on first move if not started
        if (!this.gameStarted) {
          this.gameStarted = true;
          this.startClock();
        }
        
        this.handlePlayerMove();
      }
    }
  }
  
  isPieceOwnedByPlayer(piece) {
    const isWhitePiece = piece.charAt(0) === 'w';
    const isPlayerWhite = this.playerColor === 'white';
    const isCurrentPlayerTurn = this.game.turn() === (isPlayerWhite ? 'w' : 'b');
    
    // In vs engine mode, only allow moves when it's player's turn
    if (this.gameMode === 'play' && !isCurrentPlayerTurn) {
      return false;
    }
    
    return (isWhitePiece === isPlayerWhite) && isCurrentPlayerTurn;
  }
  
  handlePlayerMove() {
    // Add increment for the player who just moved
    const previousTurn = this.game.turn() === 'w' ? 'black' : 'white';
    this.addIncrement(previousTurn);
    
    // Update board position
    this.board.position(this.game.fen());
    this.updateClockHighlight();
    
    // Check game status
    if (this.game.game_over()) {
      this.handleGameOver();
      return;
    }
    
    // Always analyze the position if engine is available
    if (this.engineReady) {
      this.analyzePosition();
    }
    
    if (this.gameMode === 'play' && this.engineReady) {
      // Engine vs Player mode
      this.isPlayerTurn = false;
      this.updateGameStatus('🤖 Engine is thinking...');
      
      setTimeout(() => {
        this.requestEngineMove();
      }, 500);
    } else {
      // Two-player or analysis mode
      this.isPlayerTurn = true;
      const turn = this.game.turn() === 'w' ? 'White' : 'Black';
      this.updateGameStatus(`${turn} to move`);
    }
  }
  
  analyzePosition() {
    if (!this.engineReady) return;
    
    const fen = this.game.fen();
    this.stockfish.postMessage(`position fen ${fen}`);
    this.stockfish.postMessage('go depth 10');
  }
  
  requestEngineMove() {
    if (!this.engineReady) {
      console.log('❌ Engine not ready for move request');
      return;
    }
    
    if (this.isPlayerTurn) {
      console.log('❌ Trying to request engine move during player turn');
      return;
    }
    
    const fen = this.game.fen();
    console.log('🤖 Requesting engine move for position:', fen);
    this.stockfish.postMessage(`position fen ${fen}`);
    
    const skillLevelEl = document.getElementById('skillLevel');
    const skillLevel = skillLevelEl ? parseInt(skillLevelEl.value) : 5;
    const depth = Math.max(3, Math.min(15, skillLevel));
    
    console.log('🤖 Engine thinking at depth:', depth, 'skill level:', skillLevel);
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
      // Add increment for the engine (who just moved)
      const engineColor = this.playerColor === 'white' ? 'black' : 'white';
      this.addIncrement(engineColor);
      
      this.board.position(this.game.fen());
      this.updateClockHighlight();
      
      if (this.game.game_over()) {
        this.handleGameOver();
      } else {
        this.isPlayerTurn = true;
        const playerColorText = this.playerColor === 'white' ? 'White' : 'Black';
        this.updateGameStatus(`Your turn (${playerColorText})`);
      }
    }
  }
  
  handleGameOver() {
    this.stopClock();
    this.gameStarted = false;
    
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
    const gameStatus = document.getElementById('gameStatus');
    if (gameStatus) gameStatus.textContent = message;
  }
  
  updateEngineStatus(message, ready) {
    const engineStatusText = document.getElementById('engineStatusText');
    const engineIndicator = document.getElementById('engineIndicator');
    
    if (engineStatusText) engineStatusText.textContent = message;
    if (engineIndicator) {
      engineIndicator.className = `status-indicator ${ready ? 'ready' : ''}`;
    }
  }
  
  updateEvaluation(text) {
    const engineEvaluation = document.getElementById('engineEvaluation');
    if (engineEvaluation) engineEvaluation.textContent = text;
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
  // Wait for libraries to be fully loaded
  function initializeWhenReady() {
    if (typeof $ !== 'undefined' && typeof Chess !== 'undefined' && typeof Chessboard !== 'undefined') {
      try {
        const chessEngine = new ChessEngine();
        
        // Handle window resize and orientation change
        window.addEventListener('resize', () => {
          setTimeout(() => chessEngine.resizeBoard(), 100);
        });
        
        window.addEventListener('orientationchange', () => {
          setTimeout(() => chessEngine.resizeBoard(), 300);
        });
      } catch (error) {
        console.error('Error initializing chess engine:', error);
        const gameStatus = document.getElementById('gameStatus');
        if (gameStatus) gameStatus.textContent = 'Error initializing chess engine: ' + error.message;
      }
    } else {
      // Libraries not ready yet, try again
      setTimeout(initializeWhenReady, 100);
    }
  }
  
  initializeWhenReady();
});
