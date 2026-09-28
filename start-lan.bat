@echo off
setlocal
cd /d "%~dp0"
title ScreenForge - Touch / LAN
where node >nul 2>nul
if errorlevel 1 goto missing
where npm >nul 2>nul
if errorlevel 1 goto missing
node -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a>22 || (a===22 && b>=12) ? 0 : 1)"
if errorlevel 1 goto missing
if not exist "node_modules\.bin\vite.cmd" (
  call npm ci
  if errorlevel 1 goto failed
)
echo Die Network-Adresse unten auf dem Touchgeraet im gleichen Netzwerk oeffnen.
echo Jedes Geraet spielt eine eigene Szene. Keine geraeteuebergreifende Regiesynchronisation.
call npm run dev -- --host 0.0.0.0
if errorlevel 1 goto failed
exit /b 0
:missing
echo Bitte Node.js 24 LTS inklusive npm installieren.
pause
exit /b 1
:failed
echo Start fehlgeschlagen. Installation und Port 5173 pruefen.
pause
exit /b 1
