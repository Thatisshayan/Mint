@echo off
setlocal
cd /d "%~dp0.."
set VITE_PORT=5173
start "MINT Frontend" cmd /c "npm run dev"
endlocal
