@echo off
setlocal
cd /d "%~dp0"
title ScreenForge - Vite
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js fehlt. Bitte Node.js 24 LTS installieren: https://nodejs.org
  pause
  exit /b 1
)
node -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a>22 || (a===22 && b>=12) ? 0 : 1)"
if errorlevel 1 (
  echo Bitte Node.js 22.12 oder neuer installieren. Empfohlen: Node.js 24 LTS.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo npm fehlt. Bitte Node.js inklusive npm neu installieren.
  pause
  exit /b 1
)
if not exist "node_modules\.bin\vite.cmd" (
  echo Installiere Abhaengigkeiten. Beim ersten Start ist Internet erforderlich.
  call npm ci
  if errorlevel 1 (
    echo Installation fehlgeschlagen. Bitte die Meldungen oben pruefen.
    pause
    exit /b 1
  )
)
echo ScreenForge startet auf http://127.0.0.1:5173
echo Dieses Fenster offen lassen. Beenden mit Strg+C.
call npm run dev -- --open
if errorlevel 1 (
  echo Start fehlgeschlagen. Ist Port 5173 bereits belegt?
  pause
  exit /b 1
)
endlocal
