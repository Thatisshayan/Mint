@echo off
echo ============================================
echo  Downloading ComfyUI + SD 1.5 Model...
echo ============================================
echo.

set "INSTALL_DIR=%~1"
if "%INSTALL_DIR%"=="" set "INSTALL_DIR=D:\AgentDevWork\Programs\comfyui"

echo Install directory: %INSTALL_DIR%
echo.

REM Check if Python is available
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Python is not installed or not in PATH.
    echo Please install Python 3.10+ from https://python.org
    pause
    exit /b 1
)

REM Check if git is available
git --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Git is not installed or not in PATH.
    echo Please install Git from https://git-scm.com
    pause
    exit /b 1
)

REM Create directory
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM Clone ComfyUI
echo Cloning ComfyUI...
cd /d "%INSTALL_DIR%"
git clone https://github.com/comfyanonymous/ComfyUI.git
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to clone ComfyUI.
    pause
    exit /b 1
)

REM Install PyTorch with CUDA support
echo.
echo Installing PyTorch with CUDA 12.4 support...
cd ComfyUI
python -m venv venv
call venv\Scripts\activate.bat
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
if %ERRORLEVEL% neq 0 (
    echo WARNING: PyTorch CUDA install failed. Trying CPU version...
    pip install torch torchvision torchaudio
)

REM Install ComfyUI requirements
echo.
echo Installing ComfyUI requirements...
pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo WARNING: Some requirements may have failed.
)

REM Download SD 1.5 model
echo.
echo Downloading SD 1.5 model (~4GB)...
echo This may take several minutes depending on your internet speed.
echo.
set "MODEL_DIR=%INSTALL_DIR%\ComfyUI\models\checkpoints"
if not exist "%MODEL_DIR%" mkdir "%MODEL_DIR%"

curl -L -o "%MODEL_DIR%\v1-5-pruned-emaonly.safetensors" "https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors"
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to download SD 1.5 model.
    echo Please download manually from:
    echo https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5
    pause
    exit /b 1
)

echo.
echo ComfyUI + SD 1.5 model installation complete!
echo.
pause
