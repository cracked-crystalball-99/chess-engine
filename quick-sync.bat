@echo off
REM Quick development sync - updates only HTML/JS files to XAMPP

set "XAMPP_PATH=C:\xampp\htdocs\BJ-FM-js-chess-engine-fun"

if not exist "%XAMPP_PATH%" (
    echo ❌ XAMPP directory not found: %XAMPP_PATH%
    echo 💡 Run sync-to-xampp.bat first for full setup
    pause
    exit /b 1
)

echo ⚡ Quick Sync [%time:~0,8%]

copy "index.html" "%XAMPP_PATH%\" >nul 2>&1 && echo   ✅ index.html
copy "main.js" "%XAMPP_PATH%\" >nul 2>&1 && echo   ✅ main.js

echo 🔄 Refresh browser to see changes!