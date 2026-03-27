@echo off
setlocal
cd /d "%~dp0"

echo Tennis Lessons - starting dev server on port 3000...
echo Keep the "Next.js" window open while you use the app.
echo.

start "Tennis Lessons - Next.js" cmd /k "npm run dev -- -p 3000"

REM Wait for Next.js to become ready (adjust if your PC is slower)
timeout /t 5 /nobreak >nul

start "" "http://localhost:3000"
echo Browser opened. If the page fails to load, wait a few seconds and refresh.
