@echo off
echo ============================================
echo  Downloading Ollama...
echo ============================================
echo.

set "OLLAMA_URL=https://ollama.com/download/OllamaSetup.exe"
set "OLLAMA_INSTALLER=%TEMP%\OllamaSetup.exe"

echo Downloading from: %OLLAMA_URL%
echo Saving to: %OLLAMA_INSTALLER%
echo.

curl -L -o "%OLLAMA_INSTALLER%" "%OLLAMA_URL%"
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to download Ollama.
    echo Please download manually from https://ollama.com/download
    pause
    exit /b 1
)

echo.
echo Installing Ollama...
echo.
"%OLLAMA_INSTALLER%" /VERYSILENT /NORESTART
if %ERRORLEVEL% neq 0 (
    echo WARNING: Ollama installation may have failed.
    echo Please install manually from https://ollama.com/download
    pause
)

echo.
echo Ollama installation complete!
echo.
pause
