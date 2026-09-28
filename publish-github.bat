@echo off
setlocal
cd /d "%~dp0"
where gh >nul 2>nul
if errorlevel 1 (
  echo GitHub CLI fehlt: https://cli.github.com
  pause
  exit /b 1
)
gh auth status
if errorlevel 1 (
  echo Bitte zuerst gh auth login ausfuehren.
  pause
  exit /b 1
)
git remote get-url origin >nul 2>nul
if not errorlevel 1 (
  echo Ein origin-Remote existiert bereits. Kein neues Repository angelegt.
  pause
  exit /b 1
)
echo Erstellt ein privates Repository namens screenforge im oben angezeigten Konto.
choice /M "Repository erstellen und Commit pushen"
if errorlevel 2 exit /b 0
gh repo create screenforge --private --source=. --remote=origin --push
if errorlevel 1 (
  echo Erstellung oder Push fehlgeschlagen. Meldung oben pruefen.
  pause
  exit /b 1
)
pause
