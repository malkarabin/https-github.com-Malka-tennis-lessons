@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

if not exist ".git" (
  echo This folder is not a git repository. Open the project root where .git exists.
  pause
  exit /b 1
)

echo Tennis Lessons - push to GitHub
echo Repository: %CD%
echo.

git remote get-url origin 1>nul 2>nul
if errorlevel 1 (
  echo No "origin" remote. Add it once with:
  echo   git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
  pause
  exit /b 1
)

REM Optional commit message: drag-and-drop this file onto cmd and add words, or:
REM   push-to-github.bat "your message here"
set "COMMIT_MSG=%~1"
if "!COMMIT_MSG!"=="" set "COMMIT_MSG=Update tennis-lessons app"

echo Staging all changes...
git add -A

git diff --staged --quiet
if errorlevel 1 (
  echo Committing: !COMMIT_MSG!
  git commit -m "!COMMIT_MSG!"
  if errorlevel 1 (
    echo Commit failed.
    pause
    exit /b 1
  )
) else (
  echo No file changes to commit ^(working tree already matched last commit^).
)

echo.
echo Pulling latest from origin/main ^(so push does not fail if GitHub has new commits^)...
git pull origin main
if errorlevel 1 (
  echo Pull failed. Fix conflicts if any, then run this script again.
  pause
  exit /b 1
)

echo.
echo Pushing to origin main...
git push -u origin main
if errorlevel 1 (
  echo Push failed. Check your network and GitHub login.
  pause
  exit /b 1
)

echo.
echo Done. Your app is on GitHub on branch main.
pause
