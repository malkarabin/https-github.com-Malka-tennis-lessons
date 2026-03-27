@echo off
setlocal EnableDelayedExpansion
REM ============================================================
REM  Put this file anywhere (Desktop is fine). Double-click it.
REM  It clones your GitHub repo (or pulls if the folder already exists),
REM  runs npm install, starts the app, and opens the browser.
REM  Edit REPO_URL below if your GitHub repo address changes.
REM ============================================================

set "REPO_URL=https://github.com/malkarabin/https-github.com-Malka-tennis-lessons.git"
set "BRANCH=main"
set "FOLDER_NAME=tennis-lessons"

REM If this .bat sits next to package.json, you are already inside the repo — use run-app.bat instead.
if exist "%~dp0package.json" (
  echo You are already inside the project folder.
  echo To start the app, double-click run-app.bat
  pause
  exit /b 0
)

set "TARGET=%~dp0%FOLDER_NAME%"

where git >nul 2>nul
if errorlevel 1 (
  echo Git is not installed or not in PATH. Install Git from https://git-scm.com/download/win
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js/npm is not installed. Install from https://nodejs.org/
  pause
  exit /b 1
)

if exist "%TARGET%\.git" (
  echo Updating existing folder: %TARGET%
  cd /d "%TARGET%"
  git pull origin %BRANCH%
  if errorlevel 1 (
    echo git pull failed.
    pause
    exit /b 1
  )
) else if exist "%TARGET%" (
  echo Folder exists but is not a git clone: %TARGET%
  echo Remove or rename it, then run this script again.
  pause
  exit /b 1
) else (
  echo Cloning into: %TARGET%
  git clone -b %BRANCH% "%REPO_URL%" "%TARGET%"
  if errorlevel 1 (
    echo git clone failed. Check REPO_URL and your internet login.
    pause
    exit /b 1
  )
  cd /d "%TARGET%"
)

if not exist "package.json" (
  echo No package.json found. Wrong folder?
  pause
  exit /b 1
)

echo.
echo Installing dependencies ^(first time can take a minute^)...
call npm install
if errorlevel 1 (
  echo npm install failed.
  pause
  exit /b 1
)

echo.
echo Starting app on http://localhost:3000 ...
start "Tennis Lessons - Next.js" cmd /k "npm run dev -- -p 3000"
timeout /t 6 /nobreak >nul
start "" "http://localhost:3000"
echo.
echo Done. Keep the Next.js window open. Close it to stop the server.
pause
