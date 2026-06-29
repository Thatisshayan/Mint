@echo off
title MINT Installer v0.2.0
echo ======================================
echo   MINT AI Content Workstation
echo   Installer v0.2.0
echo ======================================
echo.
echo This will install:
echo   - npm dependencies
echo   - ComfyUI (image generation)
echo   - Piper TTS (text-to-speech)
echo   - Ollama model (llama3.2)
echo   - Desktop shortcut
echo.
echo Requirements:
echo   - Node.js 18+ (https://nodejs.org)
echo   - Python 3.11+ (for ComfyUI)
echo   - NVIDIA GPU with 6GB+ VRAM (recommended)
echo.
pause
powershell -ExecutionPolicy Bypass -File "%~dp0install.ps1"
