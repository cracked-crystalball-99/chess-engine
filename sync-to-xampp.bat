@echo off
REM Sync chess engine to XAMPP localhost for testing

echo.
echo 🔄 Syncing Chess Engine to XAMPP Localhost
echo ===========================================

set "XAMPP_PATH=C:\xampp\htdocs\BJ-FM-js-chess-engine-fun"

REM Create XAMPP directory if it doesn't exist
if not exist "%XAMPP_PATH%" (
    echo 📁 Creating XAMPP directory...
    mkdir "%XAMPP_PATH%"
)

echo 📂 Source: %CD%
echo 🎯 Target: %XAMPP_PATH%
echo.

echo 📋 Syncing core files...
copy "index.html" "%XAMPP_PATH%\" >nul 2>&1 && echo   ✅ index.html || echo   ❌ index.html (MISSING!)
copy "main.js" "%XAMPP_PATH%\" >nul 2>&1 && echo   ✅ main.js || echo   ❌ main.js (MISSING!)
copy "README.md" "%XAMPP_PATH%\" >nul 2>&1 && echo   ✅ README.md || echo   ❌ README.md (MISSING!)
copy "stockfish.js" "%XAMPP_PATH%\" >nul 2>&1 && echo   ✅ stockfish.js || echo   ❌ stockfish.js (MISSING!)
copy "stockfish.wasm" "%XAMPP_PATH%\" >nul 2>&1 && echo   ✅ stockfish.wasm || echo   ❌ stockfish.wasm (MISSING!)

echo 📋 Syncing optional files...
copy ".placeholder" "%XAMPP_PATH%\" >nul 2>&1 && echo   ✅ .placeholder || echo   ⚪ .placeholder (optional)
copy "MyStockfishWorkspace.code-workspace" "%XAMPP_PATH%\" >nul 2>&1 && echo   ✅ MyStockfishWorkspace.code-workspace || echo   ⚪ MyStockfishWorkspace.code-workspace (optional)

REM Sync img directory
if exist "img" (
    echo 📁 Syncing img directory...
    if exist "%XAMPP_PATH%\img" rmdir /s /q "%XAMPP_PATH%\img" >nul 2>&1
    xcopy "img" "%XAMPP_PATH%\img" /e /i /q >nul 2>&1 && echo   ✅ img directory || echo   ❌ img directory
) else (
    echo   ⚪ img directory (not found)
)

echo 🧹 Cleaning up old files...
del "%XAMPP_PATH%\download_hls_ax.py" >nul 2>&1 && echo   🗑️  Removed download_hls_ax.py
del "%XAMPP_PATH%\download_stockfish.ps1" >nul 2>&1 && echo   🗑️  Removed download_stockfish.ps1
del "%XAMPP_PATH%\hls_ax_6mo_close.csv" >nul 2>&1 && echo   🗑️  Removed hls_ax_6mo_close.csv
del "%XAMPP_PATH%\GME.csv" >nul 2>&1 && echo   🗑️  Removed GME.csv
del "%XAMPP_PATH%\fetch-gcf.js" >nul 2>&1 && echo   🗑️  Removed fetch-gcf.js
del "%XAMPP_PATH%\gcf-gemini-iterations.py" >nul 2>&1 && echo   🗑️  Removed gcf-gemini-iterations.py
if exist "%XAMPP_PATH%\.git" rmdir /s /q "%XAMPP_PATH%\.git" >nul 2>&1 && echo   🗑️  Removed .git directory

REM Create timestamp
echo Last synced: %date% %time% > "%XAMPP_PATH%\last-sync.txt"
echo Source: %CD% >> "%XAMPP_PATH%\last-sync.txt"
echo Synced by: sync-to-xampp.bat >> "%XAMPP_PATH%\last-sync.txt"

echo.
echo ✅ Sync completed successfully!
echo 🕐 Timestamp: %date% %time%
echo 📄 Sync info saved to: last-sync.txt
echo.
echo 🌐 Localhost URL: http://localhost/BJ-FM-js-chess-engine-fun
echo 🚀 Make sure XAMPP is running!
echo.
echo 🌍 Opening browser...
start http://localhost/BJ-FM-js-chess-engine-fun
echo.
echo 💡 Tips:
echo    • Run this script after making changes to sync instantly
echo    • Files are cleaned and optimized for localhost testing
echo    • Use quick-sync.bat for faster development updates

pause