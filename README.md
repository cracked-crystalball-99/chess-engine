# Stockfish Lite 17.1 - Mobile Chess Engine

A modern, mobile-optimized chess engine powered by Stockfish, designed specifically for GitHub Pages deployment.

## 🚀 Features

- **Mobile-First Design**: Optimized for touchscreen devices with intuitive tap-to-move interface
- **Modern UI**: Clean, gradient-based design with smooth animations
- **Stockfish Integration**: Powerful chess engine with adjustable difficulty levels
- **Real-time Analysis**: Live position evaluation and best move suggestions
- **Responsive Layout**: Adapts perfectly to different screen sizes
- **GitHub Pages Ready**: Deploys instantly to GitHub Pages

## 🎮 How to Play

1. **On Mobile**: Tap a piece to select it, then tap the destination square
2. **On Desktop**: Drag and drop pieces to move
3. **Game Modes**: 
   - Play vs Engine: Challenge Stockfish
   - Analysis Mode: Explore positions with engine help

## 🛠️ Setup for GitHub Pages

1. **Clone/Fork this repository**
2. **Add Stockfish files** (required):
   - Download `stockfish.js` and `stockfish.wasm` from [official Stockfish repository](https://github.com/official-stockfish/Stockfish)
   - Place them in the root directory alongside `index.html`
3. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Set source to "Deploy from a branch"
   - Select "main" branch and "/root" folder
4. **Access your chess engine** at `https://yourusername.github.io/repository-name`

## 📁 File Structure

```
├── index.html          # Main game interface
├── main.js             # Modern chess engine logic
├── stockfish.js        # Stockfish WASM wrapper (download required)
├── stockfish.wasm      # Stockfish engine binary (download required)
├── README.md           # This file
└── img/                # Chess piece images (optional, uses CDN)
```

## 🎯 Engine Levels

- **Beginner (Level 1)**: Perfect for learning
- **Easy (Level 3)**: Casual play
- **Medium (Level 5)**: Balanced challenge  
- **Hard (Level 8)**: Strong opponent
- **Expert (Level 15)**: Advanced play
- **Master (Level 20)**: Maximum strength

## 🔧 Technical Details

- **No Backend Required**: Pure frontend implementation
- **CDN Libraries**: Chess.js and Chessboard.js loaded from CDN
- **Mobile Optimized**: Prevents zoom, handles touch events properly
- **Modern JavaScript**: ES6+ class-based architecture
- **Cross-Platform**: Works on iOS, Android, and desktop browsers

## 🚨 Important Notes

- **Stockfish files not included**: You must download `stockfish.js` and `stockfish.wasm` separately
- **HTTPS Required**: GitHub Pages serves over HTTPS, which is required for Web Workers
- **Modern Browsers**: Requires support for WebAssembly and Web Workers

## 📱 Mobile Features

- Tap-to-select piece movement
- Prevents accidental zoom and scroll
- Optimized button sizes for touch
- Portrait/landscape orientation support
- Smooth animations and visual feedback

## License
- Stockfish is licensed under GPL v3. See [LICENSE](https://github.com/official-stockfish/Stockfish/blob/master/COPYING) for details.
- This web interface is MIT licensed.

---

*Ready to deploy your own mobile chess engine? Fork this repository and follow the setup instructions!*
