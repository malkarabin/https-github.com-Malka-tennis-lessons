@echo off
setlocal
cd /d "%~dp0"

echo Tennis Lessons - Next.js on port 3000, then ngrok tunnel.
echo.
echo 1) Keep BOTH windows open while you use the app.
echo 2) Copy the https://.... URL from the ngrok window (not an old bookmark).
echo 3) Free ngrok URLs change when you restart ngrok unless you use a reserved domain.
echo.

if not exist "node_modules\" (
  echo Running npm install first...
  call npm install
  if errorlevel 1 exit /b 1
)

start "Tennis Lessons - Next.js" cmd /k "npm run dev -- -p 3000"

REM Next must listen before ngrok connects
timeout /t 6 /nobreak >nul

where ngrok >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ngrok not found in PATH] Install from https://ngrok.com/download and run:
  echo   ngrok http 3000
  echo in another terminal after Next.js shows "Ready".
  start "" "http://localhost:3000"
  exit /b 0
)

start "ngrok tunnel" cmd /k "ngrok http 3000"
start "" "http://localhost:3000"
