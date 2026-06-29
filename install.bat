@echo off
title MINT AI Content Workstation — Installer
echo ======================================
echo   MINT AI Content Workstation Installer
echo ======================================
echo.
echo This installer will set up all local AI services for MINT.
echo.
echo Requirements:
echo   - Node.js 18+ (https://nodejs.org)
echo   - Ollama (https://ollama.ai)
echo   - NVIDIA GPU with 6GB+ VRAM (recommended)
echo.
pause

:: Check Node.js
echo [1/6] Checking Node.js...
node --version >NUL 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed.
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo   Node.js %NODE_VERSION% found.

:: Check Ollama
echo [2/6] Checking Ollama...
ollama --version >NUL 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Ollama is not installed.
    echo Please install Ollama from https://ollama.ai
    echo Then pull a model: ollama pull llama3.2
    echo.
    set /p CONTINUE="Continue without Ollama? (y/n): "
    if /i "%CONTINUE%" NEQ "y" exit /b 1
) else (
    echo   Ollama found.
)

:: Install npm dependencies
echo [3/6] Installing npm dependencies...
cd /d "%~dp0"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
)
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: backend npm install failed.
    pause
    exit /b 1
)
cd ..

:: Install ComfyUI
echo [4/6] Installing ComfyUI...
set COMFYUI_DIR=D:\AgentDevWork\Programs\comfyui
if not exist "%COMFYUI_DIR%" (
    echo   Creating ComfyUI directory...
    mkdir "%COMFYUI_DIR%" 2>NUL
)
if not exist "%COMFYUI_DIR%\ComfyUI" (
    echo   Cloning ComfyUI...
    cd /d "%COMFYUI_DIR%"
    git clone https://github.com/comfyanonymous/ComfyUI.git
    cd ComfyUI
    python -m venv ..\venv
    call ..\venv\Scripts\pip.exe install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
    call ..\venv\Scripts\pip.exe install -r requirements.txt
    cd /d "%~dp0"
) else (
    echo   ComfyUI already installed.
)

:: Install Piper TTS
echo [5/6] Installing Piper TTS...
set PIPER_DIR=D:\AgentDevWork\Programs\piper-tts
if not exist "%PIPER_DIR%" (
    mkdir "%PIPER_DIR%" 2>NUL
)
if not exist "%PIPER_DIR%\piper.exe" (
    echo   Downloading Piper TTS...
    cd /d "%PIPER_DIR%"
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip' -OutFile 'piper.zip' -UseBasicParsing"
    powershell -Command "Expand-Archive -Path 'piper.zip' -DestinationPath '.' -Force"
    del piper.zip 2>NUL
    mkdir voices 2>NUL
    powershell -Command "Invoke-WebRequest -Uri 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx' -OutFile 'voices\en_US-amy-medium.onnx' -UseBasicParsing"
    powershell -Command "Invoke-WebRequest -Uri 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json' -OutFile 'voices\en_US-amy-medium.onnx.json' -UseBasicParsing"
    cd /d "%~dp0"
) else (
    echo   Piper TTS already installed.
)

:: Create .env files
echo [6/6] Creating configuration files...
if not exist "backend\.env" (
    echo # LLM: Use Ollama locally (no API key needed) > backend\.env
    echo LLM_PROVIDER=ollama >> backend\.env
    echo OLLAMA_BASE_URL=http://localhost:11434 >> backend\.env
    echo. >> backend\.env
    echo # Image generation: Use ComfyUI >> backend\.env
    echo IMAGE_PROVIDER=stable-diffusion >> backend\.env
    echo COMFYUI_BASE_URL=http://localhost:8188 >> backend\.env
    echo. >> backend\.env
    echo # TTS: Use Piper >> backend\.env
    echo TTS_PROVIDER=piper >> backend\.env
    echo PIPER_EXECUTABLE=D:\AgentDevWork\Programs\piper-tts\piper.exe >> backend\.env
    echo PIPER_VOICE_DIR=D:\AgentDevWork\Programs\piper-tts\voices >> backend\.env
    echo. >> backend\.env
    echo # Auth >> backend\.env
    echo JWT_SECRET=mint-dev-secret-change-in-production >> backend\.env
    echo. >> backend\.env
    echo # Database (SQLite) >> backend\.env
    echo DATABASE_URL=file:./mint.db >> backend\.env
    echo. >> backend\.env
    echo # Research >> backend\.env
    echo RESEARCH_PROVIDER=brave >> backend\.env
    echo BRAVE_SEARCH_API_KEY= >> backend\.env
    echo   Created backend\.env
) else (
    echo   backend\.env already exists.
)

if not exist "frontend\.env" (
    echo VITE_API_URL=http://localhost:4000/api > frontend\.env
    echo   Created frontend\.env
) else (
    echo   frontend\.env already exists.
)

if not exist "backend\prisma\.env" (
    echo # Database only (Prisma needs this in its own .env) > backend\prisma\.env
    echo DATABASE_URL=file:../mint.db >> backend\prisma\.env
    echo   Created backend\prisma\.env
) else (
    echo   backend\prisma\.env already exists.
)

echo.
echo ======================================
echo   Installation Complete!
echo ======================================
echo.
echo To start MINT:
echo   1. Start Ollama: ollama serve
echo   2. Run: start-mint.bat
echo   3. Open: http://localhost:5173
echo.
echo Services:
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:4000
echo   ComfyUI:   http://localhost:8188
echo   Ollama:    http://localhost:11434
echo.
echo Press any key to exit...
pause >NUL
