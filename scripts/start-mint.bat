@echo off
setlocal
cd /d %~dp0
start "MINT Backend" cmd /c "cd backend && node dist/index.js"
timeout /t 3 /nobreak >NUL
start "MINT Frontend" cmd /c "cd frontend && npm run dev"
endlocal
