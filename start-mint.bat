@echo off
title MINT AI Content Workstation
echo ======================================
echo   Starting MINT AI Content Workstation
echo ======================================
echo.

:: Start Ollama (if not running)
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I "ollama.exe" >NUL
if %ERRORLEVEL% NEQ 0 (
    echo [1/4] Starting Ollama...
    start "" /B "C:\Users\AgentDev\AppData\Local\Programs\Ollama\ollama.exe" serve
    timeout /t 3 >NUL
) else (
    echo [1/4] Ollama already running.
)

:: Start ComfyUI
echo [2/4] Starting ComfyUI...
start "ComfyUI" cmd /c "D:\AgentDevWork\Programs\comfyui\venv\Scripts\python.exe D:\AgentDevWork\Programs\comfyui\ComfyUI\main.py --listen 0.0.0.0 --port 8188"
timeout /t 8 >NUL

:: Start Backend (uses tsx for TypeScript, reads backend/.env)
echo [3/4] Starting MINT Backend...
start "MINT-Backend" cmd /c "cd /d D:\AgentDevWork\repos\.mint\MINT\backend && node --import tsx/esm src/index.ts"
timeout /t 5 >NUL

:: Start Frontend (Vite dev server)
echo [4/4] Starting MINT Frontend...
start "MINT-Frontend" cmd /c "cd /d D:\AgentDevWork\repos\.mint\MINT && npx vite --host"
timeout /t 3 >NUL

echo.
echo ======================================
echo   All services started!
echo ======================================
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:4000
echo   ComfyUI:   http://localhost:8188
echo   Ollama:    http://localhost:11434
echo   Piper TTS: D:\AgentDevWork\Programs\piper-tts\piper.exe
echo ======================================
echo.
echo Press any key to stop all services...
pause >NUL

:: Kill all services
echo Stopping services...
taskkill /FI "WINDOWTITLE eq ComfyUI*" /F >NUL 2>&1
taskkill /FI "WINDOWTITLE eq MINT-Backend*" /F >NUL 2>&1
taskkill /FI "WINDOWTITLE eq MINT-Frontend*" /F >NUL 2>&1
echo Services stopped.
