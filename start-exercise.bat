@echo off
setlocal
cd /d "%~dp0"
title ScreenForge - Exercise
if not exist "node_modules\ws\package.json" call npm i ws
start "ScreenForge exercise server" cmd /c "node server/exercise.mjs"
echo Trainer: http://127.0.0.1:5173/?role=trainer
echo HQ:      http://127.0.0.1:5173/?role=hq
echo Element: http://127.0.0.1:5173/?role=element^&station=med-1
call npm run dev -- --host
endlocal
