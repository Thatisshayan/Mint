@echo off
title MINT AI Content Workstation
cd /d "%~dp0"

echo ======================================
echo   Starting MINT AI Content Workstation
echo ======================================
echo.

:: Detect Ollama path
set "OLLAMA_PATH="
where ollama >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "OLLAMA_PATH=ollama"
) else if exist "C:\Users\%USERNAME%\AppData\Local\Programs\Ollama\ollama.exe" (
    set "OLLAMA_PATH=C:\Users\%USERNAME%\AppData\Local\Programs\Ollama\ollama.exe"
) else if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" (
    set "OLLAMA_PATH=%LOCALAPPDATA%\Programs\Ollama\ollama.exe"
)

:: Start Ollama (if not running)
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I "ollama.exe" >NUL
if %ERRORLEVEL% NEQ 0 (
    if defined OLLAMA_PATH (
        echo [1/4] Starting Ollama...
        start "" /B "%OLLAMA_PATH%" serve
        timeout /t 3 >NUL
    ) else (
        echo [1/4] WARNING: Ollama not found. AI chat features will not work.
        echo        Install from https://ollama.com/download
    )
) else (
    echo [1/4] Ollama already running.
)

:: Detect ComfyUI path
set "COMFYUI_VENV=%~dp0..\comfyui\venv\Scripts\python.exe"
set "COMFYUI_MAIN=%~dp0..\comfyui\ComfyUI\main.py"
if not exist "%COMFYUI_VENV%" (
    set "COMFYUI_VENV=D:\AgentDevWork\Programs\comfyui\venv\Scripts\python.exe"
    set "COMFYUI_MAIN=D:\AgentDevWork\Programs\comfyui\ComfyUI\main.py"
)

:: Start ComfyUI
if exist "%COMFYUI_VENV%" (
    echo [2/4] Starting ComfyUI...
    start "" "%COMFYUI_VENV%" "%COMFYUI_MAIN%" --listen 0.0.0.0 --port 8188
    timeout /t 8 >NUL
) else (
    echo [2/4] WARNING: ComfyUI not found. Image generation will not work.
    echo        Run installer with ComfyUI option or install manually.
)

:: Start Backend
echo [3/4] Starting MINT Backend...
start "" /D "%~dp0backend" cmd /c "node --import tsx/esm src/index.ts"
timeout /t 5 >NUL

:: Start Frontend
echo [4/4] Starting MINT Frontend...
start "" /D "%~dp0" cmd /c "node node_modules\vite\bin\vite.js --host"
timeout /t 3 >NUL

echo.
echo ======================================
echo   All services started!
echo ======================================
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:4000
echo   ComfyUI:   http://localhost:8188
echo   Ollama:    http://localhost:11434
echo   Piper TTS: %~dp0piper-tts\piper.exe
echo ======================================
echo.
echo Press any key to stop all services...
pause >NUL

:: Stop all services
call "%~dp0stop-mint.bat"
