@echo off
setlocal
cd /d "%~dp0"

if not exist "package.json" (
  echo Run this file from inside the tennis-lessons project folder ^(same folder as package.json^).
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo First-time setup: npm install...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo Tennis Lessons - http://localhost:3000
echo Keep the Next.js window open while you use the app.
echo.

start "Tennis Lessons - Next.js" cmd /k "npm run dev -- -p 3000"
timeout /t 5 /nobreak >nul
start "" "http://localhost:3000"
echo Browser opened. If it fails, wait a few seconds and refresh.
