# MINT Installer — v0.2.0
# Run as Administrator for best results
# Sets up: Node.js deps, Ollama, ComfyUI, Piper TTS, desktop shortcut

$ErrorActionPreference = "Continue"
$MINT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROGRAMS_DIR = "D:\AgentDevWork\Programs"

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  MINT AI Content Workstation Setup" -ForegroundColor Green
Write-Host "  v0.2.0" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# ─── Step 1: Check prerequisites ───────────────────────────────────
Write-Host "[1/7] Checking prerequisites..." -ForegroundColor Cyan

# Node.js
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "  ERROR: Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}
$nodeVer = & node --version
Write-Host "  Node.js $nodeVer OK" -ForegroundColor Green

# Git
$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
    Write-Host "  ERROR: Git not found. Install from https://git-scm.com" -ForegroundColor Red
    exit 1
}
Write-Host "  Git OK" -ForegroundColor Green

# ─── Step 2: Install npm dependencies ──────────────────────────────
Write-Host "[2/7] Installing npm dependencies..." -ForegroundColor Cyan
Set-Location $MINT_DIR
npm install --silent 2>$null
Set-Location "$MINT_DIR\backend"
npm install --silent 2>$null
Set-Location $MINT_DIR
Write-Host "  npm dependencies installed" -ForegroundColor Green

# ─── Step 3: Generate Prisma client ───────────────────────────────
Write-Host "[3/7] Setting up database..." -ForegroundColor Cyan
$env:DATABASE_URL = "file:../mint.db"
npx prisma generate --schema backend/prisma/schema.prisma 2>$null | Out-Null
Write-Host "  Prisma client generated" -ForegroundColor Green

# ─── Step 4: Install/configure Ollama ──────────────────────────────
Write-Host "[4/7] Checking Ollama..." -ForegroundColor Cyan
$ollama = Get-Command ollama -ErrorAction SilentlyContinue
if ($ollama) {
    $models = & ollama list 2>$null
    if ($models -match "llama3.2") {
        Write-Host "  Ollama + llama3.2 already installed" -ForegroundColor Green
    } else {
        Write-Host "  Pulling llama3.2 model (~2GB)..." -ForegroundColor Yellow
        & ollama pull llama3.2
        Write-Host "  llama3.2 installed" -ForegroundColor Green
    }
} else {
    Write-Host "  WARNING: Ollama not found. Install from https://ollama.ai" -ForegroundColor Yellow
    Write-Host "  Then run: ollama pull llama3.2" -ForegroundColor Yellow
}

# ─── Step 5: Install ComfyUI ───────────────────────────────────────
Write-Host "[5/7] Setting up ComfyUI..." -ForegroundColor Cyan
$comfyuiDir = "$PROGRAMS_DIR\comfyui"
$comfyuiExe = "$comfyuiDir\ComfyUI\main.py"
$comfyuiVenv = "$comfyuiDir\venv\Scripts\python.exe"
$comfyuiModel = "$comfyuiDir\ComfyUI\models\checkpoints\v1-5-pruned-emaonly.safetensors"

if (Test-Path $comfyuiExe) {
    Write-Host "  ComfyUI source already cloned" -ForegroundColor Green
} else {
    Write-Host "  Cloning ComfyUI..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $comfyuiDir | Out-Null
    git clone https://github.com/comfyanonymous/ComfyUI.git "$comfyuiDir\ComfyUI" 2>$null
}

if (Test-Path $comfyuiVenv) {
    Write-Host "  ComfyUI venv already exists" -ForegroundColor Green
} else {
    Write-Host "  Creating Python venv + installing PyTorch CUDA..." -ForegroundColor Yellow
    & python -m venv "$comfyuiDir\venv"
    & "$comfyuiDir\venv\Scripts\pip.exe" install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124 2>$null | Out-Null
    & "$comfyuiDir\venv\Scripts\pip.exe" install -r "$comfyuiDir\ComfyUI\requirements.txt" 2>$null | Out-Null
    Write-Host "  ComfyUI dependencies installed" -ForegroundColor Green
}

if (Test-Path $comfyuiModel) {
    Write-Host "  SD 1.5 model already downloaded" -ForegroundColor Green
} else {
    Write-Host "  Downloading SD 1.5 model (~4GB)..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path "$comfyuiDir\ComfyUI\models\checkpoints" | Out-Null
    Invoke-WebRequest -Uri "https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors" -OutFile $comfyuiModel -UseBasicParsing
    Write-Host "  SD 1.5 model downloaded" -ForegroundColor Green
}

# ─── Step 6: Install Piper TTS ─────────────────────────────────────
Write-Host "[6/7] Setting up Piper TTS..." -ForegroundColor Cyan
$piperDir = "$PROGRAMS_DIR\piper-tts"
$piperExe = "$piperDir\piper.exe"
$piperVoice = "$piperDir\voices\en_US-amy-medium.onnx"

if (Test-Path $piperExe) {
    Write-Host "  Piper TTS already installed" -ForegroundColor Green
} else {
    Write-Host "  Downloading Piper TTS..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $piperDir | Out-Null
    Invoke-WebRequest -Uri "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip" -OutFile "$piperDir\piper.zip" -UseBasicParsing
    Expand-Archive -Path "$piperDir\piper.zip" -DestinationPath $piperDir -Force
    Remove-Item "$piperDir\piper.zip" -ErrorAction SilentlyContinue
    # Move exe from subfolder
    $nested = Get-ChildItem "$piperDir" -Recurse -Filter "piper.exe" | Select-Object -First 1
    if ($nested) { Move-Item $nested.FullName $piperExe -Force }
    Get-ChildItem "$piperDir" -Directory | Where-Object { $_.Name -eq "piper" } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}

if (Test-Path $piperVoice) {
    Write-Host "  Voice model already installed" -ForegroundColor Green
} else {
    Write-Host "  Downloading voice model..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path "$piperDir\voices" | Out-Null
    Invoke-WebRequest -Uri "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx" -OutFile "$piperDir\voices\en_US-amy-medium.onnx" -UseBasicParsing
    Invoke-WebRequest -Uri "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json" -OutFile "$piperDir\voices\en_US-amy-medium.onnx.json" -UseBasicParsing
    Write-Host "  Voice model downloaded" -ForegroundColor Green
}

# ─── Step 7: Create .env files + desktop shortcuts ──────────────────
Write-Host "[7/7] Creating config and shortcuts..." -ForegroundColor Cyan

# backend/.env
if (-not (Test-Path "$MINT_DIR\backend\.env")) {
    @"
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
IMAGE_PROVIDER=stable-diffusion
COMFYUI_BASE_URL=http://localhost:8188
MONEY_PRINTER_BASE_URL=http://localhost:8501
TTS_PROVIDER=piper
PIPER_EXECUTABLE=$piperDir\piper.exe
PIPER_VOICE_DIR=$piperDir\voices
EDGE_TTS_VOICE=en-US-AmyNeural
JWT_SECRET=mint-dev-secret-change-in-production
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
DATABASE_URL=file:./mint.db
REDIS_URL=redis://localhost:6379
RESEARCH_PROVIDER=brave
BRAVE_SEARCH_API_KEY=
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=
S3_REGION=
"@ | Set-Content "$MINT_DIR\backend\.env" -Encoding UTF8
    Write-Host "  Created backend\.env" -ForegroundColor Green
}

# frontend/.env
if (-not (Test-Path "$MINT_DIR\frontend\.env")) {
    "VITE_API_URL=http://localhost:4000/api" | Set-Content "$MINT_DIR\frontend\.env" -Encoding UTF8
    Write-Host "  Created frontend\.env" -ForegroundColor Green
}

# backend/prisma/.env
if (-not (Test-Path "$MINT_DIR\backend\prisma\.env")) {
    @"
DATABASE_URL=file:../mint.db
"@ | Set-Content "$MINT_DIR\backend\prisma\.env" -Encoding UTF8
    Write-Host "  Created backend\prisma\.env" -ForegroundColor Green
}

# Desktop shortcut — Start MINT
$shortcutPath = [Environment]::GetFolderPath("Desktop") + "\MINT.lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "cmd.exe"
$shortcut.Arguments = "/c cd /d `"$MINT_DIR`" && start-mint.bat"
$shortcut.WorkingDirectory = $MINT_DIR
$shortcut.Description = "Start MINT AI Content Workstation"
$shortcut.IconLocation = "$MINT_DIR\frontend\public\favicon.png,0"
$shortcut.Save()
Write-Host "  Desktop shortcut created: MINT.lnk" -ForegroundColor Green

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start MINT:" -ForegroundColor Yellow
Write-Host "  1. Double-click 'MINT' on your Desktop" -ForegroundColor White
Write-Host "  2. Or run: start-mint.bat" -ForegroundColor White
Write-Host "  3. Open: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Services:" -ForegroundColor Yellow
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:   http://localhost:4000" -ForegroundColor White
Write-Host "  ComfyUI:   http://localhost:8188" -ForegroundColor White
Write-Host "  Ollama:    http://localhost:11434" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
