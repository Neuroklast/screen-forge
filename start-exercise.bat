@echo off
setlocal
cd /d "%~dp0"
title ScreenForge - Exercise
where node >nul 2>nul
if errorlevel 1 (echo Install Node.js 24 LTS first. & pause & exit /b 1)
if not exist "node_modules\vite\package.json" (
  call npm ci
  if errorlevel 1 (pause & exit /b 1)
)
call npm run build
if errorlevel 1 (pause & exit /b 1)
echo Open http://localhost:8787/?role=trainer
echo The server prints the trainer key below. Keep this window open.
call npm run exercise
endlocal
